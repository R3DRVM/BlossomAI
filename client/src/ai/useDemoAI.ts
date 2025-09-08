import { useState, useCallback } from 'react';
import { sendChat } from './sendChat';
import { payloadToText } from './formatters';
import { getSessionId } from './store';
import { getContextForUser, saveContextForUser } from './conversation/state';
import { parseUserMessage } from './conversation/parser';
import { needsFollowUp, generateFollowUpQuestion, generateCompletionResponse, handleSmallTalk } from './conversation/policies';
import { resetChatForUser } from './store';
import { getActiveUserId } from './userUtils';
import { setLatestPlan } from '../bridge/planBridge';
import { parseAlertFromMessage, createAlertRule } from '../bridge/alertsStore';
import { parseSize, formatSize } from '../lib/num';
import { saveProposedPlan, getProposedPlan, clearProposedPlan } from '../bridge/proposedPlanStore';
import { fetchLiveProtocols } from '../lib/liveClient';
import { fetchYields } from '../lib/yields';
import { detectIntent, Intent, requiredSlots, SlotsBase } from './intents';
import { loadSession, saveSession, clearSession } from './sessionState';
import { parseBool } from '../lib/parse';
import { fmtUSD, fmtPct } from '../lib/format';
import { applyPlanById } from '../bridge/portfolioStore';

// Session state management for user parameters
type PendingParams = { 
  sizeUSD?: number; 
  asset?: 'USDC'|'SOL'|'WETH'|string; 
  chain?: 'solana'|'ethereum'|'injective'|string; 
  risk?: 'low'|'medium'|'high'; 
  autoRebalance?: boolean 
};

const sessions = new Map<string, PendingParams>(); // keyed by sessionId

