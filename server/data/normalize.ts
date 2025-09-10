import { TokenPrice, YieldOpportunity, ProtocolTVL, RiskScore } from "./types.ts";

// DefiLlama price normalization
export function normalizeDefiLlamaPrices(rawData: any): TokenPrice[] {
  if (!rawData || typeof rawData !== 'object') return [];
  
  return Object.entries(rawData).map(([symbol, data]: [string, any]) => ({
    symbol: symbol.toUpperCase(),
    price: parseFloat(data.usd) || 0,
    change24h: parseFloat(data.usd_24h_change) || 0,
    marketCap: parseFloat(data.usd_market_cap) || undefined,
    volume24h: parseFloat(data.usd_24h_vol) || undefined,
  }));
}

// DefiLlama yield normalization
export function normalizeDefiLlamaYields(rawData: any): YieldOpportunity[] {
  if (!Array.isArray(rawData)) return [];
  
  return rawData.map((item: any) => {
    // DefiLlama returns APY as a decimal (0.0644 = 6.44%)
    // We need to convert it to percentage for display
    let apy = parseFloat(item.apy) || parseFloat(item.apr) || 0;
    
    // Debug logging for APY values
    if (apy > 100) {
      console.log(`[normalize] High APY detected: ${apy}% for ${item.protocol} - ${item.name}`);
    }
    
    // If APY is already in percentage format (> 1), keep it as is
    // If APY is in decimal format (< 1), convert to percentage
    if (apy > 0 && apy < 1) {
      apy = apy * 100;
    }
    
    // Cap APY at 1000% to filter out unrealistic values
    if (apy > 1000) {
      console.log(`[normalize] Capping unrealistic APY: ${apy}% for ${item.protocol} - ${item.name}`);
      apy = 0; // Set to 0 for unrealistic values
    }
    
    return {
      id: item.pool || item.id || `yield-${Date.now()}`,
      name: item.name || item.pool || 'Unknown',
      protocol: item.protocol || 'Unknown',
      chain: item.chain || 'ethereum',
      apy: apy,
      tvl: parseFloat(item.tvlUsd) || parseFloat(item.tvl) || 0,
      riskScore: calculateRiskScore(item),
      assets: Array.isArray(item.underlyingTokens) 
        ? item.underlyingTokens.map((t: any) => t.symbol || t)
        : [item.symbol || 'Unknown'],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// DefiLlama TVL normalization
export function normalizeDefiLlamaTVL(rawData: any): ProtocolTVL[] {
  if (!Array.isArray(rawData)) return [];
  
  return rawData.map((item: any) => ({
    id: item.id || `tvl-${Date.now()}`,
    name: item.name || 'Unknown',
    chain: item.chain || 'ethereum',
    tvl: parseFloat(item.tvl) || 0,
    change24h: parseFloat(item.change_1d) || 0,
    protocols: Array.isArray(item.protocols) 
      ? item.protocols.map((p: any) => p.name || p)
      : [],
  }));
}

// Risk score calculation (simplified)
function calculateRiskScore(item: any): number {
  // Simple heuristic based on TVL and age
  const tvl = parseFloat(item.tvlUsd) || parseFloat(item.tvl) || 0;
  const age = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  let score = 5; // Base score
  
  // TVL-based adjustments
  if (tvl > 1000000) score -= 1; // High TVL = lower risk
  if (tvl > 10000000) score -= 1;
  if (tvl < 100000) score += 1; // Low TVL = higher risk
  
  // Age-based adjustments
  if (age > 30) score -= 1; // Older = more established
  if (age < 7) score += 1; // Newer = higher risk
  
  return Math.max(1, Math.min(10, score));
}

// Mock data generators
export function generateMockPrices(symbols: string[]): TokenPrice[] {
  return symbols.map(symbol => ({
    symbol,
    price: Math.random() * 1000 + 1,
    change24h: (Math.random() - 0.5) * 20,
    marketCap: Math.random() * 1000000000,
    volume24h: Math.random() * 100000000,
  }));
}

export function generateMockYields(chain: string = 'solana', assets: string[] = ['USDC', 'SOL']): YieldOpportunity[] {
  const protocols = ['Raydium', 'Orca', 'Jupiter', 'Marinade', 'Lido'];
  
  return assets.flatMap(asset => 
    protocols.map((protocol, i) => ({
      id: `mock-${asset}-${protocol}-${i}`,
      name: `${asset} ${protocol} Pool`,
      protocol,
      chain,
      apy: Math.random() * 15 + 2, // 2-17% APY
      tvl: Math.random() * 10000000 + 100000,
      riskScore: Math.floor(Math.random() * 5) + 3, // 3-7 risk score
      assets: [asset],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  );
}

export function generateMockTVL(chain: string = 'solana'): ProtocolTVL[] {
  const protocols = ['Raydium', 'Orca', 'Jupiter', 'Marinade', 'Lido', 'Meteora'];
  
  return protocols.map((protocol, i) => ({
    id: `mock-tvl-${protocol}`,
    name: protocol,
    chain,
    tvl: Math.random() * 1000000000 + 10000000,
    change24h: (Math.random() - 0.5) * 10,
    protocols: [protocol],
  }));
}

export function generateMockRiskScores(protocols: string[]): RiskScore[] {
  return protocols.map(protocol => ({
    protocol,
    riskScore: Math.floor(Math.random() * 5) + 3,
    factors: ['Smart Contract Risk', 'Liquidity Risk', 'Market Risk'].slice(0, Math.floor(Math.random() * 3) + 1),
    lastUpdated: new Date().toISOString(),
  }));
}
