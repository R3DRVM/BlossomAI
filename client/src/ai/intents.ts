/**
 * Intent-based chat system for deterministic user interactions
 */

export type Intent =
  | 'DEPLOY_HIGHEST_APY'
  | 'AUTO_REBALANCE_TOP_K'
  | 'YIELD_SOURCES'
  | 'ALERT_THRESHOLD'
  | 'WITHDRAW'
  | 'SHOW_POSITIONS'
  | 'RESET_BALANCES'
  | 'DEPLOY_STRATEGY_ID'
  | 'MARKET_MAKER_DEPLOY'
  | 'FUND_MANAGER_ALERT'
  | 'PRIME_BROKER_INSTANCE'
  | 'DAO_TREASURY_REBALANCE'
  | 'API_MANAGEMENT'
  | 'SMALL_TALK';

export interface SlotsBase {
  sizeUSD?: number;
  asset?: string;
  chain?: string;
  risk?: 'low'|'medium'|'high';
  minAPY?: number;
  autoRebalance?: boolean;
  topK?: number;
  percentSplit?: number;
  strategyId?: string;
  targetProtocol?: string;
  // Market Maker slots
  targetAPY?: number;
  // Fund Manager slots
  thresholdType?: 'above'|'below';
  thresholdPercent?: number;
  baselineAPY?: number;
  // Prime Broker slots
  instanceName?: string;
  whitelistProtocols?: string[];
  // DAO Treasury slots
  rebalanceType?: 'stable'|'optimize'|'both';
  currentPositions?: any[];
}

export interface ConversationState {
  activeIntent?: Intent;
  stage?: 'collecting'|'confirm'|'waitingConfirm'|'idle';
  slots: SlotsBase;
  pendingPlanId?: string;
}

export const requiredSlots: Record<Intent, (keyof SlotsBase)[]> = {
  DEPLOY_HIGHEST_APY:   ['sizeUSD','asset','chain'],
  AUTO_REBALANCE_TOP_K: ['sizeUSD','asset','chain','percentSplit','topK','autoRebalance'],
  YIELD_SOURCES:        ['asset'],
  ALERT_THRESHOLD:      ['asset','minAPY'],
  WITHDRAW:             ['sizeUSD','targetProtocol','asset'],
  SHOW_POSITIONS:       [],
  RESET_BALANCES:       [],
  DEPLOY_STRATEGY_ID:   ['sizeUSD','strategyId'],
  MARKET_MAKER_DEPLOY:  ['sizeUSD','asset','chain','targetAPY'],
  FUND_MANAGER_ALERT:   ['asset','chain','thresholdType','thresholdPercent'],
  PRIME_BROKER_INSTANCE: ['instanceName','whitelistProtocols'],
  DAO_TREASURY_REBALANCE: ['rebalanceType'],
  API_MANAGEMENT:       [],
  SMALL_TALK:           [],
};

export function detectIntent(text: string): Intent | null {
  const s = text.toLowerCase();
  
  // Handle specific clickable options first
  if (s.includes('deploy usdc for highest apy')) return 'DEPLOY_HIGHEST_APY';
  if (s.includes('auto-rebalance 50% sol across top 3 tvl')) return 'AUTO_REBALANCE_TOP_K';
  if (s.includes('notify me if usdc apr < 7%')) return 'ALERT_THRESHOLD';
  if (s.includes('largest yield sources on solana by tvl')) return 'YIELD_SOURCES';
  if (s.includes('yield sources for weth & sol')) return 'YIELD_SOURCES';
  
  // Institutional use cases - check these first with more specific patterns
  if (/deploy.*\d+[kmb]?.*usdc.*\d+%.*solana/i.test(s)) return 'MARKET_MAKER_DEPLOY';
  if (/deploy.*\d+[kmb]?.*usdc.*at.*\d+%.*solana/i.test(s)) return 'MARKET_MAKER_DEPLOY';
  if (/market maker|auto-deploy.*idle|idle.*usdc.*yield|deploy.*idle.*usdc/i.test(s)) return 'MARKET_MAKER_DEPLOY';
  if (/fund manager|alert.*apr.*spike|farming.*apr.*baseline|alert.*farming|apr.*spike/i.test(s)) return 'FUND_MANAGER_ALERT';
  if (/prime broker|custom instance|vault.*whitelist|whitelisting|create.*instance/i.test(s)) return 'PRIME_BROKER_INSTANCE';
  if (/dao.*treasury|rebalance.*stable.*yield|optimize.*emissions|roi|rebalance.*positions/i.test(s)) return 'DAO_TREASURY_REBALANCE';
  if (/api.*key|api.*management|integration|desk/i.test(s)) return 'API_MANAGEMENT';
  
  // Small talk detection
  if (/hello|hi|hey|how are you|what.*can.*do|help|thanks|thank you/i.test(s)) return 'SMALL_TALK';
  
  // Handle general patterns - check these after institutional patterns
  if (/auto[- ]?rebalance.*top\s*\d/.test(s)) return 'AUTO_REBALANCE_TOP_K';
  if (/withdraw|redeem|unstake/.test(s)) return 'WITHDRAW';
  if (/notify|alert|apr|apy.*</i.test(s)) return 'ALERT_THRESHOLD';
  if (/yield sources|opportunities|for (weth|sol|usdc)/i.test(s)) return 'YIELD_SOURCES';
  if (/positions|portfolio summary|show holdings/i.test(s)) return 'SHOW_POSITIONS';
  if (/reset.*(balance|funds|wallet)/i.test(s)) return 'RESET_BALANCES';
  if (/deploy .*strategy|strategy id/i.test(s)) return 'DEPLOY_STRATEGY_ID';
  if (/deploy|allocate|invest|put .* to work/i.test(s)) return 'DEPLOY_HIGHEST_APY';
  return null;
}