// Intent-based message processing
async function processIntentBasedMessage(content: string, userId: string): Promise<{ response: string; shouldContinue: boolean; metadata?: any }> {
  const session = loadSession(userId);
  console.log('[DAO_DEBUG] Loaded session:', {
    userId,
    stage: session.stage,
    activeIntent: session.activeIntent,
    pendingPlanId: session.pendingPlanId,
    slots: session.slots,
    fullSession: session
  });
  
  // Strip markdown formatting and normalize text
  const userText = content.replace(/\*\*/g, '').toLowerCase().trim();
  
  // If waiting for confirmation, handle yes/no/edit/cancel
  if (session.stage === 'waitingConfirm') {
    // First check if this is a confirmation phrase
    const isConfirmation = /^(y(es)?|let'?s\s+deploy|deploy|execute|go\s+ahead|proceed|confirm)$/i.test(userText) || 
                          /^y(es)?,?\s*let'?s\s+deploy/i.test(userText);
    
    if (isConfirmation) {
      // This is a confirmation, don't detect as new intent
      console.log('[DAO_DEBUG] Confirmation detected in waitingConfirm stage:', {
        content,
        userText,
        currentActiveIntent: session.activeIntent
      });
    } else {
      // Check if user is starting a new intent instead of confirming
      const newIntent = detectIntent(content);
      console.log('[DAO_DEBUG] Session in waitingConfirm, checking for new intent:', {
        content,
        newIntent,
        currentActiveIntent: session.activeIntent,
        isDifferent: newIntent && newIntent !== session.activeIntent
      });
      
      if (newIntent && newIntent !== session.activeIntent) {
        // User is starting a new intent, reset session and process it
        console.log('[DAO_DEBUG] Resetting session for new intent:', {
          oldIntent: session.activeIntent,
          newIntent,
          oldStage: session.stage
        });
        session.activeIntent = newIntent;
        session.stage = 'collecting';
        session.slots = {};
        session.pendingPlanId = undefined;
        
        // Extract slots from the message
        const slots = extractSlots(content, newIntent);
        session.slots = { ...session.slots, ...slots };
        
        // Check if we have all required slots
        const required = requiredSlots[newIntent];
        const missing = required.filter(slot => session.slots[slot] === undefined);
        
        if (missing.length > 0) {
          saveSession(userId, session);
          return { response: generateSlotQuestion(newIntent, missing), shouldContinue: false };
        }
        
        // Save the updated session
        saveSession(userId, session);
        
        // All slots collected, create plan for deploy intents
        if (newIntent === 'DEPLOY_HIGHEST_APY') {
          return createDeployPlan(session, userId);
        }
        
        // Handle other intents
        return await handleOtherIntent(newIntent, session, userId);
      }
    }
    
    // Enhanced confirmation patterns - more flexible matching
    if (/^(y(es)?|let'?s\s+deploy|deploy|execute|go\s+ahead|proceed|confirm)$/i.test(userText) || 
        /^y(es)?,?\s*let'?s\s+deploy/i.test(userText)) {
      // User confirmed - apply the plan
      const plan = getProposedPlan(userId);
      console.log('[DAO_DEBUG] Confirmation detected:', {
        userText,
        userId, 
        plan: plan ? { id: plan.id, status: plan.status, capitalUSD: plan.capitalUSD } : null, 
        sessionPlanId: session.pendingPlanId,
        sessionStage: session.stage,
        sessionActiveIntent: session.activeIntent
      });
      
      if (!plan) {
        return { response: '❌ **No plan found!** Please create a new deployment plan.', shouldContinue: false };
      }
      
      if (plan.id !== session.pendingPlanId) {
        return { response: '❌ **Plan mismatch!** Please create a new deployment plan.', shouldContinue: false };
      }
      
      if (plan.status !== 'pending') {
        return { response: `❌ **Plan status error!** Plan status is "${plan.status}" but should be "pending".`, shouldContinue: false };
      }
      
      if (plan && plan.id === session.pendingPlanId) {
        try {
          console.log('[chat:deploy:start]', { userId, planId: plan.id, capitalUSD: plan.capitalUSD });
          
          // Check current wallet balance before deployment
          if (typeof window !== 'undefined' && (window as any).__paper) {
            const walletInfo = (window as any).__paper(userId);
            console.log('[chat:deploy:wallet]', walletInfo);
          }
          
          await applyPlanById(userId, plan);
          console.log('[chat:deploy:success]', { userId, planId: plan.id });
          clearProposedPlan(userId);
          session.stage = 'idle';
          session.pendingPlanId = undefined;
          saveSession(userId, session);
          
          if (import.meta.env.VITE_DEBUG_CHAT === '1') {
            console.log('[plan:confirmed]', { userId, capitalUSD: plan.capitalUSD });
          }
          
          // Emit success event
          window.dispatchEvent(new CustomEvent('blossom:notify', {
            detail: {
              type: 'success',
              message: `Deployed Successfully — ${fmtUSD(plan.capitalUSD)} allocated.`,
              actions: [{ label: 'View Positions', href: '/portfolio' }]
            }
          }));
          
          // Special confirmation for DAO Treasury rebalancing
          if (session.activeIntent === 'DAO_TREASURY_REBALANCE') {
            // Get current positions for before/after comparison
            const currentPositions = await getCurrentPositions(userId);
            const beforeStable = currentPositions.filter(pos => pos.asset === 'USDC' || pos.asset === 'USDT').reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
            const beforeVolatile = currentPositions.filter(pos => pos.asset !== 'USDC' && pos.asset !== 'USDT').reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
            const afterStable = plan.allocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
            const afterVolatile = beforeVolatile - (plan.capitalUSD || 0);
            
            return { 
              response: `🏛️ **DAO Treasury Rebalancing Complete!**\n\n**Before Rebalancing:**\n• Stable Assets: ${fmtUSD(beforeStable)} (${fmtPct(beforeStable / (beforeStable + beforeVolatile) * 100)}%)\n• Volatile Assets: ${fmtUSD(beforeVolatile)} (${fmtPct(beforeVolatile / (beforeStable + beforeVolatile) * 100)}%)\n\n**After Rebalancing:**\n• Stable Assets: ${fmtUSD(afterStable)} (${fmtPct(afterStable / (afterStable + afterVolatile) * 100)}%)\n• Volatile Assets: ${fmtUSD(afterVolatile)} (${fmtPct(afterVolatile / (afterStable + afterVolatile) * 100)}%)\n\n**Improvements:**\n• **Stable Yield Focus**: Increased stable asset allocation\n• **Risk Reduction**: Reduced exposure to volatile assets\n• **Diversification**: Spread across ${plan.allocations.length} stable protocols\n\nYour treasury is now optimized for stable yield and reduced risk! Check **Analytics** to see the updated metrics.`, 
              shouldContinue: false 
            };
          }
          
          return { response: `🎉 **Deployment successful!**\n\nYour ${fmtUSD(plan.capitalUSD)} has been allocated across ${plan.allocations.length} protocols. You can now:\n\n• Check your **Portfolio** to see all positions\n• View **Analytics** for detailed performance metrics\n• Deploy more strategies or try different approaches\n\nWhat would you like to explore next?`, shouldContinue: false };
        } catch (error) {
          console.error('[chat:deploy:error]', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { response: `❌ **Deployment failed!** ${errorMessage}\n\nPlease try again or contact support if the issue persists.`, shouldContinue: false };
        }
      }
    }
    
    // Enhanced cancellation patterns
    if (/^(n(o)?|cancel|abort|stop|nevermind|forget it)$/i.test(userText)) {
      // User cancelled
      clearProposedPlan(userId);
      session.stage = 'idle';
      session.pendingPlanId = undefined;
      saveSession(userId, session);
      return { response: '❌ Deployment cancelled. No changes made to your portfolio.', shouldContinue: false };
    }
    
    // Handle edit commands with more flexible patterns
    if (/(edit|change|make|update|adjust|modify).*(\d+[kmb]?)|let'?s adjust.*(\d+[kmb]?)/i.test(userText)) {
      const match = userText.match(/(\d+[kmb]?)/i);
      if (match) {
        const newAmount = parseSize(match[1]);
        if (newAmount) {
          session.slots.sizeUSD = newAmount;
          saveSession(userId, session);
          
          // Recreate the plan with new amount
          const plan = getProposedPlan(userId);
          if (plan) {
            const updatedPlan = {
              ...plan,
              capitalUSD: newAmount,
              allocations: plan.allocations.map(alloc => ({
                ...alloc,
                amountUSD: (newAmount * alloc.percentage) / 100
              }))
            };
            saveProposedPlan(updatedPlan, userId);
            session.pendingPlanId = updatedPlan.id;
            saveSession(userId, session);
          }
          
          return { response: `✅ Updated amount to ${fmtUSD(newAmount)}. Please confirm: **yes, let's deploy** to execute, **cancel** to abort.`, shouldContinue: false };
        }
      }
    }
    
    return { response: 'Got it! You can:\n• Reply **yes, let\'s deploy** to execute this plan\n• Reply **cancel** to abort\n• Say **let\'s adjust to 100k** to change the amount\n\nWhat would you like to do?', shouldContinue: false };
  }
  
  // Detect new intent
  const intent = detectIntent(content);
  console.log('[DAO_DEBUG] Detected intent:', { 
    content, 
    intent, 
    lowercase: content.toLowerCase(),
    sessionStage: session.stage,
    sessionActiveIntent: session.activeIntent
  });
  
  if (!intent) {
    return { response: '', shouldContinue: true }; // Let normal flow handle it
  }
  
  // Update session with new intent
  session.activeIntent = intent;
  session.stage = 'collecting';
  session.slots = {};
  
  // Extract slots from the message
  const slots = extractSlots(content, intent);
  session.slots = { ...session.slots, ...slots };
  
  console.log('[DAO_DEBUG] Extracted slots:', { intent, slots, sessionSlots: session.slots });
  
  // Check if we have all required slots
  const required = requiredSlots[intent];
  const missing = required.filter(slot => session.slots[slot] === undefined);
  
  console.log('[DAO_DEBUG] Required slots check:', { required, missing, hasAllSlots: missing.length === 0 });
  
  if (missing.length > 0) {
    saveSession(userId, session);
    return { response: generateSlotQuestion(intent, missing), shouldContinue: false };
  }
  
  // All slots collected, create plan for deploy intents
  if (intent === 'DEPLOY_HIGHEST_APY') {
    return createDeployPlan(session, userId);
  }
  
  // Handle other intents
  console.log('[DAO_DEBUG] Calling handleOtherIntent for:', intent);
  const result = await handleOtherIntent(intent, session, userId);
  console.log('[DAO_DEBUG] handleOtherIntent result:', { intent, response: result.response.substring(0, 100) + '...', shouldContinue: result.shouldContinue });
  return result;
}

// Extract slots from user message
function extractSlots(content: string, intent: Intent): Partial<SlotsBase> {
  const slots: Partial<SlotsBase> = {};
  const lowerContent = content.toLowerCase();
  
  // Handle clickable options with default parameters
  if (lowerContent.includes('deploy usdc for highest apy')) {
    slots.sizeUSD = 250000; // Default 250k
    slots.asset = 'USDC';
    slots.chain = 'solana';
    slots.risk = 'medium';
  } else if (lowerContent.includes('auto-rebalance 50% sol across top 3 tvl')) {
    slots.sizeUSD = 500000; // Default 500k
    slots.asset = 'SOL';
    slots.chain = 'solana';
    slots.risk = 'medium';
    slots.percentSplit = 50;
    slots.topK = 3;
    slots.autoRebalance = true;
  } else if (lowerContent.includes('notify me if usdc apr < 7%')) {
    slots.asset = 'USDC';
    slots.minAPY = 7;
  } else if (lowerContent.includes('largest yield sources on solana by tvl')) {
    slots.asset = 'USDC';
  } else if (lowerContent.includes('yield sources for weth & sol')) {
    slots.asset = 'WETH,SOL';
  } else {
    // Extract from general patterns
    // Extract size - look for amounts with k/m suffixes or large numbers
    const sizeMatch = content.match(/(\d+[kmb]|deploy\s+(\d+[kmb]?)|(\d+[kmb]?)\s*(usdc|sol|eth|dai))/i);
    if (sizeMatch) {
      const size = parseSize(sizeMatch[1] || sizeMatch[2] || sizeMatch[3]);
      if (size) slots.sizeUSD = size;
    } else if (intent === 'MARKET_MAKER_DEPLOY') {
      // For MARKET_MAKER_DEPLOY, provide a default amount if none specified
      slots.sizeUSD = 250000; // Default 250k
    }
    
    // Extract asset
    const assetMatch = content.match(/\b(USDC|SOL|WETH|ETH)\b/i);
    if (assetMatch) {
      slots.asset = assetMatch[1].toUpperCase();
    }
    
    // Extract chain
    const chainMatch = content.match(/\b(solana|ethereum|injective)\b/i);
    if (chainMatch) {
      slots.chain = chainMatch[1].toLowerCase();
    }
    
    // Extract risk
    const riskMatch = content.match(/\b(low|medium|high)\s*risk\b/i);
    if (riskMatch) {
      slots.risk = riskMatch[1].toLowerCase() as 'low'|'medium'|'high';
    }
    
    // Extract target APY (handle ~10%, 10%, 10% yield, etc.)
    // Look for percentage patterns specifically, not just any number
    const apyMatch = content.match(/~?(\d+(?:\.\d+)?)\s*%/i);
    if (apyMatch) {
      slots.targetAPY = parseFloat(apyMatch[1]);
    }
    
    // Extract auto rebalance
    if (content.match(/auto\s*rebalance/i)) {
      slots.autoRebalance = true;
    }
    
    // Extract threshold type and percentage for alerts
    if (intent === 'FUND_MANAGER_ALERT') {
      // Extract threshold type (above/below)
      if (content.match(/above|spike|increase|goes up/i)) {
        slots.thresholdType = 'above';
      } else if (content.match(/below|drop|decrease|goes down/i)) {
        slots.thresholdType = 'below';
      }
      
      // Extract threshold percentage
      const thresholdMatch = content.match(/(\d+(?:\.\d+)?)\s*%/i);
      if (thresholdMatch) {
        slots.thresholdPercent = parseFloat(thresholdMatch[1]);
      }
    }
    
    // Extract instance name and whitelist for Prime Broker
    if (intent === 'PRIME_BROKER_INSTANCE') {
      // Extract instance name
      const nameMatch = content.match(/instance\s+(\w+)/i);
      if (nameMatch) {
        slots.instanceName = nameMatch[1];
      }
      
      // Extract whitelist protocols
      const whitelistMatch = content.match(/whitelist:\s*([^.]+)/i);
      if (whitelistMatch) {
        const protocols = whitelistMatch[1].split(',').map(p => p.trim());
        slots.whitelistProtocols = protocols;
      }
    }
    
    // Extract rebalance type for DAO Treasury
    if (intent === 'DAO_TREASURY_REBALANCE') {
      if (content.match(/stable.*yield/i)) {
        slots.rebalanceType = 'stable';
      } else if (content.match(/optimize.*emissions/i)) {
        slots.rebalanceType = 'optimize';
      } else if (content.match(/both|stable.*optimize/i)) {
        slots.rebalanceType = 'both';
      }
      
      // Extract size for DAO Treasury
      const sizeMatch = content.match(/size\s+(\d+[kmb]?)/i);
      if (sizeMatch) {
        const size = parseSize(sizeMatch[1]);
        if (size) slots.sizeUSD = size;
      }
    }
  }
  
  return slots;
}

// Generate questions for missing slots
function generateSlotQuestion(intent: Intent, missing: (keyof SlotsBase)[]): string {
  const questions = {
    sizeUSD: 'What amount would you like to deploy? (e.g., "250k", "1M")',
    asset: 'Which asset? (USDC, SOL, WETH)',
    chain: 'Which chain? (Solana, Ethereum, Injective)',
    risk: 'What risk level? (low, medium, high)',
    targetAPY: 'What target APY are you looking for? (e.g., "10%", "15%")',
    thresholdType: 'Do you want alerts when APY goes above or below a threshold?',
    thresholdPercent: 'What percentage threshold? (e.g., "50%", "20%")',
    instanceName: 'What would you like to name this instance?',
    whitelistProtocols: 'Which protocols should be whitelisted? (comma-separated)',
    rebalanceType: 'What type of rebalancing? (stable, optimize, both)',
  };
  
  return missing.map(slot => questions[slot] || `Please specify ${slot}.`).join('\n');
}

// Create deploy plan
function createDeployPlan(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const { sizeUSD, asset, chain, risk, autoRebalance } = session.slots;
  
  // Create allocations (simplified for now)
  const allocations = [
    { 
      protocol: 'Raydium', 
      chain: chain || 'solana',
      asset: asset || 'USDC',
      apy: 0.12,
      tvl: 1000000,
      risk: risk || 'medium',
      amountUSD: Math.round(sizeUSD * 0.4)
    },
    { 
      protocol: 'Orca', 
      chain: chain || 'solana',
      asset: asset || 'USDC',
      apy: 0.10,
      tvl: 800000,
      risk: risk || 'medium',
      amountUSD: Math.round(sizeUSD * 0.3)
    },
    { 
      protocol: 'Jupiter', 
      chain: chain || 'solana',
      asset: asset || 'USDC',
      apy: 0.08,
      tvl: 600000,
      risk: risk || 'medium',
      amountUSD: Math.round(sizeUSD * 0.3)
    },
  ];
  
  const plan = {
    id: crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    capitalUSD: sizeUSD,
    asset: (asset || 'USDC') as 'USDC'|'SOL',
    chain: (chain || 'solana') as 'solana'|'ethereum'|'injective',
    risk: (risk || 'medium') as 'low'|'medium'|'high',
    autoRebalance: autoRebalance || false,
    allocations,
    createdAt: new Date().toISOString(),
    status: 'pending' as const,
  };
  
  console.log('[createDeployPlan:beforeSave]', { planId: plan.id, status: plan.status, userId });
  saveProposedPlan(plan, userId);
  console.log('[createDeployPlan:afterSave]', { planId: plan.id, status: plan.status, userId });
  
  session.stage = 'waitingConfirm';
  session.pendingPlanId = plan.id;
  saveSession(userId, session);
  
  // Emit plan proposed event
  window.dispatchEvent(new CustomEvent('blossom:plan:proposed', { detail: plan }));
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[plan:proposed]', { userId, capitalUSD: plan.capitalUSD, asset: plan.asset, chain: plan.chain, risk: plan.risk });
  }
  
  return {
    response: `Perfect! I've created a deployment plan for you:\n\n💰 **Amount**: ${fmtUSD(plan.capitalUSD)} ${plan.asset}\n🌐 **Chain**: ${plan.chain}\n📊 **Protocols**: ${plan.allocations.length} top protocols\n📈 **Expected APY**: ~${fmtPct(0.10)} average\n\nThis will spread your capital across the best performing protocols on ${plan.chain}. Ready to deploy?\n\n• Reply **yes** to deploy\n• Reply **no** to cancel\n• Say **edit amount to 100k** to change the amount`,
    shouldContinue: false
  };
}

// Handle other intents
async function handleOtherIntent(intent: Intent, session: any, userId: string): Promise<{ response: string; shouldContinue: boolean }> {
  switch (intent) {
    case 'SHOW_POSITIONS':
      return { response: 'Here are your current positions. [View detailed breakdown in Portfolio]', shouldContinue: false };
    case 'RESET_BALANCES':
      return { response: 'You can reset your wallet and clear all positions using the menu (⋮) in the top-right corner. This will restore your balances to the original seed amounts and clear all active positions.', shouldContinue: false };
    case 'YIELD_SOURCES':
      return handleYieldSourcesIntent(session, userId);
    case 'ALERT_THRESHOLD':
      return handleAlertIntent(session, userId);
    case 'MARKET_MAKER_DEPLOY':
      return await handleMarketMakerDeployIntent(session, userId);
    case 'FUND_MANAGER_ALERT':
      return handleFundManagerAlertIntent(session, userId);
    case 'PRIME_BROKER_INSTANCE':
      return handlePrimeBrokerInstanceIntent(session, userId);
    case 'DAO_TREASURY_REBALANCE':
      return await handleDAOTreasuryRebalanceIntent(session, userId);
    case 'API_MANAGEMENT':
      return handleAPIManagementIntent(session, userId);
    case 'SMALL_TALK':
      return handleSmallTalkIntent(session, userId);
    default:
      return { response: '', shouldContinue: true };
  }
}

// Handle yield sources intent - show actual yield sources instead of deployment plans
function handleYieldSourcesIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const { asset } = session.slots;
  
  // Mock yield sources data - in a real app, this would fetch from an API
  const yieldSources = [
    { protocol: 'Raydium', apy: 12.5, tvl: 1200000000, chain: 'Solana', asset: 'USDC' },
    { protocol: 'Orca', apy: 10.8, tvl: 800000000, chain: 'Solana', asset: 'USDC' },
    { protocol: 'Jupiter', apy: 9.2, tvl: 600000000, chain: 'Solana', asset: 'USDC' },
    { protocol: 'Meteora', apy: 11.3, tvl: 400000000, chain: 'Solana', asset: 'USDC' },
    { protocol: 'Lido', apy: 4.2, tvl: 15000000000, chain: 'Ethereum', asset: 'WETH' },
    { protocol: 'Aave', apy: 3.8, tvl: 8000000000, chain: 'Ethereum', asset: 'WETH' },
    { protocol: 'Compound', apy: 3.5, tvl: 2000000000, chain: 'Ethereum', asset: 'WETH' },
    { protocol: 'Marinade', apy: 6.8, tvl: 2000000000, chain: 'Solana', asset: 'SOL' },
    { protocol: 'Jito', apy: 7.2, tvl: 1500000000, chain: 'Solana', asset: 'SOL' },
    { protocol: 'BlazeStake', apy: 6.5, tvl: 800000000, chain: 'Solana', asset: 'SOL' },
  ];
  
  // Filter by asset if specified (handle multiple assets like "WETH,SOL")
  let filteredSources = yieldSources;
  if (asset) {
    const requestedAssets = asset.split(',').map(a => a.trim().toUpperCase());
    filteredSources = yieldSources.filter(source => 
      requestedAssets.includes(source.asset.toUpperCase())
    );
  }
  
  // Sort by TVL descending
  const sortedSources = filteredSources.sort((a, b) => b.tvl - a.tvl);
  
  const response = `📊 **Top Yield Sources by TVL**\n\n${sortedSources.slice(0, 5).map((source, index) => 
    `${index + 1}. **${source.protocol}** (${source.chain})\n   • APY: ${fmtPct(source.apy)}\n   • TVL: $${(source.tvl / 1000000).toFixed(0)}M\n   • Asset: ${source.asset}`
  ).join('\n\n')}\n\n💡 **Want to deploy?** Say "Deploy USDC for highest APY" to create a deployment plan!`;
  
  return { response, shouldContinue: false };
}

// Handle alert intent - create alert rules
function handleAlertIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const { asset, minAPY } = session.slots;
  
  if (!asset || !minAPY) {
    return { response: 'Please specify both asset and minimum APY for the alert (e.g., "Notify me if USDC APR < 7%")', shouldContinue: false };
  }
  
  // Create alert rule
  const alertRule = {
    id: crypto.randomUUID ? crypto.randomUUID() : `alert-${Date.now()}`,
    userId,
    name: `${asset} APR Alert`,
    type: 'apy_below' as const,
    asset,
    value: minAPY,
    cadence: '1h' as const,
    active: true,
    createdAt: new Date().toISOString(),
  };
  
  // Save alert rule (mock implementation)
  try {
    // In a real app, this would save to a store
    console.log('[alert:created]', alertRule);
    
    return { 
      response: `🔔 **Alert Created!**\n\nI'll notify you when ${asset} APR drops below ${fmtPct(minAPY)}.\n\n• Check your **Analytics** tab to see all active alerts\n• You can modify or delete alerts from there`, 
      shouldContinue: false 
    };
  } catch (error) {
    return { 
      response: `❌ **Failed to create alert.** Please try again.`, 
      shouldContinue: false 
    };
  }
}

