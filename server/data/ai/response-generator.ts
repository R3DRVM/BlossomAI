import { ParsedIntent } from "./intent-parser.ts";
import { dataFacade } from "../facade.ts";
import { YieldOpportunity } from "../types.ts";

export interface ChatResponse {
  planSummary: string;
  allocations: Array<{
    asset: string;
    chain: string;
    protocol: string;
    amountPct?: number;
    amount?: number;
    estApy: number;
    tvl: number;
    riskLabel: string;
  }>;
  portfolioStats: {
    totalValue: number;
    avgApy: number;
    riskScore: number;
    diversification: number;
  };
  triggers: Array<{
    type: 'apy_drop' | 'rebalance' | 'risk_alert';
    condition: string;
    threshold: number;
  }>;
  strategy: {
    id: string;
    name: string;
    description: string;
    steps: Array<{
      step: number;
      action: string;
      details: string;
    }>;
  };
}

export async function generateResponse(intent: ParsedIntent, userMessage: string): Promise<ChatResponse> {
  const { action, assets, chain, amount, percentage, apy, riskLevel } = intent;
  
  // Default values
  const defaultAssets = assets || ['USDC', 'SOL'];
  const defaultChain = chain || 'solana';
  const defaultAmount = amount || 10000;
  const defaultPercentage = percentage || 100;
  
  // Fetch relevant data
  const yieldData = await dataFacade.getYields({
    chain: defaultChain,
    assets: defaultAssets,
    limit: 10,
    sort: 'apy'
  });
  
  const tvlData = await dataFacade.getTVL({ chain: defaultChain });
  
  // Generate allocations based on action
  let allocations: ChatResponse['allocations'] = [];
  let planSummary = '';
  
  switch (action) {
    case 'allocate':
      allocations = yieldData.data.slice(0, 3).map((yieldItem: YieldOpportunity, index) => ({
        asset: yieldItem.assets[0] || 'USDC',
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        amountPct: index === 0 ? 50 : index === 1 ? 30 : 20,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore),
      }));
      
      planSummary = `Deploying ${defaultAmount} ${defaultAssets.join(', ')} across top ${defaultChain} yield sources with ${allocations[0].estApy.toFixed(2)}% APY focus.`;
      break;
      
    case 'rebalance':
      allocations = yieldData.data.slice(0, 3).map((yieldItem: YieldOpportunity, index) => ({
        asset: yieldItem.assets[0] || 'USDC',
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        amountPct: 33.33,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore),
      }));
      
      planSummary = `Rebalancing portfolio across ${defaultChain} protocols for optimal yield distribution.`;
      break;
      
    case 'list':
    case 'discover':
      allocations = yieldData.data.slice(0, 5).map((yieldItem: YieldOpportunity) => ({
        asset: yieldItem.assets[0] || 'USDC',
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore),
      }));
      
      planSummary = `Found ${allocations.length} high-yield opportunities on ${defaultChain} with APY ranging ${allocations[0].estApy.toFixed(2)}% to ${allocations[allocations.length - 1].estApy.toFixed(2)}%.`;
      break;
      
    default:
      allocations = yieldData.data.slice(0, 3).map((yieldItem: YieldOpportunity) => ({
        asset: yieldItem.assets[0] || 'USDC',
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore),
      }));
      
      planSummary = `Analyzing ${defaultChain} yield opportunities for your ${defaultAssets.join(', ')} holdings.`;
  }
  
  // Calculate portfolio stats
  const totalValue = defaultAmount;
  const avgApy = allocations.reduce((sum, alloc) => sum + alloc.estApy, 0) / allocations.length;
  const avgRisk = allocations.reduce((sum, alloc) => sum + getRiskScore(alloc.riskLabel), 0) / allocations.length;
  const diversification = Math.min(allocations.length / 3, 1); // 0-1 scale
  
  // Generate triggers
  const triggers: ChatResponse['triggers'] = [];
  if (apy) {
    triggers.push({
      type: 'apy_drop',
      condition: `APY drops below ${apy}%`,
      threshold: apy,
    });
  }
  
  if (action === 'rebalance') {
    triggers.push({
      type: 'rebalance',
      condition: 'Weekly portfolio rebalance',
      threshold: 7,
    });
  }
  
  // Generate strategy
  const strategy = {
    id: `strategy-${Date.now()}`,
    name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${defaultChain} Strategy`,
    description: `Automated ${action} strategy for ${defaultAssets.join(', ')} on ${defaultChain}`,
    steps: [
      {
        step: 1,
        action: 'Analyze',
        details: `Scan ${defaultChain} protocols for optimal yield opportunities`,
      },
      {
        step: 2,
        action: 'Allocate',
        details: `Distribute funds across selected protocols based on risk-adjusted returns`,
      },
      {
        step: 3,
        action: 'Monitor',
        details: 'Track performance and trigger rebalancing when thresholds are met',
      },
    ],
  };
  
  return {
    planSummary,
    allocations,
    portfolioStats: {
      totalValue,
      avgApy,
      riskScore: avgRisk,
      diversification,
    },
    triggers,
    strategy,
  };
}

function getRiskLabel(score: number): string {
  if (score <= 3) return 'Low';
  if (score <= 6) return 'Medium';
  return 'High';
}

function getRiskScore(label: string): number {
  switch (label.toLowerCase()) {
    case 'low': return 3;
    case 'medium': return 6;
    case 'high': return 9;
    default: return 5;
  }
}
