export interface ParsedIntent {
  action: 'allocate' | 'rebalance' | 'notify' | 'list' | 'discover';
  assets?: string[];
  chain?: string;
  amount?: number;
  percentage?: number;
  apy?: number;
  protocols?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export function parseIntent(message: string): ParsedIntent {
  const lowerMessage = message.toLowerCase();
  
  // Extract assets mentioned
  const assetPatterns = [
    /\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/gi,
    /\b(\d+)\s*(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/gi
  ];
  
  const assets: string[] = [];
  assetPatterns.forEach(pattern => {
    const matches = lowerMessage.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const asset = match.replace(/\d+\s*/, '').toUpperCase();
        if (!assets.includes(asset)) {
          assets.push(asset);
        }
      });
    }
  });
  
  // Extract chain
  let chain: string | undefined;
  if (lowerMessage.includes('solana') || lowerMessage.includes('sol')) {
    chain = 'solana';
  } else if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
    chain = 'ethereum';
  } else if (lowerMessage.includes('polygon') || lowerMessage.includes('matic')) {
    chain = 'polygon';
  }
  
  // Extract amount/percentage
  let amount: number | undefined;
  let percentage: number | undefined;
  
  const amountMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(usdc|usdt|dai|eth|weth|sol|btc|wbtc)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }
  
  const percentMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    percentage = parseFloat(percentMatch[1]);
  }
  
  // Extract APY threshold
  let apy: number | undefined;
  const apyMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:apy|apr)/);
  if (apyMatch) {
    apy = parseFloat(apyMatch[1]);
  }
  
  // Determine action
  let action: ParsedIntent['action'] = 'discover';
  
  if (lowerMessage.includes('deploy') || lowerMessage.includes('allocate') || lowerMessage.includes('invest')) {
    action = 'allocate';
  } else if (lowerMessage.includes('rebalance') || lowerMessage.includes('re-balance')) {
    action = 'rebalance';
  } else if (lowerMessage.includes('notify') || lowerMessage.includes('alert') || lowerMessage.includes('drop')) {
    action = 'notify';
  } else if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('find')) {
    action = 'list';
  }
  
  // Extract risk level
  let riskLevel: 'low' | 'medium' | 'high' | undefined;
  if (lowerMessage.includes('low risk') || lowerMessage.includes('safe')) {
    riskLevel = 'low';
  } else if (lowerMessage.includes('high risk') || lowerMessage.includes('risky')) {
    riskLevel = 'high';
  } else if (lowerMessage.includes('medium risk')) {
    riskLevel = 'medium';
  }
  
  return {
    action,
    assets: assets.length > 0 ? assets : undefined,
    chain,
    amount,
    percentage,
    apy,
    riskLevel,
  };
}

