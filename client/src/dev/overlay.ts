export function installDev403Overlay() {
  if (!import.meta.env.DEV) return;
  const origFetch = window.fetch;
  (window as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await origFetch(input, init);
    if (res.status === 403) {
      try {
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;right:12px;bottom:12px;background:#111;color:#fff;padding:10px 12px;border-radius:10px;z-index:999999;font:12px/1.3 ui-monospace,monospace;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:60ch';
        const url = typeof input === 'string' ? input : (input as any)?.url ?? '(Request)';
        el.innerHTML = `<b>403</b> on <code>${url}</code><br/><small>mode=dev proxy=${import.meta.env.VITE_DEV_PROXY ? 'on' : 'off'} base="${import.meta.env.VITE_API_BASE||''}"</small>`;
        document.body.appendChild(el);
        setTimeout(()=>el.remove(), 8000);
      } catch {}
    }
    return res;
  };
}


