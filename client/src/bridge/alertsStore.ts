export interface AlertAllocation {
  asset: string;
  chain: string;
  protocol: string;
  estApy: number;
  risk: string;
}

export interface AlertPlan {
  summary: string;
  allocations: AlertAllocation[];
}

export interface AlertRule {
  id: string;
  type: 'apy_threshold' | 'apy_drop' | 'rebalance' | 'risk_alert';
  asset: string;
  chain: string;
  condition: string;
  frequency: string;
  cadence?: string; // for compatibility with AlertsCard
  active?: boolean; // for compatibility with AlertsCard
  lastTriggeredAt?: string; // for compatibility with AlertsCard
  createdAt: string;
  readAt?: string;
  plan?: AlertPlan;
}

export interface CreateAlertInput {
  type: AlertRule['type'];
  asset: string;
  chain: string;
  condition: string;
  frequency: string;
  plan?: AlertPlan;
}

class AlertsStore {
  private storageKey = (userId: string) => `blossom.alerts.${userId}`;

  private getCurrentUser(): string | null {
    // Use the same mechanism as chat - get from localStorage or demo user
    try {
      const userData = localStorage.getItem('blossom.user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.username || 'demo';
      }
      return 'demo'; // fallback to demo user
    } catch {
      return 'demo';
    }
  }

  private getStorageKey(): string {
    const userId = this.getCurrentUser();
    return this.storageKey(userId || 'demo');
  }

  private getAlertsFromStorage(): AlertRule[] {
    try {
      const key = this.getStorageKey();
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Failed to load alerts from storage:', error);
      return [];
    }
  }

  private saveAlertsToStorage(alerts: AlertRule[]): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(alerts));
    } catch (error) {
      console.warn('Failed to save alerts to storage:', error);
    }
  }

  listAlerts(): AlertRule[] {
    const alerts = this.getAlertsFromStorage();
    // Sort by most recent first
    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createAlert(ruleInit: CreateAlertInput): AlertRule {
    const alerts = this.getAlertsFromStorage();
    
    const newRule: AlertRule = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...ruleInit,
      cadence: ruleInit.frequency, // map frequency to cadence for compatibility
      active: true, // default to active
      createdAt: new Date().toISOString(),
    };

    alerts.push(newRule);
    this.saveAlertsToStorage(alerts);

    // Emit blossom:alert event
    window.dispatchEvent(new CustomEvent('blossom:alert', {
      detail: newRule
    }));

    console.log('alerts:create', {
      id: newRule.id,
      asset: newRule.asset,
      chain: newRule.chain,
      condition: newRule.condition
    });

    return newRule;
  }

  markRead(id: string): void {
    const alerts = this.getAlertsFromStorage();
    const alert = alerts.find(a => a.id === id);
    if (alert && !alert.readAt) {
      alert.readAt = new Date().toISOString();
      this.saveAlertsToStorage(alerts);
    }
  }

  markAllRead(): void {
    const alerts = this.getAlertsFromStorage();
    const now = new Date().toISOString();
    let hasChanges = false;

    alerts.forEach(alert => {
      if (!alert.readAt) {
        alert.readAt = now;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveAlertsToStorage(alerts);
      console.log('alerts:markAllRead');
    }
  }

  unreadCount(): number {
    const alerts = this.getAlertsFromStorage();
    return alerts.filter(alert => !alert.readAt).length;
  }

  // Listen for storage changes to update badge
  setupStorageListener(): void {
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('blossom.alerts.')) {
        const count = this.unreadCount();
        console.log('alerts:badge:update', `n=${count}`);
        
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('alerts:badge:update', {
          detail: { count }
        }));
      }
    });
  }
}

export const alertsStore = new AlertsStore();

// Initialize storage listener
alertsStore.setupStorageListener();