// Market Maker: Auto-deploy idle USDC at 10% yield on Solana
// Market Maker: Auto-Deploy idle USDC at 10% yield on Solana
async function handleMarketMakerDeployIntent(session: any, userId: string): Promise<{ response: string; shouldContinue: boolean }> {
  const { sizeUSD, asset = 'USDC', chain = 'solana', targetAPY = 10 } = session.slots;
  
  if (!sizeUSD) {
    // Get user's current balance to show available funds
    const balance = await getCurrentBalance(userId, asset);
    return {
      response: `🏦 **Market Maker Auto-Deploy**\n\nI can auto-deploy your idle ${asset} at ~${targetAPY}% yield across Solana protocols.\n\n**Your Available Balance:** ${fmtUSD(balance)} ${asset}\n\n**How much would you like to deploy?** (e.g., "Deploy 250k USDC")`,
      shouldContinue: false
    };
  }
  
  // Create deployment plan
  const plan = await createMarketMakerPlan(userId, sizeUSD, asset, chain, targetAPY);
  
  if (plan) {
    saveProposedPlan(plan, userId);
    session.stage = 'waitingConfirm';
    session.pendingPlanId = plan.id;
    saveSession(userId, session);
    
    // Emit plan proposed event
    window.dispatchEvent(new CustomEvent('blossom:plan:proposed', { detail: plan }));
    
    const avgApy = plan.allocations.reduce((sum, a) => sum + (a.apy * a.amount / sizeUSD), 0);
    const riskScore = plan.allocations.reduce((sum, a) => sum + (a.risk === 'low' ? 3 : a.risk === 'medium' ? 6 : 9), 0) / plan.allocations.length;
    
    return {
      response: `**Deploy $${sizeUSD.toLocaleString()} in ${asset} on ${chain} across ${plan.allocations.length} protocols (avg APY ${avgApy.toFixed(2)}%, risk ${session.risk || 'medium'}).**\n\n**Allocations (top ${plan.allocations.length}):**\n${plan.allocations.map(alloc => `• ${alloc.asset} → ${alloc.protocol} (${alloc.chain}) – ${alloc.apy.toFixed(2)}% APY, TVL ~${alloc.tvl.toLocaleString()}, Risk: ${alloc.risk}`).join('\n')}\n\n**Portfolio Summary:**\n• Total Value: $${sizeUSD.toLocaleString()}\n• Average APY: ${avgApy.toFixed(2)}%\n• Risk Score: ${riskScore.toFixed(1)}/10\n• Diversification: ${plan.allocations.length}\n\n**Ready to deploy?** Click Execute to deploy, Adjust to modify, or Cancel to abort. You can also type "yes, let's deploy", "let's adjust to X", or "cancel" to change the topic.`,
      shouldContinue: false,
      metadata: {
        microCTAs: [
          { label: 'Execute', action: 'execute', data: { type: 'confirm' } },
          { label: 'Adjust', action: 'adjust', data: { type: 'modify' } },
          { label: 'Cancel', action: 'cancel', data: { type: 'abort' } }
        ]
      }
    };
  }
  
  return {
    response: `❌ **Deployment Failed**\n\nI couldn't create a deployment plan. Please try again or contact support.`,
    shouldContinue: false
  };
}

