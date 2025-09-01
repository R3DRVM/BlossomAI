/**
 * Conversation state for multi-turn slot-filling
 */

export type RiskBand = 'low' | 'medium' | 'high';

export type ConvContext = {
  capitalUSD?: number;                 // "deploy 10m usdc" → 10000000
  assets?: string[];                   // ['USDC','SOL','WETH']
  chains?: string[];                   // ['solana','ethereum']
  targetAPY?: number;                  // "> 12%"
  risk?: RiskBand;                     // "medium risk"
  timeframeWeeks?: number;             // "3 weeks"
  autoRebalance?: boolean;             // yes/no
  alerts?: Array<{
    token: string; 
    metric: 'apr' | 'apy'; 
    op: '<' | '>'; 
    value: number;
  }>;
  pending?: Array<'capitalUSD' | 'assets' | 'chains' | 'risk'>; // missing slots to ask
};

export const DEFAULT_CONTEXT: ConvContext = {
  pending: [],
};

export function getContextForUser(userId: string): ConvContext {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_CONTEXT };
    }
    const stored = localStorage.getItem(`blossom.chat.context.${userId}`);
    if (stored) {
      return { ...DEFAULT_CONTEXT, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load conversation context:', e);
  }
  return { ...DEFAULT_CONTEXT };
}

export function saveContextForUser(userId: string, context: ConvContext): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.setItem(`blossom.chat.context.${userId}`, JSON.stringify(context));
  } catch (e) {
    console.warn('Failed to save conversation context:', e);
  }
}

export function clearContextForUser(userId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    localStorage.removeItem(`blossom.chat.context.${userId}`);
  } catch (e) {
    console.warn('Failed to clear conversation context:', e);
  }
}
