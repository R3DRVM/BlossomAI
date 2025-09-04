// Test script to verify chat bot deployment
console.log('Testing chat bot deployment...');

// Simulate the deployment flow
const testPlan = {
  id: 'test-plan-123',
  userId: 'guest',
  capitalUSD: 250000,
  asset: 'USDC',
  chain: 'solana',
  risk: 'medium',
  autoRebalance: false,
  allocations: [
    { 
      protocol: 'Raydium', 
      chain: 'solana',
      asset: 'USDC',
      apy: 0.12,
      tvl: 1000000,
      risk: 'medium',
      amountUSD: 100000
    },
    { 
      protocol: 'Orca', 
      chain: 'solana',
      asset: 'USDC',
      apy: 0.10,
      tvl: 800000,
      risk: 'medium',
      amountUSD: 75000
    },
    { 
      protocol: 'Jupiter', 
      chain: 'solana',
      asset: 'USDC',
      apy: 0.08,
      tvl: 600000,
      risk: 'medium',
      amountUSD: 75000
    },
  ],
  createdAt: new Date().toISOString(),
  status: 'pending'
};

console.log('Test plan created:', testPlan);

// Test if we can access the required functions
if (typeof window !== 'undefined') {
  console.log('Window available, testing deployment...');
  
  // Check if the functions are available
  if (window.__paper) {
    console.log('Paper custody available');
    const wallet = window.__paper('guest');
    console.log('Current wallet:', wallet);
  } else {
    console.log('Paper custody not available');
  }
} else {
  console.log('Window not available (Node.js environment)');
}
