export type Chain = 'solana' | 'injective';

export type ProtoHint = {
  protocol: string;       // UI display name
  chain: Chain;
  // a hint used to match DeFiLlama 'project' field (lowercased contains)
  projectHint: string;
  defaultAsset?: string;  // for single-asset rows (e.g., USDC/SOL)
};

export const PROTOCOLS: ProtoHint[] = [
  // Injective
  { protocol: 'HYDRO',             chain: 'injective', projectHint: 'hydro' },
  { protocol: 'Helix',             chain: 'injective', projectHint: 'helix' },
  { protocol: 'Neptune Finance',   chain: 'injective', projectHint: 'neptune' },
  { protocol: 'Hydro Lending',     chain: 'injective', projectHint: 'hydro' },
  { protocol: 'Helix Spot',        chain: 'injective', projectHint: 'helix' },
  { protocol: 'Mito Finance',      chain: 'injective', projectHint: 'mito' },
  { protocol: 'Dojoswap',          chain: 'injective', projectHint: 'dojo' },
  { protocol: 'Dojoswap LSD',      chain: 'injective', projectHint: 'dojo' },

  // Solana - Real high-yield protocols from DefiLlama
  { protocol: 'Jito (Liquid Staking)', chain: 'solana', projectHint: 'jito', defaultAsset: 'SOL' },
  { protocol: 'Marinade Liquid Staking', chain: 'solana', projectHint: 'marinade', defaultAsset: 'SOL' },
  { protocol: 'Jupiter Staked SOL',    chain: 'solana', projectHint: 'jupiter', defaultAsset: 'SOL' },
  { protocol: 'Kamino Lend',           chain: 'solana', projectHint: 'kamino', defaultAsset: 'USDC' },
  { protocol: 'Orca DEX',              chain: 'solana', projectHint: 'orca', defaultAsset: 'SOL' },
  { protocol: 'Binance Staked SOL',    chain: 'solana', projectHint: 'binance', defaultAsset: 'SOL' },
  { protocol: 'Bybit Staked SOL',      chain: 'solana', projectHint: 'bybit', defaultAsset: 'SOL' },
  { protocol: 'Lido',                  chain: 'solana', projectHint: 'lido', defaultAsset: 'SOL' },
  // Optional: Marinade, Binance staked lines were noisy; include if needed by adding hints
];


