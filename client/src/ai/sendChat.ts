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

const getApiBase = () => {
  return import.meta.env.VITE_API_BASE || 'http://localhost:5050';
};

export async function sendChat({ sessionId, message, stream = false }: SendChatOptions): Promise<ChatResponse> {
  const apiBase = getApiBase();
  
  if (stream) {
    // SSE Stream path
    const url = `${apiBase}/api/demo/chat/stream?sessionId=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(message)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`SSE failed: HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body for SSE');
    }

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
    const response = await fetch(`${apiBase}/api/demo/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
