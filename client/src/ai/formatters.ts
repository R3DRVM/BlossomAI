export type ChatPayload = {
  planSummary?: string;
  allocations?: Array<{ 
    asset: string; 
    chain: string; 
    protocol: string; 
    estApy: number; 
    tvl: number; 
    riskLabel: string; 
    amountPct?: number; 
    amount?: number 
  }>;
  portfolioStats?: any;
  triggers?: any[];
  strategy?: any;
};

export function payloadToText(p: ChatPayload): string {
  const lines: string[] = [];
  
  if (p.planSummary) {
    lines.push(p.planSummary);
  }
  
  if (p.allocations?.length) {
    lines.push('');
    lines.push('Allocations (top):');
    for (const a of p.allocations.slice(0, 5)) {
      lines.push(`• ${a.asset} → ${a.protocol} (${a.chain}) – ${a.estApy.toFixed(2)}% APY, TVL ~${
        Math.round(a.tvl).toLocaleString()
      }, Risk: ${a.riskLabel}`);
    }
  }
  
  if (p.portfolioStats) {
    lines.push('');
    lines.push('Portfolio Summary:');
    if (p.portfolioStats.totalValue) {
      lines.push(`• Total Value: $${p.portfolioStats.totalValue.toLocaleString()}`);
    }
    if (p.portfolioStats.avgApy) {
      lines.push(`• Average APY: ${p.portfolioStats.avgApy}`);
    }
    if (p.portfolioStats.riskScore) {
      lines.push(`• Risk Score: ${p.portfolioStats.riskScore}/10`);
    }
    if (p.portfolioStats.diversification) {
      lines.push(`• Diversification: ${p.portfolioStats.diversification}`);
    }
  }
  
  return lines.join('\n');
}
