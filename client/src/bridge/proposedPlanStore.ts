/**
 * Proposed plans store for managing pending deployment plans
 */

import { getActiveUserId } from '../ai/userUtils';

export type ProposedPlan = {
  id: string;
  userId: string;
  capitalUSD: number;
  asset: 'USDC'|'SOL';
  chain: 'solana'|'ethereum'|'injective';
  risk: 'low'|'medium'|'high';
  autoRebalance: boolean;
  allocations: Array<{ protocol: string; chain: string; asset: string; apy: number; tvl: number; risk: string; amountUSD?: number }>;
  createdAt: string;
  status: 'pending'|'applied'|'canceled';
};

const KP = (u: string) => `blossom.proposedPlan.${u}`;
const EVTP = 'blossom:plan:proposed';

export function set(userId: string, plan: ProposedPlan) {
  localStorage.setItem(KP(userId), JSON.stringify(plan));
  window.dispatchEvent(new CustomEvent(EVTP, { detail: plan }));
}

export function get(userId: string): ProposedPlan | null {
  try { 
    return JSON.parse(localStorage.getItem(KP(userId)) || 'null'); 
  } catch { 
    return null; 
  }
}

export function clear(userId: string) {
  localStorage.removeItem(KP(userId));
}

// Main functions
export function saveProposedPlan(plan: ProposedPlan, userId?: string) {
  const activeUserId = userId || getActiveUserId() || 'guest';
  set(activeUserId, plan);
}
export const getProposedPlan = get;
export const clearProposedPlan = clear;

export function onPlanProposed(handler: (e: CustomEvent) => void) {
  const fn = handler as EventListener;
  window.addEventListener(EVTP, fn);
  return () => window.removeEventListener(EVTP, fn);
}

// Alias for compatibility
export const createProposedPlan = saveProposedPlan;

// Store object for compatibility
export const proposedPlanStore = {
  set,
  get,
  clear,
  onProposed: onPlanProposed,
  getCurrentPlan: () => {
    const userId = 'guest'; // Default user
    return get(userId);
  }
};

export function markProposedPlanAsApplied(userId: string) {
  const plan = getProposedPlan(userId);
  if (plan) {
    plan.status = 'applied';
    saveProposedPlan(plan, userId);
  }
}