// Fund Manager: Get alerted when farming APRs spike 50% above baseline
function handleFundManagerAlertIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const { asset = 'USDC', chain = 'solana', thresholdType = 'above', thresholdPercent = 50 } = session.slots;
  
  if (!asset || !chain || !thresholdType || !thresholdPercent) {
    return {
      response: `📊 **Fund Manager Alert Setup**\n\nI can set up alerts for farming APR movements on your preferred chains.\n\n**I need to know:**\n• Which asset? (USDC, SOL, etc.)\n• Which chain? (Solana, Ethereum, etc.)\n• Alert when APR goes above or below baseline?\n• What percentage threshold? (e.g., "50% above baseline")\n\n**Example:** "Alert me when USDC APR spikes 50% above baseline on Solana"`,
      shouldContinue: false
    };
  }
  
  // Create alert rule
  const alertRule = {
    type: 'apy_threshold' as const,
    asset,
    chain,
    condition: `APR ${thresholdType} ${thresholdPercent}% of baseline`,
    frequency: '15 minutes'
  };
  
  createAlertRule(alertRule);
  
  return {
    response: `✅ **Alert Rule Created**\n\n**Monitoring Setup:**\n• Asset: ${asset}\n• Chain: ${chain}\n• Alert: When APR goes ${thresholdType} ${thresholdPercent}% of baseline\n• Baseline APR: ~7%\n• Status: Active\n\n**What I'll do:**\n• Monitor ${asset} farming APRs in real-time\n• Alert you when opportunities spike\n• Track across all ${chain} protocols\n• Show alerts in Analytics tab\n\n**View your alerts:** Check the Analytics tab → Alerts section`,
    shouldContinue: false
  };
}

// Prime Broker: Create custom instance with vault whitelisting
function handlePrimeBrokerInstanceIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const { instanceName, whitelistProtocols = [] } = session.slots;
  
  if (!instanceName || whitelistProtocols.length === 0) {
    return {
      response: `🏛️ **Prime Broker Custom Instance**\n\nI can create a custom instance with vault whitelisting for your institutional needs.\n\n**I need to know:**\n• Instance name (e.g., "Alpha", "Institutional-1")\n• Whitelisted protocols (e.g., "Jupiter, Raydium, Marinade")\n\n**Example:** "Create instance Alpha with whitelist: Jupiter, Raydium, Marinade"\n\n**Available Protocols:**\n• Jupiter, Raydium, Marinade, Kamino, Orca, Jito, Binance, Bybit`,
      shouldContinue: false
    };
  }
  
  // Save custom instance
  const instance = {
    id: `instance-${Date.now()}`,
    userId,
    name: instanceName,
    whitelistProtocols,
    isActive: true,
    createdAt: new Date().toISOString()
  };
  
  // Save to localStorage for now
  const instances = JSON.parse(localStorage.getItem('blossom-prime-instances') || '[]');
  instances.push(instance);
  localStorage.setItem('blossom-prime-instances', JSON.stringify(instances));
  
  // Emit custom event to update Strategies page
  window.dispatchEvent(new CustomEvent('blossom:instance-created', {
    detail: instance
  }));
  
  return {
    response: `✅ **Custom Instance Created**\n\n**Instance Details:**\n• Name: ${instanceName}\n• Whitelisted Protocols: ${whitelistProtocols.join(', ')}\n• Status: Active\n• Created: ${new Date().toLocaleString()}\n\n**What this means:**\n• All future deployments will only use whitelisted protocols\n• Strategies page will show "Instance ${instanceName}" banner\n• Non-whitelisted protocols will be filtered out\n• You can clear this instance anytime\n\n**View in Strategies:** Check the Strategies tab to see your whitelist in action`,
    shouldContinue: false
  };
}

