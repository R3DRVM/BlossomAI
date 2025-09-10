export interface YieldRow {
  protocol: string;
  chain: string;
  asset: string;
  apy: number;
  tvlUSD: number;
  risk: 'low' | 'medium' | 'high';
  url?: string;
}

export interface YieldsResponse {
  updatedAt: number;
  yields: YieldRow[];
}

/**
 * Fetch live yields for specified protocols and chains
 */
export async function fetchYields(opts: { chain?: string; protocols?: string[] }): Promise<YieldRow[]> {
  try {
    const params = new URLSearchParams();
    if (opts.chain) params.set('chain', opts.chain);
    if (opts.protocols) params.set('protocols', opts.protocols.join(','));
    
    const response = await fetch(`/api/live-yields?${params.toString()}`, {
      credentials: 'include',
      headers: {
        'x-app-layer': 'api'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data: YieldsResponse = await response.json();
    return data.yields || [];
  } catch (error) {
    console.warn('Live yields fetch failed, using fallback:', error);
    return getFallbackYields(opts);
  }
}

/**
 * Fallback yields when live data is unavailable
 */
function getFallbackYields(opts: { chain?: string; protocols?: string[] }): YieldRow[] {
  const fallbackYields: YieldRow[] = [
    // Solana protocols
    { protocol: 'Jito (Liquid Staking)', chain: 'solana', asset: 'SOL', apy: 0.0644, tvlUSD: 3112526444, risk: 'low' },
    { protocol: 'Raydium', chain: 'solana', asset: 'USDC', apy: 0.085, tvlUSD: 1200000000, risk: 'medium' },
    { protocol: 'Kamino', chain: 'solana', asset: 'USDC', apy: 0.092, tvlUSD: 800000000, risk: 'medium' },
    { protocol: 'Jupiter Lend', chain: 'solana', asset: 'USDC', apy: 0.078, tvlUSD: 600000000, risk: 'low' },
    { protocol: 'Orca', chain: 'solana', asset: 'USDC', apy: 0.082, tvlUSD: 900000000, risk: 'medium' },
    { protocol: 'Sanctum Infinity', chain: 'solana', asset: 'SOL', apy: 0.071, tvlUSD: 500000000, risk: 'low' },
    { protocol: 'Save (marginfi Save)', chain: 'solana', asset: 'USDC', apy: 0.075, tvlUSD: 400000000, risk: 'low' },
    { protocol: 'Meteora vaults', chain: 'solana', asset: 'USDC', apy: 0.088, tvlUSD: 300000000, risk: 'medium' },
    
    // Injective protocols
    { protocol: 'HYDRO', chain: 'injective', asset: 'USDC', apy: 0.095, tvlUSD: 200000000, risk: 'medium' },
    { protocol: 'Helix', chain: 'injective', asset: 'USDC', apy: 0.088, tvlUSD: 150000000, risk: 'medium' },
    { protocol: 'Neptune Finance', chain: 'injective', asset: 'USDC', apy: 0.092, tvlUSD: 120000000, risk: 'medium' },
    { protocol: 'Hydro Lending', chain: 'injective', asset: 'USDC', apy: 0.085, tvlUSD: 100000000, risk: 'low' },
    { protocol: 'Helix Spot', chain: 'injective', asset: 'USDC', apy: 0.082, tvlUSD: 80000000, risk: 'low' },
    { protocol: 'Mito Finance', chain: 'injective', asset: 'USDC', apy: 0.098, tvlUSD: 60000000, risk: 'high' },
    { protocol: 'Dojoswap', chain: 'injective', asset: 'USDC', apy: 0.085, tvlUSD: 50000000, risk: 'medium' },
    { protocol: 'Dojoswap LSD', chain: 'injective', asset: 'INJ', apy: 0.078, tvlUSD: 40000000, risk: 'low' },
  ];
  
  let filtered = fallbackYields;
  
  if (opts.chain) {
    filtered = filtered.filter(y => y.chain === opts.chain);
  }
  
  if (opts.protocols && opts.protocols.length > 0) {
    filtered = filtered.filter(y => 
      opts.protocols!.some(p => y.protocol.toLowerCase().includes(p.toLowerCase()))
    );
  }
  
  return filtered;
}



