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

  // Solana
  { protocol: 'Jito (Liquid Staking)', chain: 'solana', projectHint: 'jito', defaultAsset: 'SOL' },
  { protocol: 'Raydium',               chain: 'solana', projectHint: 'raydium', defaultAsset: 'USDC' },
  { protocol: 'Kamino',                chain: 'solana', projectHint: 'kamino' },
  { protocol: 'Jupiter Lend',          chain: 'solana', projectHint: 'jupiter' },
  { protocol: 'Orca',                  chain: 'solana', projectHint: 'orca' },
  { protocol: 'Sanctum Infinity',      chain: 'solana', projectHint: 'sanctum', defaultAsset: 'SOL' },
  { protocol: 'Save (marginfi Save)',  chain: 'solana', projectHint: 'marginfi' },
  { protocol: 'Meteora vaults',        chain: 'solana', projectHint: 'meteora' },
  // Optional: Marinade, Binance staked lines were noisy; include if needed by adding hints
];


