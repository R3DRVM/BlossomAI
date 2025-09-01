/**
 * Parser for extracting conversation context from user messages
 */

import type { ConvContext, RiskBand } from './state';
import { SMALL_TALK_PATTERNS, type SmallTalk } from '../_shared';

// Common tokens and chains
const TOKENS = ['USDC', 'USDT', 'DAI', 'WETH', 'ETH', 'SOL', 'WBTC', 'BTC', 'AVAX', 'MATIC', 'WSTETH', 'STETH'];
const CHAINS = ['solana', 'ethereum', 'arbitrum', 'base', 'polygon', 'avalanche', 'optimism'];

export function detectSmallTalk(message: string): SmallTalk {
  // Normalize: lowercase, trim, strip punctuation
  const normalized = message.toLowerCase().trim().replace(/[.!?,:;]/g, '');
  
  // Helper function to check if normalized message matches any phrase in a list
  const matchesAny = (phrases: string[]) => 
    phrases.some(phrase => normalized === phrase);
  
  // Check for reset intent first
  if (matchesAny(SMALL_TALK_PATTERNS.reset)) {
    return 'reset';
  }
  
  // Check other small-talk patterns in priority order
  if (matchesAny(SMALL_TALK_PATTERNS.greeting)) {
    return 'greeting';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.help)) {
    return 'help';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.thanks)) {
    return 'thanks';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.affirm)) {
    return 'affirm';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.deny)) {
    return 'deny';
  }
  
  // Check for unknown (short message with no meaningful content) AFTER other checks
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length < 4 && !tokens.some(token => 
    TOKENS.some(t => t.toLowerCase().includes(token)) ||
    CHAINS.some(c => c.includes(token)) ||
    /\d/.test(token) ||
    /(?:deploy|invest|allocate|rebalance|alert|yield|apy|apr|risk|strategy|find|show)/.test(token)
  )) {
    return 'unknown';
  }
  
  return null;
}

export function parseUserMessage(message: string, currentContext: ConvContext = {}): ConvContext & { smallTalk: SmallTalk } {
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  const originalContext = { ...currentContext };
  const newContext = { ...currentContext };
  
  const lowerMessage = message.toLowerCase();

  // Parse capital amount
  const moneyMatch = lowerMessage.match(/(?:^| )(\d+(?:\.\d+)?)([kmb])?\s*(?:usdc|usd)\b/i);
  if (moneyMatch) {
    const [, amount, multiplier] = moneyMatch;
    let value = parseFloat(amount);
    if (multiplier) {
      switch (multiplier.toLowerCase()) {
        case 'k': value *= 1000; break;
        case 'm': value *= 1000000; break;
        case 'b': value *= 1000000000; break;
      }
    }
    newContext.capitalUSD = value;
  }

  // Parse tokens/assets
  const foundTokens = TOKENS.filter(token => 
    new RegExp(`\\b${token}\\b`, 'i').test(message)
  );
  if (foundTokens.length > 0) {
    newContext.assets = [...(newContext.assets || []), ...foundTokens]
      .filter((token, index, arr) => arr.indexOf(token) === index); // dedupe
  }

  // Parse chains
  const foundChains = CHAINS.filter(chain => 
    new RegExp(`\\b${chain}\\b`, 'i').test(lowerMessage)
  );
  if (foundChains.length > 0) {
    newContext.chains = [...(newContext.chains || []), ...foundChains]
      .filter((chain, index, arr) => arr.indexOf(chain) === index); // dedupe
  }

  // Parse target APY
  const apyMatch = lowerMessage.match(/(?:>|above|over)\s*(\d+(?:\.\d+)?)\s*%/);
  if (apyMatch) {
    newContext.targetAPY = parseFloat(apyMatch[1]);
  }

  // Parse risk level
  const riskMatch = lowerMessage.match(/(low|medium|high)\s*risk/i);
  if (riskMatch) {
    newContext.risk = riskMatch[1].toLowerCase() as RiskBand;
  }

  // Parse timeframe
  const timeframeMatch = lowerMessage.match(/(\d+)\s*(?:week|wk)s?/i);
  if (timeframeMatch) {
    newContext.timeframeWeeks = parseInt(timeframeMatch[1]);
  }

  // Parse auto-rebalance
  if (/auto[- ]?rebalance/i.test(lowerMessage)) {
    newContext.autoRebalance = true;
  }

  // Parse alerts
  const alertMatch = lowerMessage.match(/(apr|apy)\s*(?:drops|<|below)\s*(\d+(?:\.\d+)?)\s*%/i);
  if (alertMatch) {
    const [, metric, value] = alertMatch;
    const alert = {
      token: newContext.assets?.[0] || 'USDC', // default to first asset or USDC
      metric: metric.toLowerCase() as 'apr' | 'apy',
      op: '<' as const,
      value: parseFloat(value),
    };
    newContext.alerts = [...(newContext.alerts || []), alert];
  }

  // Compute pending slots based on message intent
  const pending: ConvContext['pending'] = [];
  
  // If mentions deployment/strategy but missing capital
  if ((/deploy|invest|allocate|strategy/i.test(lowerMessage)) && !newContext.capitalUSD) {
    pending.push('capitalUSD');
  }
  
  // If mentions specific action but missing assets/chains
  if ((/deploy|find|yield|sources/i.test(lowerMessage)) && !newContext.assets?.length && !newContext.chains?.length) {
    pending.push('assets');
  }
  
  // If strategy building but missing risk
  if ((/deploy|strategy|allocate/i.test(lowerMessage)) && !newContext.risk) {
    pending.push('risk');
  }

  newContext.pending = pending;

  // Detect small-talk
  const smallTalk = detectSmallTalk(message);

  // Debug logging
  if (debugEnabled) {
    const changes = Object.keys(newContext).filter(key => 
      JSON.stringify(newContext[key as keyof ConvContext]) !== 
      JSON.stringify(originalContext[key as keyof ConvContext])
    );
    if (changes.length > 0) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} conv:update`, 
        { changes, newContext });
    }
    if (pending.length > 0) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} conv:pending`, pending);
    }
    if (smallTalk) {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:${smallTalk}`);
    }
  }

  return { ...newContext, smallTalk };
}
