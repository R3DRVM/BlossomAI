import type { LiveBundle } from '@/types/live';

export async function fetchLiveProtocols(chain?: string): Promise<any[]> {
  const q = new URLSearchParams();
  if (chain) q.set('chain', chain);
  const r = await fetch(`/api/live-yields${q.toString() ? `?${q}` : ''}`, { credentials: 'include' });
  if (!r.ok) throw new Error('live_http');
  const data = await r.json();
  return data.yields || [];
}


