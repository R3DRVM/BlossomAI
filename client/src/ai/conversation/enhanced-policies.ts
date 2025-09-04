import { EnhancedIntent } from './enhanced-parser';
import { ChatPlan } from '../../bridge/types';
import { planMemory } from './plan-memory';
import { alertsStore, parseAlertFromMessage } from '../../bridge/alertsStore';

export interface FollowUpQuestion {
  question: string;
  missingSlot: string;
  priority: number;
}

export interface ExplanationPoint {
  point: string;
  reasoning: string;
}

export function generateFollowUp(intent: EnhancedIntent, currentPlan?: ChatPlan): FollowUpQuestion | null {
  const { type, slots } = intent;
  
  // Check for missing critical slots based on intent type
  switch (type) {
    case 'deploy':
      if (!slots.capitalUSD) {
        return {
          question: "What size should I deploy (e.g., 250k, 10m)?",
          missingSlot: 'capitalUSD',
          priority: 1
        };
      }
      if (!slots.assets || slots.assets.length === 0) {
        return {
          question: "Which asset should I deploy (e.g., USDC, SOL)?",
          missingSlot: 'assets',
          priority: 2
        };
      }
      if (!slots.chains || slots.chains.length === 0) {
        return {
          question: "Which chain—Solana, Ethereum, or another?",
          missingSlot: 'chains',
          priority: 3
        };
      }
      if (!slots.risk) {
        return {
          question: "Risk band—low, medium, or high?",
          missingSlot: 'risk',
          priority: 4
        };
      }
      break;
      
    case 'modify':
      if (!currentPlan) {
        return {
          question: "No active plan to modify. Would you like to create a deployment strategy first?",
          missingSlot: 'currentPlan',
          priority: 1
        };
      }
      break;
      
    case 'compare':
      if (!slots.comparisonTargets || slots.comparisonTargets.length < 2) {
        return {
          question: "Which protocols should I compare (e.g., Orca vs Raydium)?",
          missingSlot: 'comparisonTargets',
          priority: 1
        };
      }
      break;
      
    case 'save':
      if (!slots.strategyName) {
        return {
          question: "What should I name this strategy?",
          missingSlot: 'strategyName',
          priority: 1
        };
      }
      break;
  }
  
  return null;
}

export function generateExplanation(currentPlan?: ChatPlan, intent?: EnhancedIntent): ExplanationPoint[] {
  if (!currentPlan || !intent) {
    return [];
  }
  
  const explanations: ExplanationPoint[] = [];
  
  // Generate explanations based on plan characteristics
  const topAllocation = currentPlan.allocations[0];
  if (topAllocation) {
    explanations.push({
      point: `Highest stable APY with sustained TVL (> $${(topAllocation.tvl / 1000000).toFixed(1)}M)`,
      reasoning: "Prioritizes protocols with proven track records and deep liquidity"
    });
  }
  
  if (currentPlan.allocations.length > 1) {
    explanations.push({
      point: "Diversified across multiple protocols to reduce single-point risk",
      reasoning: "Spreads exposure while maintaining yield optimization"
    });
  }
  
  const avgRisk = currentPlan.allocations.reduce((sum, alloc) => {
    const riskScore = alloc.riskLabel === 'Low' ? 1 : alloc.riskLabel === 'Medium' ? 2 : 3;
    return sum + riskScore;
  }, 0) / currentPlan.allocations.length;
  
  if (avgRisk <= 1.5) {
    explanations.push({
      point: "Conservative risk profile with established protocols",
      reasoning: "Focuses on capital preservation while earning competitive yields"
    });
  } else if (avgRisk >= 2.5) {
    explanations.push({
      point: "Higher risk allocation targeting maximum yield",
      reasoning: "Accepts increased risk for potentially higher returns"
    });
  }
  
  return explanations.slice(0, 3); // Limit to 3 bullets
}

export function generateComparison(protocols: string[], asset: string = 'USDC', chain: string = 'solana'): any {
  // Mock comparison data - in real implementation, this would fetch from data providers
  const mockData: Record<string, any> = {
    'orca': { name: 'Orca', apy: 12.5, tvl: 45.2, risk: 'Medium', fees: '0.3%' },
    'raydium': { name: 'Raydium', apy: 11.8, tvl: 67.8, risk: 'Medium', fees: '0.25%' },
    'jupiter': { name: 'Jupiter', apy: 13.2, tvl: 23.1, risk: 'High', fees: '0.5%' },
    'lido': { name: 'Lido', apy: 8.5, tvl: 156.3, risk: 'Low', fees: '0.1%' }
  };
  
  const comparisonProtocols = protocols.map(protocol => 
    mockData[protocol.toLowerCase()] || { 
      name: protocol, 
      apy: 10.0, 
      tvl: 20.0, 
      risk: 'Medium', 
      fees: '0.3%' 
    }
  );
  
  return {
    protocols: comparisonProtocols,
    asset,
    chain,
    winner: comparisonProtocols.reduce((best, current) => 
      current.apy > best.apy ? current : best
    )
  };
}

export function processAlertIntent(message: string): any {
  return parseAlertFromMessage(message);
}

export function processSaveIntent(strategyName: string, currentPlan?: ChatPlan): boolean {
  if (!currentPlan) {
    return false;
  }
  
  planMemory.saveStrategy(strategyName, currentPlan);
  return true;
}

export function processModifyIntent(modifications: any, currentPlan?: ChatPlan): ChatPlan | null {
  if (!currentPlan) {
    return null;
  }
  
  return planMemory.modifyCurrentPlan(modifications);
}

export function processCompareIntent(protocols: string[], asset: string, chain: string): any {
  return generateComparison(protocols, asset, chain);
}

export function processExplainIntent(currentPlan?: ChatPlan): ExplanationPoint[] {
  return generateExplanation(currentPlan);
}

export function processListIntent(criteria: any): any {
  // Mock list data - in real implementation, this would fetch from data providers
  const mockAllocations = [
    { asset: 'USDC', protocol: 'Orca', chain: 'solana', estApy: 12.5, tvl: 45200000, riskLabel: 'Medium', amountPct: 40 },
    { asset: 'USDC', protocol: 'Raydium', chain: 'solana', estApy: 11.8, tvl: 67800000, riskLabel: 'Medium', amountPct: 35 },
    { asset: 'USDC', protocol: 'Jupiter', chain: 'solana', estApy: 13.2, tvl: 23100000, riskLabel: 'High', amountPct: 25 }
  ];
  
  // Filter based on criteria
  let filtered = mockAllocations;
  
  if (criteria.assets) {
    filtered = filtered.filter(alloc => criteria.assets.includes(alloc.asset));
  }
  
  if (criteria.chains) {
    filtered = filtered.filter(alloc => criteria.chains.includes(alloc.chain));
  }
  
  if (criteria.sortBy === 'tvl') {
    filtered.sort((a, b) => b.tvl - a.tvl);
  } else if (criteria.sortBy === 'apy') {
    filtered.sort((a, b) => b.estApy - a.estApy);
  }
  
  return filtered;
}




