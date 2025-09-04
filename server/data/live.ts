import fetch from 'node-fetch';
import { PROTOCOLS, Chain } from './protocols.map';

type ProtoRow = {
  id: string; protocol: string; chain: Chain; asset: string;
  apy: number; tvlUSD: number; risk: 'low'|'medium'|'high'; url?: string;
};

export type LiveBundle = { updatedAt: number; protocols: ProtoRow[] };

const TTL = Number(process.env.LIVE_REFRESH_MS ?? 60_000);
const TIMEOUT = Number(process.env.LIVE_TIMEOUT_MS ?? 6_000);

let CACHE: LiveBundle | null = null;
let INFLIGHT: Promise<LiveBundle> | null = null;

const withTimeout = <T>(p: Promise<T>, ms = TIMEOUT) =>
  Promise.race([p, new Promise<never>((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);

async function fetchLlamaPools() {
  const r = await withTimeout(fetch('https://yields.llama.fi/pools'));
  if (!(r as any).ok) throw new Error('llama_http');
  const j = await (r as any).json() as { data: any[] };
  return j.data ?? [];
}

function riskBucket(apy:number, tvl:number): 'low'|'medium'|'high' {
  if (tvl > 500_000_000 && apy <= 8) return 'low';
  if (tvl > 100_000_000 && apy <= 15) return 'medium';
  return 'high';
}

function normalize(pools:any[]): ProtoRow[] {
  const out: ProtoRow[] = [];
  for (const hint of PROTOCOLS) {
    const cand = pools.filter((p:any)=>
      typeof p.project==='string' &&
      p.project.toLowerCase().includes(hint.projectHint.toLowerCase()) &&
      typeof p.chain==='string' &&
      p.chain.toLowerCase()===hint.chain
    );
    if (!cand.length) continue;
    // Pick the highest TVL pool for that protocol/chain
    const top = cand.sort((a:any,b:any)=>(Number(b.tvlUsd||0)-Number(a.tvlUsd||0)))[0];
    const apy = Number(top.apy ?? top.apyBase ?? 0) || 0;
    const tvl = Number(top.tvlUsd ?? 0) || 0;
    const sym = (top.symbol||'').toUpperCase();
    const asset = hint.defaultAsset || (sym.split('-')[0] || 'USDC');
    out.push({
      id: `${hint.protocol.toLowerCase()}:${hint.chain}:${asset}`,
      protocol: hint.protocol,
      chain: hint.chain,
      asset,
      apy,
      tvlUSD: tvl,
      risk: riskBucket(apy, tvl),
      url: top.poolMeta || top.url || undefined,
    });
  }
  return out;
}

export async function getLiveBundle(): Promise<LiveBundle> {
  const now = Date.now();
  if (CACHE && now - CACHE.updatedAt < TTL) return CACHE;
  if (INFLIGHT) return INFLIGHT;

  INFLIGHT = (async () => {
    try {
      const pools = await fetchLlamaPools();
      const protocols = normalize(pools);
      CACHE = { updatedAt: Date.now(), protocols };
      return CACHE!;
    } finally { INFLIGHT = null; }
  })();

  return INFLIGHT;
}


