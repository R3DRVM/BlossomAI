import { ChatMessage } from '../store';
import { ChatPlan } from '../../bridge/types';
import { AlertRule } from '../../bridge/alertsStore';

export interface ResponseComposerInput {
  userMessage: string;
  intent: {
    type: 'greeting' | 'deploy' | 'modify' | 'explain' | 'compare' | 'list' | 'save' | 'alert' | 'smalltalk';
    confidence: number;
    slots: Record<string, any>;
  };
  currentPlan?: ChatPlan;
  previousPlan?: ChatPlan;
  allocations?: any[];
  explanation?: string[];
  comparison?: any;
  alertRule?: AlertRule;
  followUp?: string;
}

export interface ComposedResponse {
  affirmation: string;
  body: string;
  explanation?: string[];
  microCTAs: MicroCTA[];
  metadata?: any;
}

export interface MicroCTA {
  label: string;
  action: 'simulate' | 'apply' | 'analytics' | 'alert' | 'portfolio' | 'undo' | 'deploy' | 'find' | 'compare' | 'execute' | 'adjust' | 'cancel';
  data?: any;
}

const DEBUG_POLISH = import.meta.env.VITE_POLISH === '1';

const debugLog = (event: string, data?: any) => {
  if (DEBUG_POLISH) {
    console.log(`polish:${event}`, data);
  }
};

export function composeResponse(input: ResponseComposerInput): ComposedResponse {
  debugLog('compose', { intent: input.intent.type, hasPlan: !!input.currentPlan });

  const { userMessage, intent, currentPlan, previousPlan, allocations, explanation, comparison, alertRule, followUp } = input;

  // Generate affirmation + paraphrase
  const affirmation = generateAffirmation(userMessage, intent, currentPlan);
  
  // Generate body content
  const body = generateBody(intent, currentPlan, allocations, comparison, alertRule, followUp);
  
  // Generate explanation if provided
  const explanationBullets = explanation || [];
  
  // Generate micro-CTAs
  const microCTAs = generateMicroCTAs(intent, currentPlan, previousPlan, alertRule);

  return {
    affirmation,
    body,
    explanation: explanationBullets.length > 0 ? explanationBullets : undefined,
    microCTAs,
    metadata: { intent: intent.type, hasPlan: !!currentPlan }
  };
}

function generateAffirmation(userMessage: string, intent: any, currentPlan?: ChatPlan): string {
  const lowerMessage = userMessage.toLowerCase();
  
  switch (intent.type) {
    case 'greeting':
    case 'smalltalk':
      return "Hey! I'm here to help optimize your DeFi strategy.";
      
    case 'deploy':
      const amount = intent.slots.capitalUSD || 'your capital';
      const asset = intent.slots.assets?.[0] || 'USDC';
      const chain = intent.slots.chains?.[0] || 'Solana';
      const apy = intent.slots.targetAPY || 'optimal';
      const risk = intent.slots.risk || 'medium';
      return `Got it—allocating ${amount} ${asset} on ${chain} targeting ~${apy}% APY with ${risk} risk.`;
      
    case 'modify':
      return `Adjusting your current plan based on your preferences.`;
      
    case 'explain':
      return `Here's the reasoning behind these allocations:`;
      
    case 'compare':
      return `Comparing protocols for your requirements:`;
      
    case 'list':
      return `Found the top yield opportunities for your criteria:`;
      
    case 'save':
      return `Saving this strategy for future use.`;
      
    case 'alert':
      return `Alert configured and monitoring active.`;
      
    default:
      return `Processing your request...`;
  }
}

function generateBody(intent: any, currentPlan?: ChatPlan, allocations?: any[], comparison?: any, alertRule?: AlertRule, followUp?: string): string {
  if (followUp) {
    return followUp;
  }

  switch (intent.type) {
    case 'greeting':
    case 'smalltalk':
      return "What would you like to do today? I can help you deploy capital, find yield opportunities, set up alerts, or optimize your existing positions.";
      
    case 'deploy':
    case 'list':
      if (allocations && allocations.length > 0) {
        return formatAllocationsTable(allocations);
      }
      return currentPlan?.planSummary || "Analyzing yield opportunities...";
      
    case 'modify':
      if (currentPlan) {
        return formatPlanDiff(currentPlan, intent.slots);
      }
      return "No active plan to modify. Create a deployment strategy first.";
      
    case 'explain':
      return "Here's why these allocations make sense for your goals:";
      
    case 'compare':
      if (comparison) {
        return formatComparison(comparison);
      }
      return "Comparing protocols based on your criteria...";
      
    case 'save':
      return "Strategy saved successfully. You can load it anytime with 'Load [strategy name]'.";
      
    case 'alert':
      if (alertRule) {
        return `Monitoring ${alertRule.asset} on ${alertRule.chain} for ${alertRule.condition}. Checking every ${alertRule.frequency}.`;
      }
      return "Alert configuration saved.";
      
    default:
      return "Processing your request...";
  }
}

