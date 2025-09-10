import fetch from 'node-fetch';
import { PROTOCOLS, Chain } from './protocols.map';

type ProtoRow = {
  id: string; protocol: string; chain: Chain; asset: string;
  apy: number; tvlUSD: number; risk: 'low'|'medium'|'high'; url?: string;
};

export type LiveBundle = { updatedAt: number; protocols: ProtoRow[] };

const TTL = Number(process.env.LIVE_REFRESH_MS ?? 60_000);
const TIMEOUT = Number(process.env.LIVE_TIMEOUT_MS ?? 6_000);

let CACHE: LiveBundle | null = null; // Cache cleared
let INFLIGHT: Promise<LiveBundle> | null = null;

const withTimeout = <T>(p: Promise<T>, ms = TIMEOUT) =>
  Promise.race([p, new Promise<never>((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);

async function fetchLlamaPools() {
  console.log('[live:fetchLlamaPools] Fetching from DefiLlama API...');
  const r = await withTimeout(fetch('https://yields.llama.fi/pools'));
  if (!(r as any).ok) throw new Error('llama_http');
  const j = await (r as any).json() as { data: any[] };
  console.log(`[live:fetchLlamaPools] Received ${j.data?.length || 0} pools from DefiLlama`);
  return j.data ?? [];
}

function riskBucket(apy:number, tvl:number): 'low'|'medium'|'high' {
  if (tvl > 500_000_000 && apy <= 8) return 'low';
  if (tvl > 100_000_000 && apy <= 15) return 'medium';
  return 'high';
}

function normalize(pools:any[]): ProtoRow[] {
  const out: ProtoRow[] = [];
  console.log(`[live:normalize] Processing ${pools.length} pools for ${PROTOCOLS.length} protocols`);
  
  for (const hint of PROTOCOLS) {
    try {
      const cand = pools.filter((p:any)=>
        typeof p.project==='string' &&
        p.project.toLowerCase().includes(hint.projectHint.toLowerCase()) &&
        typeof p.chain==='string' &&
        p.chain.toLowerCase()===hint.chain.toLowerCase()
      );
      
      console.log(`[live:normalize] ${hint.protocol} (${hint.projectHint}): found ${cand.length} candidates`);
      if (!cand.length) {
        console.log(`[live:normalize] Skipping ${hint.protocol} - no candidates found`);
        continue;
      }
      
      console.log(`[live:normalize] Processing ${hint.protocol} with ${cand.length} candidates...`);
      
      // Filter by asset if specified, otherwise get the best pool
      let filteredCand = cand;
      if (hint.defaultAsset) {
        // Look for pools with the specific asset (flexible matching)
        const exactMatches = cand.filter((p:any) => {
          if (!p.symbol) return false;
          const symbol = p.symbol.toUpperCase();
          const targetAsset = hint.defaultAsset!.toUpperCase();
          return symbol === targetAsset;
        });
        
        const partialMatches = cand.filter((p:any) => {
          if (!p.symbol) return false;
          const symbol = p.symbol.toUpperCase();
          const targetAsset = hint.defaultAsset!.toUpperCase();
          
          // Contains match (e.g., "SOL-USDC" contains "USDC")
          if (symbol.includes(targetAsset)) return true;
          // For USDC, also check for common trading pairs
          if (targetAsset === 'USDC' && (symbol.includes('USDC') || symbol.includes('USD'))) return true;
          // For SOL, also check for staked variants
          if (targetAsset === 'SOL' && (symbol.includes('SOL') || symbol.includes('MSOL') || symbol.includes('JITOSOL') || symbol.includes('BNSOL'))) return true;
          
          return false;
        });
        
        // Prioritize exact matches, then partial matches
        filteredCand = exactMatches.length > 0 ? exactMatches : partialMatches;
        
        // If no specific asset found, fall back to all pools
        if (filteredCand.length === 0) {
          console.log(`[live:normalize] ${hint.protocol} - no asset matches, falling back to all ${cand.length} pools`);
          filteredCand = cand;
        }
        console.log(`[live:normalize] ${hint.protocol} - final filtered candidates: ${filteredCand.length}`);
      } else {
        console.log(`[live:normalize] ${hint.protocol} - no asset filtering, using all ${cand.length} candidates`);
      }
      
      // Pick the highest TVL pool from filtered candidates
      const top = filteredCand.sort((a:any,b:any)=>(Number(b.tvlUsd||0)-Number(a.tvlUsd||0)))[0];
      let apy = Number(top.apy ?? top.apyBase ?? 0) || 0;
      
      console.log(`[live:normalize] ${hint.protocol} top pool: ${top.project} - ${top.symbol} - ${apy}% APY - $${(top.tvlUsd || 0).toLocaleString()} TVL`);
      
      // DefiLlama returns APY as a decimal (0.0644 = 6.44%)
      // Convert to percentage for consistency
      if (apy > 0 && apy < 1) {
        apy = apy * 100;
      }
      
      const tvl = Number(top.tvlUsd ?? 0) || 0;
      const sym = (top.symbol||'').toUpperCase();
      const asset = hint.defaultAsset || (sym.split('-')[0] || 'USDC');
      
      // Cap unrealistic APY values
      if (apy > 1000) {
        console.log(`[live] Capping unrealistic APY: ${apy}% for ${hint.protocol} - ${asset}`);
        apy = 0;
      }
      
      // Debug logging for high APY values
      if (apy > 50) {
        console.log(`[live] High APY detected: ${apy}% for ${hint.protocol} - ${asset} (original: ${top.apy ?? top.apyBase})`);
      }
      const protocol = {
        id: `${hint.protocol.toLowerCase()}:${hint.chain}:${asset}`,
        protocol: hint.protocol,
        chain: hint.chain,
        asset,
        apy,
        tvlUSD: tvl,
        risk: riskBucket(apy, tvl),
        url: top.poolMeta || top.url || undefined,
      };
      
      console.log(`[live:normalize] Adding protocol:`, protocol);
      out.push(protocol);
    } catch (error) {
      console.error(`[live:normalize] Error processing ${hint.protocol}:`, error);
    }
  }
  console.log(`[live:normalize] Returning ${out.length} protocols`);
  return out;
}

export async function getLiveBundle(): Promise<LiveBundle> {
  console.log('[getLiveBundle] Called at', new Date().toISOString());
  const now = Date.now();
  if (CACHE && now - CACHE.updatedAt < TTL) {
    console.log('[getLiveBundle] Returning cached data');
    return CACHE;
  }
  if (INFLIGHT) {
    console.log('[getLiveBundle] Returning inflight promise');
    return INFLIGHT;
  }

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


