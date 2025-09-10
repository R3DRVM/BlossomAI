export type LiveProto = {
  id: string; protocol: string; chain: 'solana'|'injective'; asset: string;
  apy: number; tvlUSD: number; risk: 'low'|'medium'|'high'; url?: string;
};
export type LiveBundle = { updatedAt: number; protocols: LiveProto[] };



