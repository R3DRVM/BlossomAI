export interface EnhancedIntent {
  type: 'greeting' | 'deploy' | 'modify' | 'explain' | 'compare' | 'list' | 'save' | 'alert' | 'smalltalk';
  confidence: number;
  slots: {
    capitalUSD?: number;
    assets?: string[];
    chains?: string[];
    risk?: 'low' | 'medium' | 'high';
    targetAPY?: number;
    cadence?: 'daily' | 'weekly' | 'monthly';
    whitelist?: string[];
    exclude?: string[];
    capPerProtocol?: number;
    strategyName?: string;
    comparisonTargets?: string[];
  };
}

export function parseEnhancedIntent(message: string): EnhancedIntent {
  const lowerMessage = message.toLowerCase();
  
  // Priority-based intent detection (mutually exclusive)
  
  // 1. Alert (highest priority)
  if (isAlertIntent(lowerMessage)) {
    return {
      type: 'alert',
      confidence: 0.9,
      slots: extractAlertSlots(lowerMessage)
    };
  }
  
  // 2. Save/Apply
  if (isSaveIntent(lowerMessage)) {
    return {
      type: 'save',
      confidence: 0.9,
      slots: extractSaveSlots(lowerMessage)
    };
  }
  
  // 3. Explain/Why
  if (isExplainIntent(lowerMessage)) {
    return {
      type: 'explain',
      confidence: 0.8,
      slots: {}
    };
  }
  
  // 4. Compare
  if (isCompareIntent(lowerMessage)) {
    return {
      type: 'compare',
      confidence: 0.8,
      slots: extractCompareSlots(lowerMessage)
    };
  }
  
  // 5. Modify Plan
  if (isModifyIntent(lowerMessage)) {
    return {
      type: 'modify',
      confidence: 0.7,
      slots: extractModifySlots(lowerMessage)
    };
  }
  
  // 6. Deploy/Allocate
  if (isDeployIntent(lowerMessage)) {
    return {
      type: 'deploy',
      confidence: 0.8,
      slots: extractDeploySlots(lowerMessage)
    };
  }
  
  // 7. List/Find
  if (isListIntent(lowerMessage)) {
    return {
      type: 'list',
      confidence: 0.7,
      slots: extractListSlots(lowerMessage)
    };
  }
  
  // 8. Greeting/Smalltalk
  if (isGreetingIntent(lowerMessage)) {
    return {
      type: 'greeting',
      confidence: 0.9,
      slots: {}
    };
  }
  
  // Default to smalltalk
  return {
    type: 'smalltalk',
    confidence: 0.5,
    slots: {}
  };
}

function isAlertIntent(message: string): boolean {
  const alertKeywords = ['notify', 'alert', 'set up alert', 'monitor', 'watch', 'spike', 'drop', 'below', 'above'];
  return alertKeywords.some(keyword => message.includes(keyword));
}

function isSaveIntent(message: string): boolean {
  const saveKeywords = ['save', 'save as', 'store', 'bookmark', 'apply to portfolio', 'deploy this'];
  return saveKeywords.some(keyword => message.includes(keyword));
}

function isExplainIntent(message: string): boolean {
  const explainKeywords = ['why', 'explain', 'reasoning', 'justify', 'rationale', 'why these', 'why did you'];
  return explainKeywords.some(keyword => message.includes(keyword));
}

function isCompareIntent(message: string): boolean {
  const compareKeywords = ['compare', 'vs', 'versus', 'better', 'difference between', 'which is better'];
  return compareKeywords.some(keyword => message.includes(keyword));
}

function isModifyIntent(message: string): boolean {
  const modifyKeywords = ['make it', 'change', 'modify', 'adjust', 'update', 'tweak', 'only', 'whitelist', 'exclude', 'cap', 'limit'];
  return modifyKeywords.some(keyword => message.includes(keyword));
}

function isDeployIntent(message: string): boolean {
  const deployKeywords = ['deploy', 'allocate', 'invest', 'put', 'deposit', 'stake', 'yield farming'];
  return deployKeywords.some(keyword => message.includes(keyword));
}

function isListIntent(message: string): boolean {
  const listKeywords = ['list', 'show', 'find', 'search', 'top', 'best', 'highest', 'largest', 'by tvl'];
  return listKeywords.some(keyword => message.includes(keyword));
}

function isGreetingIntent(message: string): boolean {
  const greetingKeywords = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'];
  return greetingKeywords.some(keyword => message.includes(keyword));
}

function extractAlertSlots(message: string): any {
  const slots: any = {};
  
  // Extract assets
  const assetMatch = message.match(/\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/);
  if (assetMatch) {
    slots.assets = [assetMatch[1].toUpperCase()];
  }
  
  // Extract chains
  if (message.includes('solana') || message.includes('sol')) {
    slots.chains = ['solana'];
  } else if (message.includes('ethereum') || message.includes('eth')) {
    slots.chains = ['ethereum'];
  } else if (message.includes('polygon') || message.includes('matic')) {
    slots.chains = ['polygon'];
  }
  
  // Extract APY threshold
  const apyMatch = message.match(/(\d+(?:\.\d+)?)\s*%/);
  if (apyMatch) {
    slots.targetAPY = parseFloat(apyMatch[1]);
  }
  
  return slots;
}

