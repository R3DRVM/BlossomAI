/**
 * Paper Custody - Simulated wallet balances for production-ready feel
 * Internal naming only; no UI exposure of "demo" or "paper" concepts
 */

export interface PaperWallet {
  USDC: number;
  SOL: number;
  updatedAt: string;
}

export interface DebitResult {
  ok: boolean;
  reason?: string;
}

class PaperCustodyStore {
  private storageKey = (userId: string) => `blossom.paper.wallet.${userId}`;
  private seededKey = (userId: string) => `blossom.paper.wallet.${userId}.seeded`;

  private getStorageKey(userId: string): string {
    return this.storageKey(userId);
  }

  private getSeededKey(userId: string): string {
    return this.seededKey(userId);
  }

  private getWalletFromStorage(userId: string): PaperWallet | null {
    try {
      const key = this.getStorageKey(userId);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Failed to load paper wallet from storage:', error);
      return null;
    }
  }

  private saveWalletToStorage(userId: string, wallet: PaperWallet): void {
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(wallet));
    } catch (error) {
      console.warn('Failed to save paper wallet to storage:', error);
    }
  }

  private getSeedAmounts(): { USDC: number; SOL: number } {
    const usdc = Number(import.meta.env.VITE_SEED_USDC ?? 10000000);
    const sol = Number(import.meta.env.VITE_SEED_SOL ?? 2000);
    return { USDC: usdc, SOL: sol };
  }

  private migrateLegacyWallet(userId: string): void {
    try {
      const legacyKey = `blossom.wallet.${userId}`;
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        const legacyWallet = JSON.parse(legacyData);
        if (legacyWallet.balances && Array.isArray(legacyWallet.balances)) {
          const usdcBalance = legacyWallet.balances.find((b: any) => b.asset === 'USDC')?.amount || 0;
          const solBalance = legacyWallet.balances.find((b: any) => b.asset === 'SOL')?.amount || 0;
          
          const paperWallet: PaperWallet = {
            USDC: usdcBalance,
            SOL: solBalance,
            updatedAt: new Date().toISOString()
          };
          
          this.saveWalletToStorage(userId, paperWallet);
          localStorage.setItem(this.getSeededKey(userId), 'true');
          
          // Clean up legacy data
          localStorage.removeItem(legacyKey);
          localStorage.removeItem(`blossom.wallet.seeded.${userId}`);
          
          if (import.meta.env.VITE_DEBUG_CHAT === '1') {
            console.log('[paper:migrate]', userId, paperWallet);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to migrate legacy wallet:', error);
    }
  }

  private notifyWalletChange(userId: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('blossom:wallet:changed', {
        detail: { userId }
      }));
    }
  }

  async ensureSeed(userId: string): Promise<void> {
    // Check if already seeded
    const seededKey = this.getSeededKey(userId);
    const alreadySeeded = localStorage.getItem(seededKey);
    
    if (alreadySeeded) {
      return; // Already seeded, no action needed
    }

    // Try to migrate legacy wallet first
    this.migrateLegacyWallet(userId);
    
    // Check again after migration
    if (localStorage.getItem(seededKey)) {
      return; // Migration handled seeding
    }

    // Create new seeded wallet
    const seedAmounts = this.getSeedAmounts();
    const wallet: PaperWallet = {
      USDC: seedAmounts.USDC,
      SOL: seedAmounts.SOL,
      updatedAt: new Date().toISOString()
    };

    this.saveWalletToStorage(userId, wallet);
    localStorage.setItem(seededKey, 'true');
    this.notifyWalletChange(userId);

    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[paper:seed]', userId, wallet);
    }
  }

  getWallet(userId: string): PaperWallet {
    const wallet = this.getWalletFromStorage(userId);
    if (wallet) {
      return wallet;
    }

    // Return empty wallet if not found
    return {
      USDC: 0,
      SOL: 0,
      updatedAt: new Date().toISOString()
    };
  }

  getTotalUSD(userId: string): number {
    const wallet = this.getWallet(userId);
    // Use existing price feed if available, otherwise fallback prices
    const mockPrices: Record<string, number> = {
      'USDC': 1,
      'SOL': 100  // Fallback price
    };
    
    const total = wallet.USDC * mockPrices.USDC + wallet.SOL * mockPrices.SOL;
    
    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[paper:totalUSD]', userId, total);
    }
    
    return total;
  }

  credit(userId: string, asset: 'USDC' | 'SOL', amount: number): void {
    if (amount <= 0) {
      console.warn('Credit amount must be positive');
      return;
    }

    const wallet = this.getWallet(userId);
    wallet[asset] += amount;
    wallet.updatedAt = new Date().toISOString();
    
    this.saveWalletToStorage(userId, wallet);
    this.notifyWalletChange(userId);

    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[paper:credit]', userId, { asset, amount, newBalance: wallet[asset] });
    }
  }

  debit(userId: string, asset: 'USDC' | 'SOL', amount: number): DebitResult {
    if (amount <= 0) {
      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[paper:debit]', userId, { asset, amount, ok: false, reason: 'Amount must be positive' });
      }
      return { ok: false, reason: 'Amount must be positive' };
    }

    const wallet = this.getWallet(userId);
    
    if (wallet[asset] < amount) {
      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[paper:debit]', userId, { asset, amount, ok: false, reason: 'Insufficient balance', available: wallet[asset] });
      }
      return {
        ok: false,
        reason: `Insufficient ${asset} balance. Required: ${amount}, Available: ${wallet[asset]}`
      };
    }

    wallet[asset] -= amount;
    wallet.updatedAt = new Date().toISOString();
    
    this.saveWalletToStorage(userId, wallet);
    this.notifyWalletChange(userId);

    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[paper:debit]', userId, { asset, amount, ok: true, newBalance: wallet[asset] });
    }

    return { ok: true };
  }

  reset(userId: string): void {
    const seedAmounts = this.getSeedAmounts();
    const wallet: PaperWallet = {
      USDC: seedAmounts.USDC,
      SOL: seedAmounts.SOL,
      updatedAt: new Date().toISOString()
    };

    this.saveWalletToStorage(userId, wallet);
    this.notifyWalletChange(userId);

    if (import.meta.env.VITE_DEBUG_CHAT === '1') {
      console.log('[paper:reset]', userId, wallet);
    }
  }

  onWalletChanged(callback: (detail: { userId: string }) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {}; // No-op cleanup
    }

    const handleWalletChange = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener('blossom:wallet:changed', handleWalletChange as EventListener);
    
    return () => {
      window.removeEventListener('blossom:wallet:changed', handleWalletChange as EventListener);
    };
  }
}