function generateMicroCTAs(intent: any, currentPlan?: ChatPlan, previousPlan?: ChatPlan, alertRule?: AlertRule): MicroCTA[] {
  const ctas: MicroCTA[] = [];

  switch (intent.type) {
    case 'greeting':
    case 'smalltalk':
      ctas.push(
        { label: 'Deploy USDC', action: 'deploy', data: { asset: 'USDC' } },
        { label: 'Find Yields', action: 'find' },
        { label: 'Set Alert', action: 'alert' }
      );
      break;
      
    case 'deploy':
    case 'list':
      if (currentPlan) {
        ctas.push(
          { label: 'Apply to Portfolio', action: 'apply' },
          { label: 'Open Analytics', action: 'analytics' },
          { label: 'Set APR Alert', action: 'alert' }
        );
      }
      break;
      
    case 'modify':
      if (currentPlan) {
        ctas.push(
          { label: 'Apply Changes', action: 'apply' },
          { label: 'Open Analytics', action: 'analytics' }
        );
        if (previousPlan) {
          ctas.push({ label: 'Undo Change', action: 'undo' });
        }
      }
      break;
      
    case 'explain':
      ctas.push({ label: 'Open Analytics', action: 'analytics' });
      break;
      
    case 'compare':
      ctas.push(
        { label: 'Allocate to Winner', action: 'deploy' },
        { label: 'Create Alert on Loser', action: 'alert' }
      );
      break;
      
    case 'save':
      ctas.push({ label: 'Open Analytics', action: 'analytics' });
      break;
      
    case 'alert':
      ctas.push({ label: 'Open Analytics', action: 'analytics' });
      break;
  }

  debugLog('cta', { count: ctas.length, actions: ctas.map(c => c.action) });
  return ctas;
}

export function generateConfirmationCTAs(): MicroCTA[] {
  return [
    { label: 'Execute', action: 'execute', data: { type: 'confirm' } },
    { label: 'Adjust', action: 'adjust', data: { type: 'modify' } },
    { label: 'Cancel', action: 'cancel', data: { type: 'abort' } }
  ];
}

function formatAllocationsTable(allocations: any[]): string {
  if (!allocations || allocations.length === 0) return "No allocations found.";
  
  const table = allocations.slice(0, 5).map((alloc, idx) => {
    const pct = alloc.amountPct || alloc.percentage || 0;
    const apy = alloc.estApy || alloc.apy || 0;
    const risk = alloc.riskLabel || alloc.risk || 'Medium';
    return `${idx + 1}. ${alloc.asset} → ${alloc.protocol} (${pct.toFixed(1)}%, ${apy.toFixed(2)}% APY, ${risk} risk)`;
  }).join('\n');
  
  return `**Allocations:**\n${table}`;
}

function formatPlanDiff(currentPlan: ChatPlan, modifications: any): string {
  const changes: string[] = [];
  
  if (modifications.cadence) {
    changes.push(`Rebalance: ${modifications.cadence}`);
  }
  if (modifications.whitelist) {
    changes.push(`Protocols: ${modifications.whitelist.join(', ')}`);
  }
  if (modifications.capPerProtocol) {
    changes.push(`Max per protocol: ${modifications.capPerProtocol}%`);
  }
  if (modifications.risk) {
    changes.push(`Risk level: ${modifications.risk}`);
  }
  
  if (changes.length === 0) {
    return "No specific changes detected. Please specify what you'd like to modify.";
  }
  
  return `**Plan Updates:**\n${changes.map(c => `• ${c}`).join('\n')}`;
}

function formatComparison(comparison: any): string {
  if (!comparison.protocols || comparison.protocols.length < 2) {
    return "Need at least 2 protocols to compare.";
  }
  
  const [p1, p2] = comparison.protocols;
  return `**${p1.name} vs ${p2.name}:**\n` +
         `APY: ${p1.apy}% vs ${p2.apy}%\n` +
         `TVL: $${p1.tvl}M vs $${p2.tvl}M\n` +
         `Risk: ${p1.risk} vs ${p2.risk}`;
}





