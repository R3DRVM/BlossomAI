import type { LiveBundle } from '@/types/live';

export async function fetchLiveProtocols(params?: { chain?: string; asset?: string }): Promise<LiveBundle> {
  const q = new URLSearchParams();
  if (params?.chain) q.set('chain', params.chain);
  if (params?.asset) q.set('asset', params.asset);
  const r = await fetch(`/api/live/protocols${q.toString() ? `?${q}` : ''}`, { credentials: 'include' });
  if (!r.ok) throw new Error('live_http');
  return await r.json();
}


