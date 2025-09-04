import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/dev/ErrorBoundary";
import "./index.css";

// Global crash logging so we can see errors even if UI fails early
window.addEventListener('error', (e) => console.error('[boot:error]', e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => console.error('[boot:unhandled]', e.reason));

// Boot probe
(window as any).__BLOSSOM = { flags: import.meta.env };
console.info("[blossom] boot:start", location.pathname, import.meta.env);

// Environment sanity check
const feOrigin = location.origin;
const apiBase = import.meta.env.VITE_API_BASE;
console.info(`[blossom] feOrigin=${feOrigin} apiBase=${apiBase}`);

// Check for origin family mismatch
const feHostname = new URL(feOrigin).hostname;
const apiHostname = apiBase ? new URL(apiBase).hostname : null;

if (apiHostname && feHostname !== apiHostname) {
  const feFamily = feHostname === 'localhost' ? 'localhost' : 
                   feHostname === '127.0.0.1' ? '127.0.0.1' : 
                   feHostname === '[::1]' || feHostname === '::1' ? '[::1]' : 'other';
  const apiFamily = apiHostname === 'localhost' ? 'localhost' : 
                    apiHostname === '127.0.0.1' ? '127.0.0.1' : 
                    apiHostname === '[::1]' || apiHostname === '::1' ? '[::1]' : 'other';
  
  if (feFamily !== apiFamily) {
    console.warn(`[blossom] origin family mismatch: FE=${feFamily} API=${apiFamily}`);
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

// Frontend fetch interceptor for debugging
        if (import.meta.env.DEV) {
          // nuke any stale service workers that might pin old hosts
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
          }
          
          // Install 403 overlay
          import('./dev/overlay').then(m => m.installDev403Overlay());
          
          // Run positions smoke test
          import('./dev/positionsSmoke').then(m => m.positionsSmoke());
  
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    const method = init?.method || 'GET';
    
    try {
      const response = await originalFetch(input, init);
      const traceId = response.headers.get('x-trace-id') || 'none';
      console.log(`[FE-FETCH] method=${method} url=${url} status=${response.status} traceId=${traceId}`);
      return response;
    } catch (error) {
      console.log(`[FE-FETCH] method=${method} url=${url} error=${error}`);
      throw error;
    }
  };
  
  // Add dev diagnostic badge
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 1000;
    background: rgba(0,0,0,0.8); color: white; padding: 8px 12px;
    border-radius: 6px; font-family: monospace; font-size: 12px;
    max-width: 300px; word-break: break-all;
  `;
  badge.innerHTML = `
    <div>apiBase: ${import.meta.env.VITE_API_BASE || 'empty'}</div>
    <div>origin: ${location.origin}</div>
    <div>proxy: ${import.meta.env.VITE_DEV_PROXY || 'false'}</div>
  `;
  document.body.appendChild(badge);
  
  // Auto-hide after 10 seconds
  setTimeout(() => badge.remove(), 10000);
}

// Boot completion probe
setTimeout(() => console.info("[blossom] boot:ok", location.pathname), 0);
