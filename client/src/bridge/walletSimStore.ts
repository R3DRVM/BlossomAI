import { getActiveUserId } from '../ai/userUtils';

export interface TokenBalance {
  asset: string;
  amount: number;
  lastUpdated: number;
}

export interface DemoWallet {
  userId: string;
  balances: TokenBalance[];
  createdAt: number;
  lastActivity: number;
}

export interface CreditDebitResult {
  ok: boolean;
  newBalance: number;
  reason?: string;
}

class WalletSimStore {
  private storageKey = (userId: string) => `blossom.wallet.${userId}`;
  private seededKey = (userId: string) => `blossom.wallet.seeded.${userId}`;

  private getStorageKey(): string {
    const userId = getActiveUserId();
    return this.storageKey(userId);
  }

  private getSeededKey(): string {
    const userId = getActiveUserId();
    return this.seededKey(userId);
  }

  private getWalletFromStorage(): DemoWallet | null {
    try {
      const key = this.getStorageKey();
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load demo wallet from storage:', error);
      return null;
    }
  }

  private saveWalletToStorage(wallet: DemoWallet): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(wallet));
    } catch (error) {
      console.warn('Failed to save demo wallet to storage:', error);
    }
  }

  private getSeedBalances(): TokenBalance[] {
    const usdc = Number(import.meta.env.VITE_DEMO_SEED_USDC) || 10000000;
    const sol = Number(import.meta.env.VITE_DEMO_SEED_SOL) || 2000;

    return [
      { asset: 'USDC', amount: usdc, lastUpdated: Date.now() },
      { asset: 'SOL', amount: sol, lastUpdated: Date.now() }
    ];
  }

  private ensureWalletExists(): DemoWallet {
    let wallet = this.getWalletFromStorage();
    
    // Always seed demo funds if no wallet exists (both dev and prod)
    if (!wallet) {
      const userId = getActiveUserId();
      const seededKey = this.getSeededKey();
      
      // Check if we've already seeded this user
      const alreadySeeded = localStorage.getItem(seededKey);
      if (!alreadySeeded) {
        wallet = {
          userId,
          balances: this.getSeedBalances(),
          createdAt: Date.now(),
          lastActivity: Date.now()
        };
        this.saveWalletToStorage(wallet);
        localStorage.setItem(seededKey, 'true');
        
        if (import.meta.env.VITE_DEBUG_CHAT === '1') {
          console.log('wallet:seeded', { userId, balances: wallet.balances });
        }
      }
    }
    
    return wallet || {
      userId: getActiveUserId(),
      balances: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
  }

  getWallet(userId?: string): DemoWallet {
    if (userId && userId !== getActiveUserId()) {
      // Get wallet for specific user
      const key = this.storageKey(userId);
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : { userId, balances: [], createdAt: Date.now(), lastActivity: Date.now() };
      } catch {
        return { userId, balances: [], createdAt: Date.now(), lastActivity: Date.now() };
      }
    }
    return this.ensureWalletExists();
  }

  getBalances(userId?: string): TokenBalance[] {
    const wallet = this.getWallet(userId);
    return wallet.balances;
  }

  getBalance(asset: string, userId?: string): number {
    const balances = this.getBalances(userId);
    const balance = balances.find(b => b.asset === asset);
    return balance ? balance.amount : 0;
  }

  canAfford(asset: string, amount: number, userId?: string): boolean {
    return this.getBalance(asset, userId) >= amount;
  }

  credit(symbol: string, amount: number, userId?: string): CreditDebitResult {
    if (amount <= 0) {
      return { ok: false, newBalance: 0, reason: 'Amount must be positive' };
    }

    const wallet = this.getWallet(userId);
    const balanceIndex = wallet.balances.findIndex(b => b.asset === symbol);
    
    if (balanceIndex >= 0) {
      wallet.balances[balanceIndex].amount += amount;
      wallet.balances[balanceIndex].lastUpdated = Date.now();
    } else {
      wallet.balances.push({
        asset: symbol,
        amount,
        lastUpdated: Date.now()
      });
    }
    
    wallet.lastActivity = Date.now();
    this.saveWalletToStorage(wallet);
    this.notifyWalletChange();
    
    const newBalance = wallet.balances.find(b => b.asset === symbol)?.amount || 0;
    
    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('wallet:credit', { symbol, amount, newBalance });
    }
    
    return { ok: true, newBalance };
  }

  debit(symbol: string, amount: number, userId?: string): CreditDebitResult {
    if (amount <= 0) {
      return { ok: false, newBalance: 0, reason: 'Amount must be positive' };
    }

    const wallet = this.getWallet(userId);
    const balanceIndex = wallet.balances.findIndex(b => b.asset === symbol);
    
    if (balanceIndex < 0) {
      return { ok: false, newBalance: 0, reason: `No ${symbol} balance found` };
    }
    
    const currentBalance = wallet.balances[balanceIndex].amount;
    if (currentBalance < amount) {
      return { 
        ok: false, 
        newBalance: currentBalance, 
        reason: `Insufficient ${symbol} balance. Required: ${amount}, Available: ${currentBalance}` 
      };
    }
    
    wallet.balances[balanceIndex].amount -= amount;
    wallet.balances[balanceIndex].lastUpdated = Date.now();
    wallet.lastActivity = Date.now();
    this.saveWalletToStorage(wallet);
    this.notifyWalletChange();
    
    const newBalance = wallet.balances[balanceIndex].amount;
    
    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('wallet:debit', { symbol, amount, ok: true, newBalance });
    }
    
    return { ok: true, newBalance };
  }

  debitMultiple(debits: Array<{ asset: string; amount: number }>): CreditDebitResult {
    // Check if all debits can be made
    for (const debit of debits) {
      if (!this.canAfford(debit.asset, debit.amount)) {
        return {
          ok: false,
          newBalance: 0,
          reason: `Insufficient ${debit.asset} balance for ${debit.amount}`
        };
      }
    }

    // Execute all debits
    const results: CreditDebitResult[] = [];
    for (const debit of debits) {
      const result = this.debit(debit.asset, debit.amount);
      results.push(result);
      if (!result.ok) {
        // Rollback previous debits
        for (let i = 0; i < results.length - 1; i++) {
          if (results[i].ok) {
            this.credit(debits[i].asset, debits[i].amount);
          }
        }
        return result;
      }
    }

    return { ok: true, newBalance: 0 };
  }

  getTotalUSD(userId?: string): number {
    const balances = this.getBalances(userId);
    return balances.reduce((total, balance) => {
      // Use existing price feed if available, otherwise fallback
      const mockPrices: Record<string, number> = {
        'USDC': 1,
        'SOL': 95.50  // Updated to match priceFeed
      };
      return total + (balance.amount * (mockPrices[balance.asset] || 0));
    }, 0);
  }

  resetWallet(userId?: string): void {
    const targetUserId = userId || getActiveUserId();
    const wallet: DemoWallet = {
      userId: targetUserId,
      balances: this.getSeedBalances(),
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    const key = this.storageKey(targetUserId);
    localStorage.setItem(key, JSON.stringify(wallet));
    this.notifyWalletChange();
    
    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('wallet:reset', { userId: targetUserId });
    }
  }

  private notifyWalletChange(): void {
    // Fire custom event for cross-tab sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blossom:wallet:changed', {
        detail: { userId: getActiveUserId() }
      }));
    }
  }

  getWalletInfo(userId?: string): { totalValue: number; balanceCount: number; lastActivity: number } {
    const wallet = this.getWallet(userId);
    return {
      totalValue: this.getTotalUSD(userId),
      balanceCount: wallet.balances.length,
      lastActivity: wallet.lastActivity
    };
  }

  // Idempotent seeding function - always seeds demo funds
  ensureSeed(userId: string, force = false): DemoWallet {
    const key = this.storageKey(userId);
    
    try {
      const existingData = localStorage.getItem(key);
      let wallet: DemoWallet | null = null;
      
      if (existingData) {
        wallet = JSON.parse(existingData);
      }
      
      // Check if we need to seed: missing, invalid, sumUSD === 0, or force === true
      const needsSeeding = !wallet || 
                          !wallet.balances || 
                          wallet.balances.length === 0 || 
                          this.getTotalUSD(userId) === 0 || 
                          force;
      
      if (needsSeeding) {
        const seedBalances = this.getSeedBalances();
        wallet = {
          userId,
          balances: seedBalances,
          createdAt: Date.now(),
          lastActivity: Date.now()
        };
        
        localStorage.setItem(key, JSON.stringify(wallet));
        
        // Dispatch change event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('blossom:wallet:changed', {
            detail: { userId, reason: 'seeded' }
          }));
        }
        
        if (import.meta.env.VITE_DEBUG_CHAT === '1') {
          console.info('[wallet] ensureSeed', { userId, forced: force, seeded: true });
        }
      }
      
      return wallet!;
    } catch (error) {
      console.warn('Failed to ensure seed for user:', userId, error);
      // Return empty wallet as fallback
      return {
        userId,
        balances: [],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
    }
  }

  getCashBalances(userId?: string): Record<string, number> {
    const balances = this.getBalances(userId);
    const cashBalances: Record<string, number> = {};
    
    balances.forEach(balance => {
      cashBalances[balance.asset] = balance.amount;
    });
    
    return cashBalances;
  }
}

export const demoWallet = new WalletSimStore();
export const walletSim = demoWallet; // Alias for compatibility

// Export convenience functions
export function ensureSeed(userId: string, force = false): DemoWallet {
  return demoWallet.ensureSeed(userId, force);
}

export function getTotalUSD(userId?: string): number {
  return demoWallet.getTotalUSD(userId);
}

export function getCashBalances(userId?: string): Record<string, number> {
  return demoWallet.getCashBalances(userId);
}

// Export DemoBalance type alias for compatibility
export type DemoBalance = TokenBalance;

