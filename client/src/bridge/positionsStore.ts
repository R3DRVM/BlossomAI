// --- positionsStore.ts (canonical minimal API) ---
import { getActiveUserId } from '../ai/userUtils';

export type PositionSnapshot = {
  id: string;
  protocol: string;   // e.g., "Raydium"
  chain: string;      // e.g., "solana"
  asset: string;      // e.g., "USDC"
  amountUSD: number;
  baseAPY?: number;
  netAPY?: number;
  entryTime?: string; // ISO
  risk?: string;      // e.g., "low", "medium", "high"
  enteredAt?: string; // ISO - for compatibility
};

const EVT = 'blossom:positions:changed';
const K = (userId: string) => `blossom.positions.${userId}`;

function safeParse<T>(v: string | null, d: T): T {
  try { return v ? JSON.parse(v) as T : d; } catch { return d; }
}

function newId(): string {
  const rnd = (globalThis as any)?.crypto?.randomUUID?.();
  return rnd ?? ('p_' + Math.random().toString(36).slice(2) + Date.now().toString(36));
}

export function getPositions(userId: string): PositionSnapshot[] {
  return safeParse(localStorage.getItem(K(userId)), []);
}

export function setPositions(userId: string, items: PositionSnapshot[]) {
  localStorage.setItem(K(userId), JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVT, { detail: { userId } }));
}

export function clearPositions(userId: string) {
  setPositions(userId, []);
}

export function addPositions(userId: string, items: Omit<PositionSnapshot,'id'>[]) {
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:adding]', { userId, count: items.length, items });
  }
  
  const current = getPositions(userId);
  const withIds = items.map(p => ({ id: newId(), ...p }));
  setPositions(userId, current.concat(withIds));
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:added]', { userId, totalCount: current.length + withIds.length });
  }
}

export function upsertPosition(userId: string, p: PositionSnapshot) {
  const list = getPositions(userId);
  const i = list.findIndex(x => x.id === p.id);
  const next = [...list];
  if (i >= 0) next[i] = p;
  else next.push({ ...p, id: p.id ?? newId() });
  setPositions(userId, next);
}

export function onPositionsChanged(handler: (e: CustomEvent) => void) {
  const fn = handler as unknown as EventListener;
  window.addEventListener(EVT, fn);
  return () => window.removeEventListener(EVT, fn);
}

// Debug function to check positions
export function debugPositions(userId: string) {
  const positions = getPositions(userId);
  console.log('[DEBUG] Positions for user', userId, ':', positions);
  console.log('[DEBUG] LocalStorage key:', K(userId));
  console.log('[DEBUG] Raw localStorage:', localStorage.getItem(K(userId)));
  return positions;
}

// Export store instance and PositionWithPnL type for compatibility
export const positionsStore = {
  getPositions,
  setPositions,
  addPositions,
  clearPositions,
  onPositionsChanged,
  debugPositions,
  async getPositionsWithPnL() {
    // Mock implementation - in real app this would calculate PnL
    const userId = getActiveUserId() || 'guest';
    const positions = getPositions(userId);
    return positions.map(p => ({
      ...p,
      pnl: 0,
      pnlPercent: 0,
      units: 1,
      entryPrice: p.amountUSD,
      markPrice: p.amountUSD,
      priceSource: 'mock' as const,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0,
      priceUpdated: new Date().toISOString(),
      status: 'OPEN' as const
    }));
  },
  async closePosition(positionId: string) {
    // Mock implementation
    console.log('Closing position:', positionId);
    return true;
  },
  exportToCSV() {
    // Mock implementation
    return 'Protocol,Chain,Asset,Amount,APY\nMock,Test,USDC,1000,5.0';
  }
};

export type PositionWithPnL = PositionSnapshot & {
  pnl?: number;
  pnlPercent?: number;
  units?: number;
  entryPrice?: number;
  markPrice?: number;
  priceSource?: 'live' | 'mock';
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
  priceUpdated?: string;
  status?: 'OPEN' | 'CLOSED';
};

// --- end canonical API ---