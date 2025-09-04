/**
 * Portfolio Store - Manages applied snapshots and portfolio state
 * User-scoped localStorage persistence
 */

import { PlanSnapshot, PortfolioSnapshot, ChatPlan } from './types';
import { getActiveUserId } from '../ai/userUtils';
import { createSnapshotFromPlan } from './planBridge';
import { getPositions, setPositions, addPositions, onPositionsChanged, clearPositions, PositionSnapshot } from './positionsStore';
import { debit, getTotalUSD } from './paperCustody';
import { demoWallet } from './walletSimStore';
import { ProposedPlan, getProposedPlan } from './proposedPlanStore';

const PORTFOLIO_STORAGE_KEY = 'blossom.bridge.portfolio';

// Create positions directly from a plan (for Deploy Now functionality)
export const createPositionsFromPlan = async (plan: ChatPlan, userId?: string): Promise<{ count: number; totalUSD: number }> => {
  const activeUserId = userId || getActiveUserId();
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:creating]', { planId: plan.planSummary, totalAmount: plan.totalAmount, allocations: plan.allocations.length });
  }
  
  // Debit paper custody first
  const debitResult = debit(activeUserId, 'USDC', plan.totalAmount);
  if (!debitResult.ok) {
    throw new Error(debitResult.reason || 'Insufficient funds');
  }
  
  // Create positions in positions store
  const positions = plan.allocations.map(alloc => ({
    protocol: alloc.protocol,
    chain: alloc.chain || 'solana',
    asset: alloc.asset || 'USDC',
    amountUSD: (plan.totalAmount * alloc.percentage) / 100,
    baseAPY: alloc.estApy,
    entryTime: new Date().toISOString()
  }));
  addPositions(activeUserId, positions);
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:created]', { count: plan.allocations.length, totalUSD: plan.totalAmount });
  }
  
  // Fire positions created event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blossom:positions:created', {
      detail: { count: plan.allocations.length, totalUSD: plan.totalAmount }
    }));
  }
  
  return { count: plan.allocations.length, totalUSD: plan.totalAmount };
};

// Apply a plan as a new portfolio snapshot
export const applyPlanAsSnapshot = async (plan: ChatPlan, userId?: string): Promise<PlanSnapshot> => {
  const activeUserId = userId || getActiveUserId();
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:creating]', { planId: plan.planSummary, totalAmount: plan.totalAmount, allocations: plan.allocations.length });
  }
  
  // Create snapshot
  const snapshot = createSnapshotFromPlan(plan, activeUserId);
  
  // Create positions in positions store
  const positions = plan.allocations.map(alloc => ({
    protocol: alloc.protocol,
    chain: alloc.chain || 'solana',
    asset: alloc.asset || 'USDC',
    amountUSD: (plan.totalAmount * alloc.percentage) / 100,
    baseAPY: alloc.estApy,
    entryTime: new Date().toISOString()
  }));
  addPositions(activeUserId, positions);
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:created]', { count: plan.allocations.length, planId: snapshot.id });
  }
  
  // Get current portfolio or create new
  const portfolio = getPortfolioSnapshot(activeUserId) || createEmptyPortfolio(activeUserId);
  
  // Add new snapshot
  portfolio.snapshots.unshift(snapshot); // Most recent first
  portfolio.latestSnapshot = snapshot;
  portfolio.updatedAt = new Date().toISOString();
  
  // Keep only last 10 snapshots to prevent storage bloat
  if (portfolio.snapshots.length > 10) {
    portfolio.snapshots = portfolio.snapshots.slice(0, 10);
  }
  
  // Persist
  savePortfolioSnapshot(portfolio);
  
  console.log('portfolio:applied', { 
    snapshotId: snapshot.id, 
    totalAmount: plan.totalAmount,
    positions: plan.allocations.length 
  });
  
  return snapshot;
};

// Get portfolio for user
export const getPortfolioSnapshot = (userId?: string): PortfolioSnapshot | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  
  const activeUserId = userId || getActiveUserId();
  const key = `${PORTFOLIO_STORAGE_KEY}.${activeUserId}`;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) ?? null : null;
  } catch (error) {
    console.warn('[PORTFOLIO_STORE] Failed to retrieve portfolio:', error);
    return null;
  }
};