// Helper functions for chat integration
export function parseAlertFromMessage(message: string): CreateAlertInput | null {
  const lowerMessage = message.toLowerCase();
  
  // Check if this is an alert request
  const isAlertRequest = lowerMessage.includes('notify') || 
                        lowerMessage.includes('alert') || 
                        lowerMessage.includes('drop') || 
                        lowerMessage.includes('spike') || 
                        lowerMessage.includes('set up');
  
  if (!isAlertRequest) {
    return null;
  }

  // Extract assets
  const assetPatterns = [
    /\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/gi,
  ];
  
  const assets: string[] = [];
  assetPatterns.forEach(pattern => {
    const matches = lowerMessage.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const asset = match.toUpperCase();
        if (!assets.includes(asset)) {
          assets.push(asset);
        }
      });
    }
  });

  // Extract chain
  let chain = 'solana'; // default
  if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
    chain = 'ethereum';
  } else if (lowerMessage.includes('polygon') || lowerMessage.includes('matic')) {
    chain = 'polygon';
  }

  // Extract APY threshold
  let apy: number | undefined;
  const apyMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:apy|apr)/);
  if (apyMatch) {
    apy = parseFloat(apyMatch[1]);
  } else {
    // Look for any percentage
    const percentMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch) {
      apy = parseFloat(percentMatch[1]);
    }
  }

  // Determine alert type and condition
  let type: AlertRule['type'] = 'apy_threshold';
  let condition: string;
  
  const isDropAlert = lowerMessage.includes('drop') || lowerMessage.includes('below');
  const isSpikeAlert = lowerMessage.includes('spike') || lowerMessage.includes('above');
  
  if (isDropAlert) {
    type = 'apy_drop';
    condition = `APR drops below ${apy || 7}%`;
  } else if (isSpikeAlert) {
    type = 'apy_threshold';
    condition = `APR spikes ${apy || 50}% above 7-day baseline`;
  } else {
    // Default to threshold alert
    condition = `APR changes by ${apy || 50}%`;
  }

  // Extract frequency
  let frequency = '15 minutes'; // default
  if (lowerMessage.includes('5 minutes') || lowerMessage.includes('5m')) {
    frequency = '5 minutes';
  } else if (lowerMessage.includes('1 minute') || lowerMessage.includes('1m')) {
    frequency = '1 minute';
  } else if (lowerMessage.includes('hour')) {
    frequency = '1 hour';
  }

  return {
    type,
    asset: assets[0] || 'USDC',
    chain,
    condition,
    frequency,
  };
}

export function createAlertRule(ruleInit: CreateAlertInput): AlertRule {
  return alertsStore.createAlert(ruleInit);
}

// Additional exports for compatibility
export function loadAlerts(userId?: string): AlertRule[] {
  return alertsStore.listAlerts();
}

export function saveAlerts(rules: AlertRule[], userId?: string): void {
  // This would need to be implemented in the store if needed
  console.warn('saveAlerts not implemented - use createAlert/deleteAlertRule instead');
}

export function deleteAlertRule(id: string, userId?: string): boolean {
  const alerts = alertsStore.listAlerts();
  const filtered = alerts.filter(rule => rule.id !== id);
  
  if (filtered.length === alerts.length) {
    return false; // No rule found to delete
  }
  
  // Save the filtered list back to storage
  try {
    const key = `blossom.alerts.${userId || 'demo'}`;
    localStorage.setItem(key, JSON.stringify(filtered));
    
    // Emit change event
    window.dispatchEvent(new CustomEvent('blossom:alerts:changed', {
      detail: { action: 'deleted', id, userId: userId || 'demo' }
    }));
    
    console.log('alerts:delete', { id, userId: userId || 'demo' });
    return true;
  } catch (error) {
    console.warn('Failed to delete alert:', error);
    return false;
  }
}

export function markAllRead(userId?: string): void {
  alertsStore.markAllRead();
}

// Helper function for event listening
export function onAlertsChanged(cb: (rules: AlertRule[]) => void): () => void {
  const handler = () => {
    cb(alertsStore.listAlerts());
  };
  
  window.addEventListener('blossom:alerts:changed', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('blossom:alerts:changed', handler);
  };
}

// Additional functions needed by AlertsCard
export function listAlertRules(): AlertRule[] {
  return alertsStore.listAlerts();
}

export function simulateTrigger(alertId: string): AlertRule | null {
  // Mock simulation - in real implementation this would check actual data
  const alerts = alertsStore.listAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    // Mock update with lastTriggeredAt
    const updatedAlert = { ...alert, lastTriggeredAt: new Date().toISOString() };
    // In a real implementation, you'd save this back to storage
    return updatedAlert;
  }
  return null;
}

export function toggleAlertRule(alertId: string): AlertRule | null {
  // Mock toggle - in real implementation this would update the active state
  const alerts = alertsStore.listAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    const updatedAlert = { ...alert, active: !alert.active };
    // In a real implementation, you'd save this back to storage
    return updatedAlert;
  }
  return null;
}

export function formatAlertRule(alert: AlertRule): string {
  return `${alert.asset} on ${alert.chain}: ${alert.condition}`;
}

export function getNextCheckTime(alert: AlertRule): string {
  // Mock next check time
  const now = new Date();
  const nextCheck = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
  return nextCheck.toLocaleTimeString();
}