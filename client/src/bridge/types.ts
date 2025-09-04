/**
 * Institutional Portfolio & Analytics Types
 * Supports professional-grade position tracking and analysis
 */

export type RiskBand = 'low' | 'medium' | 'high';

export interface Position {
  id: string;
  protocol: string;
  chain: string;
  asset: string;
  allocPercentage: number;
  amountUSD: number;
  baseAPY: number;
  emissionsAPY: number;
  netAPY: number;
  tvlAtEntry: number;
  volume30d: number;
  riskBand: RiskBand;
  feesBps?: number;
  entryTime: string; // ISO timestamp
}

export interface PlanSnapshot {
  id: string;
  planSummary: string;
  totalCapitalUSD: number;
  positions: Position[];
  kpis: {
    grossAPY: number;
    netAPY: number;
    stablePercentage: number;
    volatilePercentage: number;
    concentration: number; // HHI
    diversification: number; // protocol count
    tenor?: string; // e.g. "3 weeks"
    rebalanceRule?: string; // e.g. "drift >3% weekly"
  };
  audit: {
    appliedBy: string;
    appliedAt: string; // ISO
    sourcePlanProvenance: 'live' | 'mock';
    whitelist?: string[]; // protocol names
  };
  createdAt: string; // ISO
}

export interface PortfolioSnapshot {
  userId: string;
  latestSnapshot?: PlanSnapshot;
  snapshots: PlanSnapshot[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: string;
  userId: string;
  name: string;
  type: 'apr_below' | 'apy_below' | 'pct_above_baseline' | 'tvl_drop';
  asset: string;
  chain?: string;
  protocol?: string;
  value: number; // threshold value
  baseline?: number; // for pct_above_baseline type
  cadence: '5m' | '15m' | '1h' | '6h' | '24h';
  active: boolean;
  lastTriggeredAt?: string; // ISO
  createdAt: string;
}

export interface ChatPlan {
  planSummary: string;
  allocations: Array<{
    protocol: string;
    chain: string;
    asset: string;
    percentage: number;
    amount: number;
    estApy: number;
    tvl: number;
    riskLabel: string;
  }>;
  totalAmount: number;
  avgApy: number;
  riskLevel: RiskBand;
  rebalanceRule?: string;
  whitelist?: string[];
}

// Calculation utilities
export const STABLE_ASSETS = ['USDC', 'USDT', 'DAI', 'FDUSD', 'TUSD', 'FRAX'];

export const calculateHHI = (positions: Position[]): number => {
  const protocolShares = positions.reduce((acc, pos) => {
    acc[pos.protocol] = (acc[pos.protocol] || 0) + pos.allocPercentage;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.values(protocolShares).reduce((sum, share) => sum + Math.pow(share / 100, 2), 0);
};

export const calculateWeightedAPY = (positions: Position[], useNet = false): number => {
  const totalWeight = positions.reduce((sum, pos) => sum + pos.allocPercentage, 0);
  if (totalWeight === 0) return 0;
  
  return positions.reduce((sum, pos) => {
    const apy = useNet ? pos.netAPY : pos.baseAPY;
    return sum + (apy * pos.allocPercentage / totalWeight);
  }, 0);
};

export const calculateStableVolatileSplit = (positions: Position[]): { stable: number; volatile: number } => {
  const totalWeight = positions.reduce((sum, pos) => sum + pos.allocPercentage, 0);
  if (totalWeight === 0) return { stable: 0, volatile: 0 };
  
  const stableWeight = positions
    .filter(pos => STABLE_ASSETS.includes(pos.asset))
    .reduce((sum, pos) => sum + pos.allocPercentage, 0);
  
  return {
    stable: (stableWeight / totalWeight) * 100,
    volatile: ((totalWeight - stableWeight) / totalWeight) * 100
  };
};

// Mock data generators for development
export const generateMock30dVolume = (asset: string): number => {
  // Deterministic mock based on asset hash
  const hash = asset.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = 1000000 + (hash % 50000000); // 1M - 51M range
  return Math.floor(base / 1000) * 1000; // Round to nearest 1K
};

export const generateMockTVL = (protocol: string, chain: string): number => {
  // Deterministic mock based on protocol+chain hash
  const combined = protocol + chain;
  const hash = combined.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const base = 5000000 + (hash % 500000000); // 5M - 505M range
  return Math.floor(base / 10000) * 10000; // Round to nearest 10K
};
