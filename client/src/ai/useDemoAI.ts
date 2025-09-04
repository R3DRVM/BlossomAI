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
async function processIntentBasedMessage(content: string, userId: string): Promise<{ response: string; shouldContinue: boolean }> {
  const session = loadSession(userId);
  
  // If waiting for confirmation, handle yes/no/edit/cancel
  if (session.stage === 'waitingConfirm') {
    const userText = content.toLowerCase().trim();
    
    if (/^y(es)?$/i.test(userText)) {
      // User confirmed - apply the plan
      const plan = getProposedPlan(userId);
      console.log('[chat:deploy:check]', { 
        userId, 
        plan: plan ? { id: plan.id, status: plan.status, capitalUSD: plan.capitalUSD } : null, 
        sessionPlanId: session.pendingPlanId,
        sessionStage: session.stage
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
          
          return { response: `🎉 **Deployment successful!**\n\nYour ${fmtUSD(plan.capitalUSD)} has been allocated across ${plan.allocations.length} protocols. You can now:\n\n• Check your **Portfolio** to see all positions\n• View **Analytics** for detailed performance metrics\n• Deploy more strategies or try different approaches\n\nWhat would you like to explore next?`, shouldContinue: false };
        } catch (error) {
          console.error('[chat:deploy:error]', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { response: `❌ **Deployment failed!** ${errorMessage}\n\nPlease try again or contact support if the issue persists.`, shouldContinue: false };
        }
      }
    }
    
    if (/^n(o)?$/i.test(userText)) {
      // User cancelled
      clearProposedPlan(userId);
      session.stage = 'idle';
      session.pendingPlanId = undefined;
      saveSession(userId, session);
      return { response: '❌ Deployment cancelled. No changes made to your portfolio.', shouldContinue: false };
    }
    
    // Handle edit commands with more flexible patterns
    if (/edit.*(\d+[kmb]?)|change.*(\d+[kmb]?)|make.*(\d+[kmb]?)|update.*(\d+[kmb]?)/i.test(userText)) {
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
          
          return { response: `✅ Updated amount to ${fmtUSD(newAmount)}. Please confirm: **yes** to deploy, **no** to cancel.`, shouldContinue: false };
        }
      }
    }
    
    return { response: 'Got it! You can:\n• Reply **yes** to deploy this plan\n• Reply **no** to cancel\n• Say **edit amount to 100k** to change the amount\n\nWhat would you like to do?', shouldContinue: false };
  }
  
  // Detect new intent
  const intent = detectIntent(content);
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
  
  // Check if we have all required slots
  const required = requiredSlots[intent];
  const missing = required.filter(slot => session.slots[slot] === undefined);
  
  if (missing.length > 0) {
    saveSession(userId, session);
    return { response: generateSlotQuestion(intent, missing), shouldContinue: false };
  }
  
  // All slots collected, create plan for deploy intents
  if (intent === 'DEPLOY_HIGHEST_APY') {
    return createDeployPlan(session, userId);
  }
  
  // Handle other intents
  return handleOtherIntent(intent, session, userId);
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
    // Extract size
    const sizeMatch = content.match(/(\d+[kmb]?)/i);
    if (sizeMatch) {
      const size = parseSize(sizeMatch[1]);
      if (size) slots.sizeUSD = size;
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
function handleOtherIntent(intent: Intent, session: any, userId: string): { response: string; shouldContinue: boolean } {
  switch (intent) {
    case 'SHOW_POSITIONS':
      return { response: 'Here are your current positions. [View detailed breakdown in Portfolio]', shouldContinue: false };
    case 'RESET_BALANCES':
      return { response: 'You can reset your wallet and clear all positions using the menu (⋮) in the top-right corner. This will restore your balances to the original seed amounts and clear all active positions.', shouldContinue: false };
    case 'YIELD_SOURCES':
      return handleYieldSourcesIntent(session, userId);
    case 'ALERT_THRESHOLD':
      return handleAlertIntent(session, userId);
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
              const responseContent = `**Deploy $${capitalUSD.toLocaleString()} in ${asset} on ${chain} across ${topProtocols.length} protocols (avg APY ${plan.avgApy.toFixed(2)}%, risk ${sessionParams.risk || 'medium'}).**\n\n**Allocations (top ${topProtocols.length}):**\n${allocations.map(alloc => `• ${alloc.asset} → ${alloc.protocol} (${alloc.chain}) – ${alloc.estApy.toFixed(2)}% APY, TVL ~${alloc.tvl.toLocaleString()}, Risk: ${alloc.riskLabel}`).join('\n')}\n\n**Portfolio Summary:**\n• Total Value: $${capitalUSD.toLocaleString()}\n• Average APY: ${plan.avgApy.toFixed(2)}%\n• Risk Score: ${topProtocols.reduce((sum, p) => sum + (p.risk === 'low' ? 3 : p.risk === 'medium' ? 6 : 9), 0) / topProtocols.length}/10\n• Diversification: ${topProtocols.length}\n\n**Ready to deploy?** Click Confirm to execute, Adjust to modify, or Cancel to abort.`;
              
              const assistantMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant' as const,
                content: responseContent,
                metadata: { payload: { schemaVersion: 'v1', allocations }, context: newContext },
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
