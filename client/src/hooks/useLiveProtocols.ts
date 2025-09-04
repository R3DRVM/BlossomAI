import { useQuery } from '@tanstack/react-query';
import { fetchLiveProtocols } from '@/lib/liveClient';

export function useLiveProtocols(params?: { chain?: string; asset?: string }) {
  return useQuery({
    queryKey: ['liveProtocols', params?.chain ?? '', params?.asset ?? ''],
    queryFn: () => fetchLiveProtocols(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}


