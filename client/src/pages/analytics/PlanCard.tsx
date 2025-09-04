/**
 * Proposed Plan Card - Shows pending plan with KPIs and Apply button
 * Only visible when user has a proposed plan from chat
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, TrendingUp, Shield, Building2, Timer, Users } from 'lucide-react';
import { ProposedPlan } from '@/bridge/proposedPlanStore';
import { applyPlanById } from '@/bridge/portfolioStore';
import { getActiveUserId } from '@/ai/userUtils';
import { ensureSeed, getTotalUSD } from '@/bridge/paperCustody';
import { clearProposedPlan } from '@/bridge/proposedPlanStore';
import { formatSize } from '@/lib/num';

interface PlanCardProps {
  plan: ProposedPlan;
  onApplied?: () => void;
  className?: string;
}

export function PlanCard({ plan, onApplied, className = '' }: PlanCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();
  
  // Safety check - don't render if plan is invalid
  if (!plan || !plan.capitalUSD) {
    return null;
  }
  
  // Calculate preview KPIs (simplified for display) with safety guards
  const totalAmount = plan?.capitalUSD || 0;
  const avgAPY = plan?.allocations?.length > 0 ? plan.allocations.reduce((sum, a) => sum + (a.apy || 0), 0) / plan.allocations.length : 0;
  const stableAssets = ['USDC', 'USDT', 'DAI', 'FDUSD'];
  const stableAllocs = plan?.allocations?.filter(a => stableAssets.includes(a.asset)) || [];
  const stablePercentage = stableAllocs.length > 0 && plan?.allocations?.length > 0 ? (stableAllocs.length / plan.allocations.length) * 100 : 0;
  const protocolCount = plan?.allocations ? new Set(plan.allocations.map(a => a.protocol)).size : 0;
  
  const handleApplyToPorfolio = async () => {
    setIsApplying(true);
    
    try {
      const userId = getActiveUserId() || 'guest';
      
      // Validate capital amount
      if (!plan?.capitalUSD || plan.capitalUSD <= 0) {
        toast({
          title: "Capital must be greater than zero",
          description: "Please specify a valid deployment amount.",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure user has seeded balances
      await ensureSeed(userId);
      
      // Check if user has sufficient funds
      const totalAvailable = getTotalUSD(userId);
      if (totalAvailable < (plan?.capitalUSD || 0)) {
        toast({
          title: "Insufficient Funds",
          description: `Not enough funds. Available: $${totalAvailable.toLocaleString()}, Required: $${(plan?.capitalUSD || 0).toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }
      
      // Apply the plan (this will debit paper custody and create positions)
      await applyPlanById(userId, plan);
      
      // Clear the proposed plan since it's now applied
      clearProposedPlan(userId);
      
      // Fire success notification
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('blossom:notify', {
          detail: {
            kind: 'success',
            title: `Deployed $${formatSize(plan?.capitalUSD || 0)}`,
            link: '/portfolio'
          }
        }));
      }
      
      toast({
        title: "Applied to Portfolio",
        description: `Deployed $${plan.capitalUSD.toLocaleString()} across ${plan.allocations.length} protocols.`,
        action: (
          <div className="flex space-x-2">
            <button 
              className="text-sm underline"
              onClick={() => {
                console.log('PlanCard: Navigating to portfolio...');
                window.location.href = '/terminal?tab=portfolio';
              }}
            >
              View Positions
            </button>
          </div>
        ),
      });
      
      onApplied?.();
    } catch (error) {
      console.error('Failed to apply plan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to apply plan to portfolio. Please try again.';
      toast({
        title: "Application Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <Card className={`shadow-sm border-border/50 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            <span>Proposed Plan</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Pending
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Plan Summary */}
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          Deploy ${(plan?.capitalUSD || 0).toLocaleString()} {plan?.asset || 'USDC'} on {plan?.chain || 'solana'} across {plan?.allocations?.length || 0} protocols
        </div>
        
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-1">Avg APY</div>
            <div className="text-lg font-semibold text-green-600">
              {avgAPY.toFixed(2)}%
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-1">Capital</div>
            <div className="text-lg font-semibold">
              ${totalAmount.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-1">Stable/Volatile</div>
            <div className="text-sm font-medium">
              {stablePercentage.toFixed(0)}%/{(100-stablePercentage).toFixed(0)}%
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-3">
            <div className="text-xs text-muted-foreground mb-1">Protocols</div>
            <div className="text-lg font-semibold flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{protocolCount}</span>
            </div>
          </div>
        </div>
        
        {/* Badges Row */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            {plan?.risk || 'medium'} risk
          </Badge>
          
          {plan?.autoRebalance && (
            <Badge variant="secondary" className="text-xs">
              <Timer className="h-3 w-3 mr-1" />
              Auto-rebalance enabled
            </Badge>
          )}
        </div>
        
        <Separator />
        
        {/* Apply Button */}
        <Button 
          onClick={handleApplyToPorfolio}
          disabled={isApplying}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white"
          size="sm"
        >
          {isApplying ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Applying...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Apply to Portfolio</span>
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