// DAO Treasury: Rebalance to stable yield positions + optimize emissions ROI
async function handleDAOTreasuryRebalanceIntent(session: any, userId: string): Promise<{ response: string; shouldContinue: boolean }> {
  console.log('[DAO_DEBUG] ===== DAO TREASURY HANDLER CALLED =====');
  console.log('[DAO_DEBUG] handleDAOTreasuryRebalanceIntent called with:', {
    userId,
    rebalanceType: session.slots.rebalanceType,
    sessionSlots: session.slots
  });
  
  const { rebalanceType = 'both' } = session.slots;
  
  try {
    // Get current positions and cash balance
    const currentPositions = await getCurrentPositions(userId);
    const totalDeployed = currentPositions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    
    // Get available cash using the correct wallet system
    const { getTotalUSD } = await import('../bridge/walletSimStore');
    const totalCash = getTotalUSD(userId);
    
    // Total capital should be the sum of deployed + cash
    const totalCapital = totalDeployed + totalCash;
    
    console.log('[DAO_DEBUG] Cash calculation:', {
      userId,
      totalDeployed,
      totalCash,
      totalCapital,
      positions: currentPositions
    });
    
    if (totalDeployed === 0) {
      return {
        response: `🏛️ **DAO Treasury Management**\n\nI can help optimize your DAO's treasury for stable yield and emissions ROI.\n\n**Current Status:** No active positions found\n\n**I can help you:**\n• Analyze current portfolio exposure\n• Rebalance to stable yield positions\n• Optimize emissions and token distribution\n• Risk management for treasury assets\n\n**First, deploy some capital using our strategies, then I can help rebalance it for optimal returns.**`,
        shouldContinue: false
      };
    }
    
    // Analyze current positions
    const stablePositions = currentPositions.filter(pos => pos.asset === 'USDC' || pos.asset === 'USDT');
    const volatilePositions = currentPositions.filter(pos => pos.asset !== 'USDC' && pos.asset !== 'USDT');
    const stableValue = stablePositions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    const volatileValue = volatilePositions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    
    // Calculate current APY (weighted average)
    const currentAPY = currentPositions.reduce((sum, pos) => {
      const apy = pos.baseAPY || 0;
      const weight = (pos.amountUSD || 0) / totalDeployed;
      return sum + (apy * weight);
    }, 0);
    
    // Calculate risk metrics
    const riskScore = volatileValue / totalDeployed * 100; // 0-100 scale
    const diversification = currentPositions.length;
    
    // Create rebalancing plan
    const rebalancePlan = await createDAORebalancePlan(userId, currentPositions, rebalanceType, totalCapital);
    
    if (rebalancePlan) {
      // Calculate expected improvements
      const newAPY = rebalancePlan.allocations.reduce((sum, a) => {
        const weight = a.amount / totalDeployed;
        return sum + (a.apy * weight);
      }, 0);
      
      const apyImprovement = newAPY - currentAPY;
      const riskReduction = riskScore - 30; // Target 30% risk score
      
      console.log('[DAO_DEBUG] Saving DAO rebalance plan:', {
        planId: rebalancePlan.id,
        capitalUSD: rebalancePlan.capitalUSD,
        allocations: rebalancePlan.allocations.length
      });
      saveProposedPlan(rebalancePlan, userId);
      const updatedSession = { ...session, stage: 'waitingConfirm', pendingPlanId: rebalancePlan.id };
      saveSession(userId, updatedSession);
      console.log('[DAO_DEBUG] Session saved with pendingPlanId:', rebalancePlan.id);
      console.log('[DAO_DEBUG] Updated session state:', updatedSession);
      
      return {
        response: `🏛️ **DAO Treasury Analysis & Rebalancing**\n\n**Current Portfolio Analysis:**\n• Total Capital: ${fmtUSD(totalCapital)}\n• Deployed: ${fmtUSD(totalDeployed)} (${fmtPct(totalDeployed / totalCapital * 100)}%)\n• Cash Available: ${fmtUSD(totalCash)} (${fmtPct(totalCash / totalCapital * 100)}%)\n• Stable Assets: ${fmtUSD(stableValue)} (${fmtPct(stableValue / totalDeployed * 100)}%)\n• Volatile Assets: ${fmtUSD(volatileValue)} (${fmtPct(volatileValue / totalDeployed * 100)}%)\n• Current APY: ${fmtPct(currentAPY)}\n• Risk Score: ${riskScore.toFixed(1)}/100\n• Diversification: ${diversification} protocols\n\n**Rebalancing Plan:**\n${rebalancePlan.allocations.map(a => `• ${a.protocol}: ${fmtUSD(a.amount)} (${fmtPct(a.apy)} APY, ${a.risk} risk)`).join('\n')}\n\n**Expected Improvements:**\n• New APY: ${fmtPct(newAPY)} (${apyImprovement > 0 ? '+' : ''}${fmtPct(apyImprovement)})\n• Risk Reduction: ${riskReduction.toFixed(1)} points\n• Better Diversification: ${rebalancePlan.allocations.length} protocols\n• Stable Yield Focus: 100% USDC allocation\n\n**Ready to rebalance?** Click Execute to deploy, Adjust to modify, or Cancel to abort. You can also type "yes, let's deploy", "let's adjust to X", or "cancel" to change the topic.`,
        shouldContinue: false,
        metadata: {
          microCTAs: [
            { label: 'Execute', action: 'execute', data: { type: 'confirm' } },
            { label: 'Adjust', action: 'adjust', data: { type: 'modify' } },
            { label: 'Cancel', action: 'cancel', data: { type: 'abort' } }
          ]
        }
      };
    }
    
    return {
      response: `❌ **Rebalancing Failed**\n\nI couldn't create a rebalancing plan. Please try again or contact support.`,
      shouldContinue: false
    };
  } catch (error) {
    console.error('DAO Treasury rebalancing error:', error);
    return {
      response: `❌ **Temporary Network Issue**\n\nI encountered an error while analyzing your treasury. Please try again.`,
      shouldContinue: false
    };
  }
}

// API Management: Link to API key management
function handleAPIManagementIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  return {
    response: `🔑 **API Management**\n\nI can help you manage your Blossom API keys for institutional integration.\n\n**Available Features:**\n• **API Key Generation** - Create new keys for your desk\n• **Rate Limiting** - Set custom limits per key\n• **Webhook Configuration** - Real-time data feeds\n• **Documentation** - Complete API reference\n\n**Access:** Check your **Portfolio** tab → **API Management** section\n\n**Need help with integration?** I can guide you through:\n• Authentication setup\n• Webhook configuration\n• Rate limit optimization\n• Error handling\n\nWhat specific API integration do you need help with?`,
    shouldContinue: false
  };
}

// Small Talk: Handle casual conversation
function handleSmallTalkIntent(session: any, userId: string): { response: string; shouldContinue: boolean } {
  const responses = [
    "Hello! I'm your institutional DeFi assistant. How can I help optimize your yield strategies today?",
    "Hi there! I specialize in Market Maker, Fund Manager, Prime Broker, and DAO Treasury use cases. What brings you here?",
    "Hey! I can help with auto-deployment, yield monitoring, vault whitelisting, and treasury optimization. What's your focus?",
    "Thanks for reaching out! I'm here to help with institutional DeFi strategies. What can I assist you with today?",
    "Great to meet you! I work with institutional clients on yield optimization, risk management, and API integration. How can I help?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    response: randomResponse,
    shouldContinue: false
  };
}