function extractSaveSlots(message: string): any {
  const slots: any = {};
  
  // Extract strategy name
  const nameMatch = message.match(/save.*?as\s+["']?([^"'\n]+)["']?/i);
  if (nameMatch) {
    slots.strategyName = nameMatch[1].trim();
  }
  
  return slots;
}

function extractCompareSlots(message: string): any {
  const slots: any = {};
  
  // Extract comparison targets (protocols)
  const protocolKeywords = ['orca', 'raydium', 'jupiter', 'lido', 'marinade', 'solend', 'mango', 'compound', 'aave', 'uniswap'];
  const foundProtocols = protocolKeywords.filter(protocol => message.includes(protocol));
  if (foundProtocols.length >= 2) {
    slots.comparisonTargets = foundProtocols;
  }
  
  // Extract assets and chains
  const assetMatch = message.match(/\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/);
  if (assetMatch) {
    slots.assets = [assetMatch[1].toUpperCase()];
  }
  
  if (message.includes('solana') || message.includes('sol')) {
    slots.chains = ['solana'];
  }
  
  return slots;
}

function extractModifySlots(message: string): any {
  const slots: any = {};
  
  // Extract cadence
  if (message.includes('daily')) {
    slots.cadence = 'daily';
  } else if (message.includes('weekly')) {
    slots.cadence = 'weekly';
  } else if (message.includes('monthly')) {
    slots.cadence = 'monthly';
  }
  
  // Extract whitelist
  const protocolKeywords = ['orca', 'raydium', 'jupiter', 'lido', 'marinade', 'solend', 'mango'];
  const whitelist = protocolKeywords.filter(protocol => message.includes(protocol));
  if (whitelist.length > 0) {
    slots.whitelist = whitelist;
  }
  
  // Extract cap per protocol
  const capMatch = message.match(/cap.*?(\d+)\s*%/i);
  if (capMatch) {
    slots.capPerProtocol = parseInt(capMatch[1]);
  }
  
  // Extract risk
  if (message.includes('low risk')) {
    slots.risk = 'low';
  } else if (message.includes('high risk')) {
    slots.risk = 'high';
  } else if (message.includes('medium risk')) {
    slots.risk = 'medium';
  }
  
  return slots;
}

function extractDeploySlots(message: string): any {
  const slots: any = {};
  
  // Extract capital amount
  const amountPatterns = [
    /(\d+(?:\.\d+)?)\s*(m|million)/i,
    /(\d+(?:\.\d+)?)\s*(k|thousand)/i,
    /(\d+(?:\.\d+)?)\s*(usdc|usdt|dai|eth|sol)/i
  ];
  
  for (const pattern of amountPatterns) {
    const match = message.match(pattern);
    if (match) {
      let amount = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'm' || unit === 'million') {
        amount *= 1000000;
      } else if (unit === 'k' || unit === 'thousand') {
        amount *= 1000;
      }
      slots.capitalUSD = amount;
      break;
    }
  }
  
  // Extract assets
  const assetMatch = message.match(/\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/);
  if (assetMatch) {
    slots.assets = [assetMatch[1].toUpperCase()];
  }
  
  // Extract chains
  if (message.includes('solana') || message.includes('sol')) {
    slots.chains = ['solana'];
  } else if (message.includes('ethereum') || message.includes('eth')) {
    slots.chains = ['ethereum'];
  } else if (message.includes('polygon') || message.includes('matic')) {
    slots.chains = ['polygon'];
  }
  
  // Extract target APY
  const apyMatch = message.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:apy|apr)/);
  if (apyMatch) {
    slots.targetAPY = parseFloat(apyMatch[1]);
  }
  
  // Extract risk
  if (message.includes('low risk')) {
    slots.risk = 'low';
  } else if (message.includes('high risk')) {
    slots.risk = 'high';
  } else if (message.includes('medium risk')) {
    slots.risk = 'medium';
  }
  
  // Extract cadence
  if (message.includes('daily')) {
    slots.cadence = 'daily';
  } else if (message.includes('weekly')) {
    slots.cadence = 'weekly';
  } else if (message.includes('monthly')) {
    slots.cadence = 'monthly';
  }
  
  return slots;
}

function extractListSlots(message: string): any {
  const slots: any = {};
  
  // Extract assets
  const assetMatch = message.match(/\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/);
  if (assetMatch) {
    slots.assets = [assetMatch[1].toUpperCase()];
  }
  
  // Extract chains
  if (message.includes('solana') || message.includes('sol')) {
    slots.chains = ['solana'];
  } else if (message.includes('ethereum') || message.includes('eth')) {
    slots.chains = ['ethereum'];
  } else if (message.includes('polygon') || message.includes('matic')) {
    slots.chains = ['polygon'];
  }
  
  // Extract sorting criteria
  if (message.includes('by tvl') || message.includes('largest')) {
    slots.sortBy = 'tvl';
  } else if (message.includes('highest') || message.includes('best apy')) {
    slots.sortBy = 'apy';
  }
  
  return slots;
}




