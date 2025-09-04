import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, url: string, method: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Dispatch 403 events for debugging
    if (res.status === 403) {
      let bodyExcerpt = '';
      let why = 'unknown';
      
      try {
        const body = JSON.parse(text);
        why = body.why || 'unknown';
        bodyExcerpt = JSON.stringify(body).substring(0, 200);
      } catch {
        bodyExcerpt = text.substring(0, 200);
      }
      
      window.dispatchEvent(new CustomEvent('blossom:403', {
        detail: {
          url,
          status: res.status,
          method,
          bodyExcerpt,
          why,
          origin: location.origin
        }
      }));
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

// In development with proxy -> use relative path
const getApiBase = () => {
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY) {
    return ''; // so fetch('/api/...') is same-origin via Vite proxy
  }
  // else fall back to VITE_API_BASE or default http://localhost:5050
  return import.meta.env.VITE_API_BASE || 'http://localhost:5050';
};

export const API_BASE = getApiBase();

// Log network mode at boot
const logNetworkMode = () => {
  const isProxyMode = import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === '1';
  const apiBase = getApiBase();
  const mode = isProxyMode ? 'proxy' : 'direct';
  
  console.log(`[blossom] net:mode=${mode}, apiBase='${apiBase}', origin=${location.origin}`);
};

// Log once at module load
logNetworkMode();

// Debug probes for development
if (import.meta.env.DEV) {
  // Add debug functions to window for console access
  (window as any).blossomDebug = {
    async healthCheck() {
      try {
        const apiBase = getApiBase();
        const url = `${apiBase}/api/demo/health`;
        console.log(`[blossom] debug:health:connecting ${url}`);
        
        const response = await fetch(url, { 
          credentials: 'include',
          headers: { 
            'X-Trace-Id': `debug-health-${Date.now()}`,
            'x-app-layer': 'api'
          }
        });
        
        console.log(`[blossom] debug:health:status ${response.status}`);
        const text = await response.text();
        console.log(`[blossom] debug:health:response`, text);
        
        return { status: response.status, response: text };
      } catch (error) {
        console.log(`[blossom] debug:health:error`, error);
        throw error;
      }
    },
    
    async corsEcho() {
      try {
        const apiBase = getApiBase();
        const url = `${apiBase}/api/cors/echo`;
        console.log(`[blossom] debug:cors:connecting ${url}`);
        
        const response = await fetch(url, { 
          credentials: 'include',
          headers: { 
            'X-Trace-Id': `debug-cors-${Date.now()}`,
            'x-app-layer': 'api'
          }
        });
        
        console.log(`[blossom] debug:cors:status ${response.status}`);
        const json = await response.json();
        console.log(`[blossom] debug:cors:response`, json);
        
        return { status: response.status, response: json };
      } catch (error) {
        console.log(`[blossom] debug:cors:error`, error);
        throw error;
      }
    },
    
    getNetworkMode() {
      const isProxyMode = import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === '1';
      const apiBase = getApiBase();
      const mode = isProxyMode ? 'proxy' : 'direct';
      
      return {
        mode,
        apiBase,
        origin: location.origin,
        env: {
          DEV: import.meta.env.DEV,
          VITE_DEV_PROXY: import.meta.env.VITE_DEV_PROXY,
          VITE_API_BASE: import.meta.env.VITE_API_BASE
        }
      };
    }
  };
  
  console.log(`[blossom] debug:available - use blossomDebug.healthCheck(), blossomDebug.corsEcho(), or blossomDebug.getNetworkMode()`);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure URL is absolute
  const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url.startsWith('/') ? '' : '/'}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { 
      "Content-Type": "application/json",
      "x-app-layer": "api"
    } : { "x-app-layer": "api" },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, fullUrl, method);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith('http') ? url : `${getApiBase()}${url.startsWith('/') ? '' : '/'}${url}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res, fullUrl, 'GET');
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