export const paperCustody = new PaperCustodyStore();

// Export convenience functions
export async function ensureSeed(userId: string): Promise<void> {
  return paperCustody.ensureSeed(userId);
}

export function getWallet(userId: string): PaperWallet {
  return paperCustody.getWallet(userId);
}

export function getTotalUSD(userId: string): number {
  return paperCustody.getTotalUSD(userId);
}

export function credit(userId: string, asset: 'USDC' | 'SOL', amount: number): void {
  return paperCustody.credit(userId, asset, amount);
}

export function debit(userId: string, asset: 'USDC' | 'SOL', amount: number): DebitResult {
  return paperCustody.debit(userId, asset, amount);
}

export function reset(userId: string): void {
  return paperCustody.reset(userId);
}

export function onWalletChanged(callback: (detail: { userId: string }) => void): () => void {
  return paperCustody.onWalletChanged(callback);
}

// Dev helper for console inspection
if (typeof window !== 'undefined') {
  (window as any).__paper = (userId?: string) => {
    const activeUserId = userId || 'guest';
    const wallet = getWallet(activeUserId);
    const totalUSD = getTotalUSD(activeUserId);
    console.log(`Paper Custody for ${activeUserId}:`, { wallet, totalUSD });
    return { wallet, totalUSD };
  };
}