function updateParams(sessionId: string, message: string) {
  const p = sessions.get(sessionId) ?? {};
  const size = parseSize(message); 
  if (size) p.sizeUSD = size;

  // Light NLP for asset/chain/risk toggles (keep very simple, no third-party libs)
  // asset
  if (/usdc/i.test(message)) p.asset = 'USDC';
  if (/\bsol\b|\bsolana\b/i.test(message)) p.chain = 'solana';
  if (/\beth(ereum)?\b/i.test(message)) p.chain = p.chain ?? 'ethereum';
  if (/\binjective\b/i.test(message)) p.chain = 'injective';
  if (/auto(-| )?rebal/i.test(message)) p.autoRebalance = true;
  
  // risk level
  const riskMatch = message.match(/\b(low|medium|high)\b.*risk/i);
  if (riskMatch) p.risk = riskMatch[1] as 'low'|'medium'|'high';

  sessions.set(sessionId, p);
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[session:params]', { sessionId: sessionId.slice(-8), params: p });
  }
}
import { parseEnhancedIntent } from './conversation/enhanced-parser';
import { composeResponse } from './conversation/response-composer';
import { planMemory } from './conversation/plan-memory';
import { 
  generateFollowUp, 
  generateExplanation, 
  generateComparison,
  processAlertIntent,
  processSaveIntent,
  processModifyIntent,
  processCompareIntent,
  processExplainIntent,
  processListIntent
} from './conversation/enhanced-policies';
import type { ChatPlan } from '../bridge/types';

const DEBUG_CHAT = import.meta.env.VITE_DEBUG_CHAT === '1';

