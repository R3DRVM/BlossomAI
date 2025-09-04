/**
 * Plan Bridge - Converts chat plans to portfolio snapshots
 * User-scoped localStorage persistence
 */

import { ChatPlan, PlanSnapshot, Position, RiskBand, generateMock30dVolume, generateMockTVL, calculateHHI, calculateWeightedAPY, calculateStableVolatileSplit } from './types';
import { getActiveUserId } from '../ai/userUtils';
import { demoWallet } from './walletSimStore';

const PLAN_STORAGE_KEY = 'blossom.bridge.latestPlan';

// Get total available capital (positions + cash)
export const getTotalAvailableCapital = (userId?: string): number => {
  const activeUserId = userId || getActiveUserId();
  
  // Get cash from demo wallet
  const cashUSD = demoWallet.getTotalUSD(activeUserId);
  
  // Get positions value from portfolio (avoid circular import)
  // We'll calculate this differently to avoid the circular dependency
  return cashUSD;
};

// Convert chat allocation to institutional position
const chatAllocationToPosition = (allocation: any, totalCapital: number): Position => {
  const amountUSD = (allocation.percentage / 100) * totalCapital;
  const baseAPY = allocation.estApy || 0;
  const emissionsAPY = allocation.emissionsApy || 0; // From chat if mentioned
  
  return {
    id: `${allocation.protocol}-${allocation.chain}-${allocation.asset}-${Date.now()}`,
    protocol: allocation.protocol,
    chain: allocation.chain,
    asset: allocation.asset,
    allocPercentage: allocation.percentage,
    amountUSD,
    baseAPY,
    emissionsAPY,
    netAPY: baseAPY + emissionsAPY,
    tvlAtEntry: allocation.tvl || generateMockTVL(allocation.protocol, allocation.chain),
    volume30d: generateMock30dVolume(allocation.asset),
    riskBand: mapRiskLabel(allocation.riskLabel),
    entryTime: new Date().toISOString()
  };
};

const mapRiskLabel = (label: string): RiskBand => {
  const lower = label.toLowerCase();
  if (lower.includes('low') || lower.includes('stable')) return 'low';
  if (lower.includes('high') || lower.includes('aggressive')) return 'high';
  return 'medium';
};

// Convert chat plan to portfolio snapshot
export const createSnapshotFromPlan = (plan: ChatPlan, userId?: string): PlanSnapshot => {
  const activeUserId = userId || getActiveUserId();
  const positions = plan.allocations.map(alloc => 
    chatAllocationToPosition(alloc, plan.totalAmount)
  );
  
  // Calculate KPIs
  const grossAPY = calculateWeightedAPY(positions, false);
  const netAPY = calculateWeightedAPY(positions, true);
  const { stable, volatile } = calculateStableVolatileSplit(positions);
  const concentration = calculateHHI(positions);
  const diversification = new Set(positions.map(p => p.protocol)).size;
  
  const snapshot: PlanSnapshot = {
    id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    planSummary: plan.planSummary,
    totalCapitalUSD: plan.totalAmount,
    positions,
    kpis: {
      grossAPY,
      netAPY,
      stablePercentage: stable,
      volatilePercentage: volatile,
      concentration,
      diversification,
      rebalanceRule: plan.rebalanceRule
    },
    audit: {
      appliedBy: activeUserId,
      appliedAt: new Date().toISOString(),
      sourcePlanProvenance: 'live', // Assume live unless specified
      whitelist: plan.whitelist
    },
    createdAt: new Date().toISOString()
  };
  
  return snapshot;
};

// Store latest plan for current user
export const setLatestPlan = (plan: ChatPlan): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  const userId = getActiveUserId();
  const key = `${PLAN_STORAGE_KEY}.${userId}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(plan));
  } catch (error) {
    console.warn('[PLAN_BRIDGE] Failed to store plan:', error);
  }
};

// Get latest plan for current user
export const getLatestPlan = (userId?: string): ChatPlan | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  const activeUserId = userId || getActiveUserId();
  const key = `${PLAN_STORAGE_KEY}.${activeUserId}`;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) ?? null : null;
  } catch (error) {
    console.warn('[PLAN_BRIDGE] Failed to retrieve plan:', error);
    return null;
  }
};

// Clear latest plan for current user
export const clearLatestPlan = (userId?: string): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  const activeUserId = userId || getActiveUserId();
  const key = `${PLAN_STORAGE_KEY}.${activeUserId}`;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('[PLAN_BRIDGE] Failed to clear plan:', error);
  }
};

// Check if user has a pending plan
export const hasPendingPlan = (userId?: string): boolean => {
  return getLatestPlan(userId) !== null;
};
