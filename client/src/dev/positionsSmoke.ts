import { getPositions, addPositions } from '@/bridge/positionsStore';
import { getActiveUserId } from '@/ai/userUtils';

export function positionsSmoke() {
  if (!import.meta.env.DEV) return;
  
  const userId = getActiveUserId() || 'guest';
  const before = getPositions(userId);
  console.log('[smoke] positions before:', before.length);
  
  if (before.length === 0) {
    addPositions(userId, [{
      id: 'smoke-' + Date.now(),
      userId, 
      asset: 'USDC', 
      chain: 'solana', 
      protocol: 'Raydium',
      amountUSD: 12345, 
      apy: 0.1, 
      createdAt: new Date().toISOString(),
      units: 12345,
      entryPrice: 1,
      entryTime: new Date().toISOString(),
      status: 'OPEN' as const
    }]);
    
    const after = getPositions(userId);
    console.log('[smoke] positions after:', after.length);
  }
}