const debugLog = (event: string, data?: any) => {
  if (DEBUG_CHAT) {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} ${event}`, data);
  }
};

export function useDemoAI() {
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(async (content: string, messages: any[], setMessages: (fn: (prev: any[]) => any[]) => void): Promise<void> => {
    if (!content.trim()) return;

    debugLog('submit:start', { contentLength: content.length });

    // Get stable sessionId and userId
    const sessionId = getSessionId();
    const userId = getActiveUserId();
    debugLog('session:current', { sessionId: sessionId.slice(-8), userId }); // Log last 8 chars for privacy
    
    // Update session parameters from user message
    updateParams(sessionId, content.trim());

    // Get current conversation context
    const currentContext = getContextForUser(userId);
    
    // Parse user message to update context and detect small-talk
    const parseResult = parseUserMessage(content.trim(), currentContext);
    const { smallTalk, ...newContext } = parseResult;
    saveContextForUser(userId, newContext);

    // Parse enhanced intent
    const enhancedIntent = parseEnhancedIntent(content.trim());
    const currentPlan = planMemory.getCurrentPlan();
    const previousPlan = planMemory.getPreviousPlan();

    // Immediately append user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: content.trim(),
      createdAt: Date.now(),
    };

    setMessages(prev => {
      debugLog('store:append:user', { contentLength: content.length });
      return [...prev, userMessage];
    });

    setIsTyping(true);

    try {
      // Handle intent-based processing first
      const intentResult = await processIntentBasedMessage(content.trim(), userId);
      if (!intentResult.shouldContinue) {
        // Intent-based response
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: intentResult.response,
          metadata: intentResult.metadata,
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant:intent', { contentLength: intentResult.response.length });
          return [...prev, assistantMessage];
        });

        setIsTyping(false);
        return;
      }

      // Handle small-talk without network calls
      if (smallTalk) {
        let responseContent: string;
        
        // Special handling for reset confirmation
        if (smallTalk === 'reset') {
          responseContent = handleSmallTalk(smallTalk, newContext);
        } else if (smallTalk === 'affirm' && messages.length > 1) {
          // Check if this is confirming a reset
          const lastMessage = messages[messages.length - 2]; // -1 is current user message, -2 is last assistant
          if (lastMessage?.content?.includes('Reset chat for this user')) {
            // Execute reset
            const welcomeMessages = resetChatForUser(userId);
            setMessages(() => welcomeMessages);
            setIsTyping(false);
            setIsStreaming(false);
            return;
          } else {
            responseContent = handleSmallTalk(smallTalk, newContext, lastMessage?.content);
          }
        } else {
          responseContent = handleSmallTalk(smallTalk, newContext);
        }
        
        // Create small-talk response without API call
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: responseContent,
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: responseContent.length, type: 'smalltalk' });
          return [...prev, assistantMessage];
        });

        return; // Don't call API for small-talk
      }

      // Check for follow-up questions using enhanced system
      const followUp = generateFollowUp(enhancedIntent, currentPlan);
      if (followUp) {
        const followUpMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: followUp.question,
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: followUp.question.length, type: 'followup' });
          return [...prev, followUpMessage];
        });

        return; // Don't call API for follow-ups
      }

      // Process intent-specific actions
      let processedResult: any = null;
      let alertRule: any = null;
      let explanation: string[] = [];
      let comparison: any = null;
      let allocations: any[] = [];

      switch (enhancedIntent.type) {
        case 'alert':
          alertRule = processAlertIntent(content);
          if (alertRule) {
            createAlertRule(alertRule);
          }
          break;
          
        case 'save':
          if (enhancedIntent.slots.strategyName && currentPlan) {
            processSaveIntent(enhancedIntent.slots.strategyName, currentPlan);
          }
          break;
          
        case 'modify':
          processedResult = processModifyIntent(enhancedIntent.slots, currentPlan);
          if (processedResult) {
            setLatestPlan(processedResult);
            planMemory.setCurrentPlan(processedResult);
          }
          break;
          
        case 'compare':
          if (enhancedIntent.slots.comparisonTargets) {
            comparison = processCompareIntent(
              enhancedIntent.slots.comparisonTargets,
              enhancedIntent.slots.assets?.[0] || 'USDC',
              enhancedIntent.slots.chains?.[0] || 'solana'
            );
          }
          break;
          
        case 'explain':
          explanation = processExplainIntent(currentPlan);
          break;
          
        case 'list':
          allocations = processListIntent(enhancedIntent.slots);
          break;
          
        case 'confirm':
          // Handle confirmation of proposed plan
          const currentPlan = getProposedPlan(getActiveUserId() || 'guest');
          if (currentPlan) {
            try {
              const userId = getActiveUserId() || 'guest';
              
              // Apply the plan immediately
              await applyPlanById(userId, currentPlan);
              
              const confirmMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: `✅ **Deployed successfully!** $${currentPlan.capitalUSD.toLocaleString()} deployed across ${currentPlan.allocations.length} protocols. Check your Portfolio for positions and Analytics for detailed breakdown.`,
                metadata: { type: 'confirmation', planId: currentPlan.id },
                createdAt: Date.now(),
              };

              setMessages(prev => [...prev, confirmMessage]);
              
              // Clear the proposed plan
              clearProposedPlan(userId);
              
              return; // Skip further processing
            } catch (error) {
              debugLog('plan:apply:error', { error: error instanceof Error ? error.message : error });
            }
          }
          break;
          
        case 'adjust':
          // Handle plan adjustment
          const adjustPlan = getProposedPlan(getActiveUserId() || 'guest');
          if (adjustPlan) {
            const adjustMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant' as const,
              content: `**Adjust your deployment:**\n\nCurrent plan: $${adjustPlan.sizeUSD.toLocaleString()} across ${adjustPlan.allocations.length} protocols.\n\nWhat would you like to change?\n• New amount (e.g., "500k")\n• Different asset (e.g., "SOL")\n• Different chain (e.g., "injective")\n• Risk level (e.g., "low risk")`,
              metadata: { type: 'adjustment', planId: adjustPlan.id },
              createdAt: Date.now(),
            };

            setMessages(prev => [...prev, adjustMessage]);
            return;
          }
          break;
          
        case 'cancel':
          // Handle plan cancellation
          clearProposedPlan(getActiveUserId() || 'guest');
          const cancelMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant' as const,
            content: `❌ **Deployment cancelled.** No changes made to your portfolio.`,
            metadata: { type: 'cancellation' },
            createdAt: Date.now(),
          };

          setMessages(prev => [...prev, cancelMessage]);
          return;
          
        case 'deploy':
          // For deploy, use live data instead of API response
          try {
            const sessionParams = sessions.get(sessionId) || {};
            const capitalUSD = sessionParams.sizeUSD || 1000000;
            const chain = sessionParams.chain || enhancedIntent.slots.chains?.[0] || 'solana';
            const asset = sessionParams.asset || 'USDC';
            
            // Fetch live yields for the specified chain
            const yields = await fetchYields({ chain });
            const topProtocols = yields
              .sort((a, b) => b.tvlUSD - a.tvlUSD)
              .slice(0, 5); // Top 5 by TVL
            
            if (topProtocols.length > 0) {
              // Create allocations from live data
              const totalPercentage = 100;
              const allocations = topProtocols.map((proto, index) => {
                const percentage = Math.round(totalPercentage / topProtocols.length);
                return {
                  protocol: proto.protocol,
                  chain: proto.chain,
                  asset: proto.asset,
                  percentage,
                  amount: (capitalUSD * percentage) / 100,
                  estApy: proto.apy,
                  tvl: proto.tvlUSD,
                  riskLabel: proto.risk
                };
              });
              
              const plan: ChatPlan = {
                planSummary: `Deploy $${capitalUSD.toLocaleString()} across ${topProtocols.length} top ${chain} protocols`,
                allocations,
                totalAmount: capitalUSD,
                avgApy: topProtocols.reduce((sum, p) => sum + p.apy, 0) / topProtocols.length,
                riskLevel: sessionParams.risk || 'medium',
                rebalanceRule: sessionParams.autoRebalance ? 'Auto-rebalance enabled' : undefined,
                whitelist: undefined
              };
              
              // Store plan for Analytics and memory
              setLatestPlan(plan);
              planMemory.setCurrentPlan(plan);
              
              // Create proposed plan for Analytics auto-open
              const proposedPlan = {
                id: crypto.randomUUID(),
                userId: getActiveUserId() || 'guest',
                sizeUSD: capitalUSD,
                asset: asset,
                chain: chain,
                allocations: allocations.map(alloc => ({
                  protocol: alloc.protocol,
                  percent: alloc.percentage,
                  estAPY: alloc.estApy
                })),
                estAvgAPY: plan.avgApy,
                createdAt: new Date().toISOString(),
                status: 'pending' as const
              };
              saveProposedPlan(proposedPlan);
              
              debugLog('plan:stored', { 
                allocations: plan.allocations.length, 
                total: plan.totalAmount, 
                proposedPlanId: proposedPlan.id,
                sessionParams: { sizeUSD: sessionParams.sizeUSD, asset: sessionParams.asset, chain: sessionParams.chain, risk: sessionParams.risk }
              });
              
              // Create response content with confirmation
              const responseContent = `**Deploy $${capitalUSD.toLocaleString()} in ${asset} on ${chain} across ${topProtocols.length} protocols (avg APY ${plan.avgApy.toFixed(2)}%, risk ${sessionParams.risk || 'medium'}).**\n\n**Allocations (top ${topProtocols.length}):**\n${allocations.map(alloc => `• ${alloc.asset} → ${alloc.protocol} (${alloc.chain}) – ${alloc.estApy.toFixed(2)}% APY, TVL ~${alloc.tvl.toLocaleString()}, Risk: ${alloc.riskLabel}`).join('\n')}\n\n**Portfolio Summary:**\n• Total Value: $${capitalUSD.toLocaleString()}\n• Average APY: ${plan.avgApy.toFixed(2)}%\n• Risk Score: ${topProtocols.reduce((sum, p) => sum + (p.risk === 'low' ? 3 : p.risk === 'medium' ? 6 : 9), 0) / topProtocols.length}/10\n• Diversification: ${topProtocols.length}\n\n**Ready to deploy?** Click Execute to deploy, Adjust to modify, or Cancel to abort. You can also type "yes, let's deploy", "let's adjust to X", or "cancel" to change the topic.`;
              
              const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: responseContent,
                metadata: { 
                  payload: { schemaVersion: 'v1', allocations }, 
                  context: newContext,
                  microCTAs: [
                    { label: 'Execute', action: 'execute', data: { type: 'confirm' } },
                    { label: 'Adjust', action: 'adjust', data: { type: 'modify' } },
                    { label: 'Cancel', action: 'cancel', data: { type: 'abort' } }
                  ]
                },
                createdAt: Date.now(),
              };

              setMessages(prev => {
                debugLog('store:append:assistant', { contentLength: responseContent.length });
                return [...prev, assistantMessage];
              });
              
              return; // Skip API call for deploy
            }
          } catch (error) {
            debugLog('live:deploy:error', { error: error instanceof Error ? error.message : error });
            // Fall through to API call if live data fails
          }
          break;
      }

      // For deploy and other intents that need API calls, use the existing flow
      if (enhancedIntent.type === 'deploy' || (!processedResult && !alertRule && !explanation.length && !comparison && !allocations.length)) {
        // Determine if we should stream
        const shouldStream = import.meta.env.VITE_AI_STREAM === '1';
        
        debugLog('net:start', { 
          mode: shouldStream ? 'SSE' : 'JSON',
          payloadShape: { sessionId: 'provided', message: 'provided' }
        });

        // Use the unified sendChat helper
        const response = await sendChat({
          sessionId,
          message: content.trim(),
          stream: shouldStream,
        });

        debugLog('net:status', { 
          status: 200,
          hasPayload: !!response,
          schemaVersion: response.schemaVersion 
        });

        // Convert response to text using existing formatter, then enhance with conversation logic
        const baseContent = payloadToText(response);
        const enhancedContent = generateCompletionResponse(newContext, baseContent);

        // Process portfolio plan if response contains allocations
        if (response.allocations && response.allocations.length > 0) {
          try {
            // Get session parameters
            const sessionParams = sessions.get(sessionId) || {};
            const capitalUSD = sessionParams.sizeUSD || 1000000; // Use session size or default to 1M
            
            const plan: ChatPlan = {
              planSummary: response.planSummary || baseContent.split('\n')[0] || 'DeFi allocation plan',
              allocations: response.allocations.map((alloc: any) => ({
                protocol: alloc.protocol || 'Unknown',
                chain: alloc.chain || sessionParams.chain || 'ethereum',
                asset: alloc.asset || sessionParams.asset || 'USDC',
                percentage: alloc.amount_pct || 0,
                amount: alloc.amount || 0,
                estApy: alloc.estApy || 0,
                tvl: alloc.tvl || 0,
                riskLabel: alloc.riskLabel || sessionParams.risk || 'medium'
              })),
              totalAmount: capitalUSD, // Use session size
              avgApy: response.allocations.reduce((sum: number, alloc: any) => sum + (alloc.estApy || 0), 0) / response.allocations.length,
              riskLevel: sessionParams.risk || newContext.risk || 'medium',
              rebalanceRule: sessionParams.autoRebalance ? 'Auto-rebalance enabled' : (newContext.autoRebalance ? 'Auto-rebalance enabled' : undefined),
              whitelist: response.whitelist || newContext.whitelist
            };
            
            // Store plan for Analytics and memory
            setLatestPlan(plan);
            planMemory.setCurrentPlan(plan);
            
            // Create proposed plan for Analytics auto-open
            const proposedPlan = {
              id: crypto.randomUUID(),
              userId: getActiveUserId() || 'guest',
              sizeUSD: capitalUSD,
              asset: sessionParams.asset || 'USDC',
              chain: (sessionParams.chain || enhancedIntent.slots.chains?.[0] || 'solana') as 'solana' | 'ethereum' | 'injective',
              allocations: response.allocations.map((alloc: any) => ({
                protocol: alloc.protocol || 'Unknown',
                percent: alloc.amount_pct || 0,
                estAPY: alloc.estApy || 0
              })),
              estAvgAPY: plan.avgApy,
              createdAt: new Date().toISOString(),
              status: 'pending' as const
            };
            saveProposedPlan(proposedPlan);
            
            debugLog('plan:stored', { 
              allocations: plan.allocations.length, 
              total: plan.totalAmount, 
              proposedPlanId: proposedPlan.id,
              sessionParams: { sizeUSD: sessionParams.sizeUSD, asset: sessionParams.asset, chain: sessionParams.chain, risk: sessionParams.risk }
            });
          } catch (error) {
            debugLog('plan:store:error', { error: error instanceof Error ? error.message : error });
          }
        }

        // Add assistant message
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: enhancedContent,
          metadata: { payload: response, context: newContext },
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: enhancedContent.length });
          return [...prev, assistantMessage];
        });
      } else {
        // Use the new conversational layer for processed intents
        const composedResponse = composeResponse({
          userMessage: content.trim(),
          intent: enhancedIntent,
          currentPlan: currentPlan || processedResult,
          previousPlan,
          allocations,
          explanation,
          comparison,
          alertRule
        });

        // Format the response with micro-CTAs
        let responseContent = `**${composedResponse.affirmation}**\n\n${composedResponse.body}`;
        
        if (composedResponse.explanation && composedResponse.explanation.length > 0) {
          responseContent += '\n\n**Why these picks:**\n' + composedResponse.explanation.map(exp => `• ${exp.point}`).join('\n');
        }

        // Add micro-CTAs as metadata
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: responseContent,
          metadata: { 
            microCTAs: composedResponse.microCTAs,
            intent: enhancedIntent.type,
            context: newContext 
          },
          createdAt: Date.now(),
        };

        setMessages(prev => {
          debugLog('store:append:assistant', { contentLength: responseContent.length, type: 'enhanced' });
          return [...prev, assistantMessage];
        });
      }

    } catch (error) {
      debugLog('net:error', { error: error instanceof Error ? error.message : error });
      
      // Add non-destructive error message (keep history intact)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'I encountered a temporary network issue. Please try again.',
        createdAt: Date.now(),
      };

      setMessages(prev => {
        debugLog('store:append:assistant', { contentLength: 0, type: 'error' });
        return [...prev, errorMessage];
      });
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  }, []);

  return {
    sendMessage,
    isTyping,
    isStreaming,
  };
}

// Helper functions for institutional flows

async function getCurrentBalance(userId: string, asset: string): Promise<number> {
  try {
    const { getCashBalances } = await import('../bridge/walletSimStore');
    const balances = getCashBalances(userId);
    return balances[asset] || 0;
  } catch {
    return 0;
  }
}

async function getCurrentPositions(userId: string): Promise<any[]> {
  try {
    const { positionsStore } = await import('../bridge/positionsStore');
    return positionsStore.getPositions(userId);
  } catch {
    return [];
  }
}

async function createMarketMakerPlan(userId: string, sizeUSD: number, asset: string, chain: string, targetAPY: number): Promise<any> {
  try {
    const protocols = await fetchLiveProtocols(chain);
    
    // If no live data available, create a demo plan
    if (!protocols || protocols.length === 0) {
      const allocations = [
        {
          protocol: 'Raydium',
          chain: chain,
          asset: asset,
          apy: targetAPY * 1.2,
          tvl: 1000000,
          risk: 'medium',
          amount: sizeUSD * 0.4
        },
        {
          protocol: 'Orca',
          chain: chain,
          asset: asset,
          apy: targetAPY * 1.1,
          tvl: 800000,
          risk: 'medium',
          amount: sizeUSD * 0.3
        },
        {
          protocol: 'Jupiter',
          chain: chain,
          asset: asset,
          apy: targetAPY * 0.9,
          tvl: 600000,
          risk: 'medium',
          amount: sizeUSD * 0.3
        }
      ];
      
      return {
        id: `market-maker-${Date.now()}`,
        userId,
        capitalUSD: sizeUSD,
        asset,
        chain,
        risk: 'medium',
        autoRebalance: true,
        allocations,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
    }
    
    const eligibleProtocols = protocols.filter(p => p.chain === chain && p.apy >= targetAPY * 0.8);
    
    if (eligibleProtocols.length === 0) {
      return null;
    }
    
    // Sort by APY and take top 3-5 protocols
    const topProtocols = eligibleProtocols
      .sort((a, b) => b.apy - a.apy)
      .slice(0, Math.min(5, eligibleProtocols.length));
    
    // Distribute capital across protocols
    const allocations = topProtocols.map((protocol, index) => {
      const weight = index === 0 ? 0.4 : (index === 1 ? 0.3 : 0.3 / (topProtocols.length - 2));
      return {
        protocol: protocol.protocol,
        chain: protocol.chain,
        asset: protocol.asset,
        apy: protocol.apy,
        tvl: protocol.tvlUSD,
        risk: protocol.risk,
        amount: sizeUSD * weight
      };
    });
    
    return {
      id: `market-maker-${Date.now()}`,
      userId,
      capitalUSD: sizeUSD,
      asset,
      chain,
      risk: 'medium',
      autoRebalance: true,
      allocations,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating market maker plan:', error);
    return null;
  }
}

async function createDAORebalancePlan(userId: string, currentPositions: any[], rebalanceType: string, totalCapital: number): Promise<any> {
  try {
    const totalDeployed = currentPositions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    
    if (totalDeployed === 0) return null;
    
    // For DAO Treasury rebalancing, we should rebalance the deployed amount
    // but also consider using available cash for better diversification
    const rebalanceAmount = Math.min(totalDeployed, totalCapital * 0.2); // Rebalance up to 20% of total capital
    
    // Get stable yield protocols
    const protocols = await fetchLiveProtocols('solana');
    
    // If no live data available, create a demo plan
    if (!protocols || protocols.length === 0) {
      const allocations = [
        {
          protocol: 'Kamino Lend',
          chain: 'solana',
          asset: 'USDC',
          apy: 8.5,
          tvl: 50000000,
          risk: 'low',
          amount: rebalanceAmount * 0.4,
          amountUSD: rebalanceAmount * 0.4
        },
        {
          protocol: 'Marinade',
          chain: 'solana',
          asset: 'USDC',
          apy: 7.2,
          tvl: 30000000,
          risk: 'low',
          amount: rebalanceAmount * 0.3,
          amountUSD: rebalanceAmount * 0.3
        },
        {
          protocol: 'Jupiter',
          chain: 'solana',
          asset: 'USDC',
          apy: 6.8,
          tvl: 20000000,
          risk: 'low',
          amount: rebalanceAmount * 0.2,
          amountUSD: rebalanceAmount * 0.2
        },
        {
          protocol: 'Orca',
          chain: 'solana',
          asset: 'USDC',
          apy: 5.5,
          tvl: 15000000,
          risk: 'low',
          amount: rebalanceAmount * 0.1,
          amountUSD: rebalanceAmount * 0.1
        }
      ];
      
      return {
        id: `dao-rebalance-${Date.now()}`,
        userId,
        capitalUSD: rebalanceAmount,
        asset: 'USDC',
        chain: 'solana',
        risk: 'low',
        autoRebalance: true,
        allocations,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
    }
    
    const stableProtocols = protocols.filter(p => 
      p.asset === 'USDC' && p.apy >= 3 && p.tvlUSD > 10000000
    );
    
    if (stableProtocols.length === 0) return null;
    
    // Create rebalancing plan focused on stable yields
    const allocations = stableProtocols.slice(0, 4).map((protocol, index) => {
      const weights = [0.4, 0.3, 0.2, 0.1]; // Diversified allocation
      const weight = weights[index] || 0.1;
      return {
        protocol: protocol.protocol,
        chain: protocol.chain,
        asset: protocol.asset,
        apy: protocol.apy,
        tvl: protocol.tvlUSD,
        risk: 'low',
        amount: rebalanceAmount * weight,
        amountUSD: rebalanceAmount * weight
      };
    });
    
    return {
      id: `dao-rebalance-${Date.now()}`,
      userId,
      capitalUSD: rebalanceAmount,
      asset: 'USDC',
      chain: 'solana',
      risk: 'low',
      autoRebalance: true,
      allocations,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
  } catch (error) {
    console.error('Error creating DAO rebalance plan:', error);
    return null;
  }
}
