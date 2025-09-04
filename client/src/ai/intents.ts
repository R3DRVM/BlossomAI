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
  | 'DEPLOY_STRATEGY_ID';

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
};

export function detectIntent(text: string): Intent | null {
  const s = text.toLowerCase();
  
  // Handle specific clickable options first
  if (s.includes('deploy usdc for highest apy')) return 'DEPLOY_HIGHEST_APY';
  if (s.includes('auto-rebalance 50% sol across top 3 tvl')) return 'AUTO_REBALANCE_TOP_K';
  if (s.includes('notify me if usdc apr < 7%')) return 'ALERT_THRESHOLD';
  if (s.includes('largest yield sources on solana by tvl')) return 'YIELD_SOURCES';
  if (s.includes('yield sources for weth & sol')) return 'YIELD_SOURCES';
  
  // Handle general patterns
  if (/auto[- ]?rebalance|top\s*\d/.test(s)) return 'AUTO_REBALANCE_TOP_K';
  if (/withdraw|redeem|unstake/.test(s)) return 'WITHDRAW';
  if (/notify|alert|apr|apy.*</i.test(s)) return 'ALERT_THRESHOLD';
  if (/yield sources|opportunities|for (weth|sol|usdc)/i.test(s)) return 'YIELD_SOURCES';
  if (/positions|portfolio summary|show holdings/i.test(s)) return 'SHOW_POSITIONS';
  if (/reset.*(balance|funds|wallet)/i.test(s)) return 'RESET_BALANCES';
  if (/deploy .*strategy|strategy id/i.test(s)) return 'DEPLOY_STRATEGY_ID';
  if (/deploy|allocate|invest|put .* to work/i.test(s)) return 'DEPLOY_HIGHEST_APY';
  return null;
}


