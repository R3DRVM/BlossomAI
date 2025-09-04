/**
 * Single helper for all chat API communication
 * Handles both JSON and SSE paths with proper CORS and credentials
 */

interface SendChatOptions {
  sessionId: string;
  message: string;
  stream?: boolean;
}

interface ChatResponse {
  schemaVersion: string;
  planSummary?: string;
  allocations?: Array<{
    asset: string;
    chain: string;
    protocol: string;
    estApy: number;
    tvl: number;
    riskLabel: string;
    amountPct?: number;
    amount?: number;
  }>;
  portfolioStats?: any;
  triggers?: any[];
  strategy?: any;
  [key: string]: any;
}

// In development with proxy -> use relative path
const getApiBase = () => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY) {
    return ''; // so fetch('/api/...') is same-origin via Vite proxy
  }
  // else fall back to VITE_API_BASE or default http://localhost:5050
  return import.meta.env.VITE_API_BASE || 'http://localhost:5050';
};

const API_BASE = getApiBase();

export async function sendChat({ sessionId, message, stream = false }: SendChatOptions): Promise<ChatResponse> {
  const apiBase = getApiBase();
  
  if (stream) {
    // SSE Stream path
    const url = `${apiBase}/api/demo/chat/stream?sessionId=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(message)}`;
    
    // Log SSE connection attempt
    console.log(`sse:connecting ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'x-app-layer': 'api',
        // Add trace ID for debugging in dev
        ...(import.meta.env.DEV && { 'X-Trace-Id': `sse-${Date.now()}` }),
      },
    });

    if (!response.ok) {
      console.log(`sse:error ${response.status} ${response.statusText}`);
      throw new Error(`SSE failed: HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      console.log(`sse:error no-body`);
      throw new Error('No response body for SSE');
    }

    console.log(`sse:open ${url}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let finalPayload: ChatResponse | null = null;
    let firstChunkReceived = false;

    // Set timeout for first chunk (1200ms)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('SSE timeout - no first chunk within 1200ms')), 1200);
    });

    try {
      while (true) {
        const result = await Promise.race([
          reader.read(),
          firstChunkReceived ? new Promise<never>(() => {}) : timeoutPromise
        ]);

        if (result.done) break;

        if (!firstChunkReceived) {
          firstChunkReceived = true;
        }

        const chunk = decoder.decode(result.value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              if (finalPayload) {
                return finalPayload;
              }
              throw new Error('SSE completed without final payload');
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.final) {
                finalPayload = parsed.final;
              }
            } catch (e) {
              // Ignore parse errors for tokens
            }
          }
        }
      }

      if (finalPayload) {
        return finalPayload;
      }
      throw new Error('SSE stream ended without final payload');

    } catch (error) {
      reader.releaseLock();
      throw error;
    }
  } else {
    // JSON path (default)
    const url = `${apiBase}/api/demo/chat`;
    console.log(`json:connecting ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-layer': 'api',
        // Add trace ID for debugging in dev
        ...(import.meta.env.DEV && { 'X-Trace-Id': `json-${Date.now()}` }),
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionId,
        message,
      }),
    });

    if (!response.ok) {
      console.log(`json:error ${response.status} ${response.statusText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log(`json:success ${url}`);
    return response.json();
  }
}
