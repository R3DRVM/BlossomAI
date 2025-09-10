import { ChatPlan } from '../../bridge/types';

export interface PlanMemory {
  currentPlan?: ChatPlan;
  previousPlan?: ChatPlan;
  savedStrategies: Record<string, ChatPlan>;
}

class PlanMemoryStore {
  private storageKey = (userId: string) => `blossom.plan-memory.${userId}`;

  private getCurrentUser(): string {
    try {
      const userData = localStorage.getItem('blossom.user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.username || 'demo';
      }
      return 'demo';
    } catch {
      return 'demo';
    }
  }

  private getStorageKey(): string {
    const userId = this.getCurrentUser();
    return this.storageKey(userId);
  }

  private getMemoryFromStorage(): PlanMemory {
    try {
      const key = this.getStorageKey();
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : { savedStrategies: {} };
    } catch (error) {
      console.warn('Failed to load plan memory from storage:', error);
      return { savedStrategies: {} };
    }
  }

  private saveMemoryToStorage(memory: PlanMemory): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(memory));
    } catch (error) {
      console.warn('Failed to save plan memory to storage:', error);
    }
  }

  getCurrentPlan(): ChatPlan | undefined {
    const memory = this.getMemoryFromStorage();
    return memory.currentPlan;
  }

  setCurrentPlan(plan: ChatPlan): void {
    const memory = this.getMemoryFromStorage();
    
    // Store previous plan for undo
    if (memory.currentPlan) {
      memory.previousPlan = memory.currentPlan;
    }
    
    memory.currentPlan = plan;
    this.saveMemoryToStorage(memory);
  }

  getPreviousPlan(): ChatPlan | undefined {
    const memory = this.getMemoryFromStorage();
    return memory.previousPlan;
  }

  modifyCurrentPlan(modifications: any): ChatPlan | null {
    const currentPlan = this.getCurrentPlan();
    if (!currentPlan) {
      return null;
    }

    // Create modified plan
    const modifiedPlan: ChatPlan = {
      ...currentPlan,
      planSummary: currentPlan.planSummary,
      allocations: [...currentPlan.allocations],
      totalAmount: currentPlan.totalAmount,
      avgApy: currentPlan.avgApy,
      riskLevel: modifications.risk || currentPlan.riskLevel,
      rebalanceRule: modifications.cadence ? `${modifications.cadence} rebalance` : currentPlan.rebalanceRule,
      whitelist: modifications.whitelist || currentPlan.whitelist
    };

    // Apply whitelist filter if specified
    if (modifications.whitelist && modifications.whitelist.length > 0) {
      modifiedPlan.allocations = modifiedPlan.allocations.filter(alloc => 
        modifications.whitelist.some((protocol: string) => 
          alloc.protocol.toLowerCase().includes(protocol.toLowerCase())
        )
      );
    }

    // Apply cap per protocol if specified
    if (modifications.capPerProtocol) {
      const cap = modifications.capPerProtocol / 100;
      modifiedPlan.allocations = modifiedPlan.allocations.map(alloc => ({
        ...alloc,
        percentage: Math.min(alloc.percentage, cap * 100)
      }));
    }

    // Rebalance percentages
    const totalPercentage = modifiedPlan.allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (totalPercentage > 0) {
      modifiedPlan.allocations = modifiedPlan.allocations.map(alloc => ({
        ...alloc,
        percentage: (alloc.percentage / totalPercentage) * 100
      }));
    }

    // Update average APY
    modifiedPlan.avgApy = modifiedPlan.allocations.reduce((sum, alloc) => sum + alloc.estApy, 0) / modifiedPlan.allocations.length;

    this.setCurrentPlan(modifiedPlan);
    return modifiedPlan;
  }

  undoLastModification(): ChatPlan | null {
    const memory = this.getMemoryFromStorage();
    if (memory.previousPlan) {
      memory.currentPlan = memory.previousPlan;
      memory.previousPlan = undefined;
      this.saveMemoryToStorage(memory);
      return memory.currentPlan;
    }
    return null;
  }

  saveStrategy(name: string, plan: ChatPlan): void {
    const memory = this.getMemoryFromStorage();
    memory.savedStrategies[name] = plan;
    this.saveMemoryToStorage(memory);
  }

  loadStrategy(name: string): ChatPlan | null {
    const memory = this.getMemoryFromStorage();
    return memory.savedStrategies[name] || null;
  }

  listSavedStrategies(): string[] {
    const memory = this.getMemoryFromStorage();
    return Object.keys(memory.savedStrategies);
  }

  deleteStrategy(name: string): boolean {
    const memory = this.getMemoryFromStorage();
    if (memory.savedStrategies[name]) {
      delete memory.savedStrategies[name];
      this.saveMemoryToStorage(memory);
      return true;
    }
    return false;
  }

  clearCurrentPlan(): void {
    const memory = this.getMemoryFromStorage();
    memory.currentPlan = undefined;
    memory.previousPlan = undefined;
    this.saveMemoryToStorage(memory);
  }
}

export const planMemory = new PlanMemoryStore();