// Save portfolio for user
const savePortfolioSnapshot = (portfolio: PortfolioSnapshot): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  const key = `${PORTFOLIO_STORAGE_KEY}.${portfolio.userId}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(portfolio));
  } catch (error) {
    console.warn('[PORTFOLIO_STORE] Failed to save portfolio:', error);
  }
};

// Create empty portfolio for user
const createEmptyPortfolio = (userId: string): PortfolioSnapshot => {
  const now = new Date().toISOString();
  return {
    userId,
    snapshots: [],
    createdAt: now,
    updatedAt: now
  };
};

// Get latest snapshot for user
export const getLatestSnapshot = (userId?: string): PlanSnapshot | null => {
  const portfolio = getPortfolioSnapshot(userId);
  return portfolio?.latestSnapshot || null;
};

// List all snapshots for user (newest first)
export const listSnapshots = (userId?: string): PlanSnapshot[] => {
  const portfolio = getPortfolioSnapshot(userId);
  return portfolio?.snapshots || [];
};

// Check if user has any applied snapshots
export const hasAppliedSnapshots = (userId?: string): boolean => {
  const portfolio = getPortfolioSnapshot(userId);
  return (portfolio?.snapshots.length || 0) > 0;
};

// Get snapshot by ID
export const getSnapshotById = (id: string, userId?: string): PlanSnapshot | null => {
  const portfolio = getPortfolioSnapshot(userId);
  return portfolio?.snapshots.find(s => s.id === id) || null;
};

// Delete snapshot by ID
export const deleteSnapshot = (id: string, userId?: string): boolean => {
  const activeUserId = userId || getActiveUserId();
  const portfolio = getPortfolioSnapshot(activeUserId);
  
  if (!portfolio) return false;
  
  const initialLength = portfolio.snapshots.length;
  portfolio.snapshots = portfolio.snapshots.filter(s => s.id !== id);
  
  // Update latest if we deleted it
  if (portfolio.latestSnapshot?.id === id) {
    portfolio.latestSnapshot = portfolio.snapshots[0] || undefined;
  }
  
  portfolio.updatedAt = new Date().toISOString();
  savePortfolioSnapshot(portfolio);
  
  return portfolio.snapshots.length < initialLength;
};

// Export positions to CSV format
export const exportPositionsToCSV = (snapshot: PlanSnapshot): string => {
  const headers = [
    'Protocol',
    'Chain', 
    'Asset',
    'Alloc %',
    'Amount (USD)',
    'Base APY',
    'Emissions APY',
    'Net APY',
    'TVL at Entry',
    '30d Vol',
    'Risk Band',
    'Fees (bps)',
    'Entry Time'
  ];
  
  const rows = snapshot.positions.map(pos => [
    pos.protocol,
    pos.chain,
    pos.asset,
    pos.allocPercentage.toFixed(2),
    pos.amountUSD.toLocaleString(),
    pos.baseAPY.toFixed(2),
    pos.emissionsAPY.toFixed(2),
    pos.netAPY.toFixed(2),
    pos.tvlAtEntry.toLocaleString(),
    pos.volume30d.toLocaleString(),
    pos.riskBand,
    pos.feesBps?.toString() || 'N/A',
    new Date(pos.entryTime).toLocaleString()
  ]);
  
  // Get total available capital including cash
  const totalAvailableCapital = demoWallet.getTotalUSD();
  const cashAvailable = totalAvailableCapital - snapshot.totalCapitalUSD;
  
  // Add metadata header
  const metadata = [
    `# Portfolio Snapshot: ${snapshot.id}`,
    `# Created: ${new Date(snapshot.createdAt).toLocaleString()}`,
    `# Applied by: ${snapshot.audit.appliedBy}`,
    `# Total Capital: $${snapshot.totalCapitalUSD.toLocaleString()}`,
    `# Cash Available: $${cashAvailable.toLocaleString()}`,
    `# Total Available: $${totalAvailableCapital.toLocaleString()}`,
    `# Gross APY: ${snapshot.kpis.grossAPY.toFixed(2)}%`,
    `# Net APY: ${snapshot.kpis.netAPY.toFixed(2)}%`,
    `# Diversification: ${snapshot.kpis.diversification} protocols`,
    `# Plan: ${snapshot.planSummary}`,
    ''
  ];
  
  // Add cash line item
  const cashRow = [
    'Cash',
    'Available',
    'USDC',
    '0.00',
    cashAvailable.toLocaleString(),
    '0.00',
    '0.00',
    '0.00',
    '0',
    '0',
    'low',
    '0',
    new Date().toLocaleString()
  ];
  
  const csvContent = [
    ...metadata,
    headers.join(','),
    ...rows.map(row => row.join(',')),
    cashRow.join(',')
  ].join('\n');
  
  return csvContent;
};

