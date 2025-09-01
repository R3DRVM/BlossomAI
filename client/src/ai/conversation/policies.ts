/**
 * Conversation policies for follow-up questions and responses
 */

import type { ConvContext } from './state';
import type { SmallTalk } from '../_shared';

export function needsFollowUp(context: ConvContext): boolean {
  return (context.pending?.length || 0) > 0;
}

export function generateFollowUpQuestion(context: ConvContext): string {
  const pending = context.pending || [];
  
  if (pending.includes('capitalUSD')) {
    return "Got it. What capital should I deploy (USD)?";
  }
  
  if (pending.includes('assets')) {
    return "Which assets are you interested in? (e.g., USDC, WETH, SOL)";
  }
  
  if (pending.includes('chains')) {
    return "Which chain do you prefer: Solana, Ethereum, or another?";
  }
  
  if (pending.includes('risk')) {
    return "What's your risk preference: low, medium, or high?";
  }
  
  return "What else would you like me to help with?";
}

export function generateCompletionResponse(context: ConvContext, planSummary: string): string {
  const parts = [planSummary];
  
  // Add rationale based on context
  if (context.risk) {
    parts.push(`This ${context.risk}-risk strategy balances yield potential with safety.`);
  }
  
  if (context.autoRebalance) {
    parts.push("I've included auto-rebalancing to maintain optimal allocation.");
  }
  
  // Suggest next steps
  const suggestions = [];
  
  if (context.capitalUSD && !context.alerts?.length) {
    const suggestedAlert = Math.max(7, (context.targetAPY || 8) - 2);
    suggestions.push(`Want me to set a ${suggestedAlert}% APR alert?`);
  }
  
  if (!context.autoRebalance) {
    suggestions.push("Should I enable auto-rebalancing?");
  }
  
  suggestions.push("Ready to simulate this in the strategy builder?");
  
  if (suggestions.length > 0) {
    parts.push(suggestions[0]); // Pick the first suggestion
  }
  
  return parts.join(' ');
}

export function generateListResponse(context: ConvContext, items: any[]): string {
  const intro = context.chains?.length 
    ? `Here are the top yield sources on ${context.chains.join(' and ')}`
    : "Here are the top yield sources";
    
  const itemCount = items.length;
  const summary = `Found ${itemCount} opportunities with APYs ranging from ${
    Math.min(...items.map(i => i.estApy || 0)).toFixed(1)
  }% to ${
    Math.max(...items.map(i => i.estApy || 0)).toFixed(1)
  }%.`;
  
  const suggestion = context.capitalUSD 
    ? "Want me to create an allocation strategy with these?"
    : "Interested in deploying capital to any of these?";
    
  return `${intro}: ${summary} ${suggestion}`;
}

export function handleSmallTalk(
  smallTalk: SmallTalk, 
  context: ConvContext,
  lastAssistantMessage?: string
): string {
  const debugEnabled = import.meta.env.VITE_DEBUG_CHAT === '1';
  
  switch (smallTalk) {
    case 'greeting':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:greeting`);
      }
      
      // If there's pending context, offer clarification
      if (context.pending?.length) {
        return generateFollowUpQuestion(context);
      }
      
      // Context-aware greeting
      let greeting = "Hi! I can deploy capital, auto-rebalance, or set yield alerts.";
      
      // Add context reminder if applicable
      if (context.capitalUSD && context.chains?.length) {
        const chain = context.chains[0];
        const amount = context.capitalUSD >= 1000000 
          ? `$${(context.capitalUSD / 1000000).toFixed(1)}M`
          : `$${(context.capitalUSD / 1000).toFixed(0)}K`;
        greeting += ` We're currently on ${chain} with ${amount} planned. Continue or change it?`;
      }
      
      return greeting + " Try:\n• 'Deploy 10M USDC on Solana'\n• 'Auto-rebalance 50% SOL across top 3 TVL'\n• 'Alert me if USDC APR < 7%'";
    
    case 'help':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:help`);
      }
      
      return "I'm your DeFi Strategy Assistant. I pull live yields and TVL data to help you:\n• Deploy capital to highest-yield protocols\n• Auto-rebalance portfolios across chains\n• Set yield alerts and risk monitoring\n• Find new opportunities for your assets\n\nJust tell me what you want to do, like 'Deploy 5K USDC on Ethereum' or 'Find yield for SOL'.";
    
    case 'thanks':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:thanks`);
      }
      
      // Offer next steps based on context
      if (context.capitalUSD && context.assets?.length) {
        return "You're welcome! Want me to simulate this in the strategy builder or set up alerts?";
      }
      
      return "You're welcome! Ready to deploy some capital or explore yield opportunities?";
    
    case 'affirm':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:affirm`);
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} conv:defaultAssumption`);
      }
      
      // Apply sensible defaults based on pending context
      if (context.pending?.includes('chains')) {
        return "Great! I'll use Solana for its high yields. What capital amount would you like to deploy?";
      }
      
      if (context.pending?.includes('risk')) {
        return "Perfect! I'll go with medium risk for balanced returns. Proceeding with your strategy...";
      }
      
      if (context.pending?.includes('capitalUSD')) {
        return "Sounds good! Let's start with $10,000. Which assets are you interested in?";
      }
      
      // No specific pending context
      return "Great! Tell me what you'd like to do - deploy capital, rebalance, or set alerts?";
    
    case 'deny':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:deny`);
      }
      
      // Ask for alternative based on what was being clarified
      if (context.pending?.includes('chains')) {
        return "No problem! Which chain would you prefer: Ethereum, Arbitrum, Base, or another?";
      }
      
      if (context.pending?.includes('risk')) {
        return "Understood! Would you prefer low risk (safer, lower yields) or high risk (potentially higher returns)?";
      }
      
      if (context.pending?.includes('assets')) {
        return "Got it! What assets are you interested in? Popular options include USDC, WETH, SOL, or others.";
      }
      
      return "No worries! What would you like to do instead?";
    
    case 'unknown':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:unknown`);
      }
      
      return "Tell me what you want to do. For example: 'Deploy USDC at highest APY on Solana' or 'Show me yield opportunities for ETH'.";
    
    case 'reset':
      if (debugEnabled) {
        console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} smalltalk:reset`);
      }
      
      return "Reset chat for this user? This will clear your conversation history and start fresh. Type 'yes' to confirm or 'no' to cancel.";
    
    default:
      return "I'm here to help with DeFi strategies. What can I do for you?";
  }
}