// Download CSV file
export const downloadSnapshotCSV = (snapshot: PlanSnapshot): void => {
  const csv = exportPositionsToCSV(snapshot);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const filename = `blossom-portfolio-${snapshot.id}-${new Date().toISOString().split('T')[0]}.csv`;
  
  if ((navigator as any).msSaveBlob) {
    // IE 10+
    (navigator as any).msSaveBlob(blob, filename);
  } else {
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Plan application helper
export async function applyPlanById(userId: string, plan: ProposedPlan) {
  console.log('[applyPlanById:start]', { userId, planId: plan.id, status: plan.status, capitalUSD: plan.capitalUSD });
  
  // Re-fetch the plan to ensure we have the latest status
  const freshPlan = getProposedPlan(userId);
  if (!freshPlan || freshPlan.id !== plan.id) {
    throw new Error('Plan not found or ID mismatch');
  }
  
  if (freshPlan.status !== 'pending') {
    throw new Error(`Plan status is "${freshPlan.status}" but should be "pending"`);
  }
  
  if (plan.capitalUSD <= 0) throw new Error('Invalid size');
  
  // Check if user has sufficient cash
  const totalCash = getTotalUSD(userId);
  if (totalCash < plan.capitalUSD) {
    throw new Error(`Insufficient funds. Available: $${totalCash.toLocaleString()}, Required: $${plan.capitalUSD.toLocaleString()}`);
  }
  
  // Debit cash
  console.log('[applyPlanById:debit]', { userId, asset: plan.asset, amount: plan.capitalUSD });
  const debitResult = debit(userId, plan.asset, plan.capitalUSD);
  if (!debitResult.ok) {
    console.error('[applyPlanById:debit:failed]', { reason: debitResult.reason });
    throw new Error(debitResult.reason || 'Failed to debit funds');
  }
  console.log('[applyPlanById:debit:success]', { userId, asset: plan.asset, amount: plan.capitalUSD });
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[paper:debit]', { userId, asset: plan.asset, amount: plan.capitalUSD });
  }
  
  // Create concrete positions per allocation
  const items: PositionSnapshot[] = plan.allocations.map(a => ({
    id: crypto.randomUUID ? crypto.randomUUID() : `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    protocol: a.protocol,
    chain: a.chain,
    asset: a.asset,
    amountUSD: a.amountUSD || Math.round(plan.capitalUSD / plan.allocations.length),
    baseAPY: a.apy,
    risk: a.risk,
    entryTime: new Date().toISOString(),
  }));
  
  console.log('[applyPlanById:positions]', { userId, count: items.length, totalUSD: plan.capitalUSD });
  addPositions(userId, items);
  console.log('[applyPlanById:positions:success]', { userId, count: items.length });
  
  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
    console.log('[positions:created]', { userId, count: items.length, totalUSD: plan.capitalUSD });
  }
  
  // Fire positions created event for UI updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('blossom:positions:created', {
      detail: { userId, count: items.length, totalUSD: plan.capitalUSD }
    }));
  }
  
  // Mark plan as applied
  plan.status = 'applied';
  localStorage.setItem(`blossom.proposedPlan.${userId}`, JSON.stringify(plan));
  
  console.log('[applyPlanById:complete]', { userId, planId: plan.id, count: items.length, totalUSD: plan.capitalUSD });
}

// Positions functions are now imported directly from positionsStore.ts
