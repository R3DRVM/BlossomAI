/**
 * Portfolio Snapshot Card - Shows latest portfolio snapshot with KPIs and mini charts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Wallet, TrendingUp, Building2, PieChart, Shield, Timer } from 'lucide-react';

import { getActiveUserId } from '@/ai/userUtils';
import { ensureSeed, getWallet, getTotalUSD, onWalletChanged } from '@/bridge/paperCustody';
import { getPositions, onPositionsChanged, PositionSnapshot } from '@/bridge/positionsStore';
import { fmtUSD, fmtPct } from '@/lib/format';
import { toNum, toFixedSafe } from '@/lib/num';
import { useEffect, useState } from 'react';

interface SnapshotCardProps {
  className?: string;
}

// Simple donut chart component using CSS
function MiniDonutChart({ 
  data, 
  title, 
  size = 80 
}: { 
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
  size?: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let accumulatedPercentage = 0;
  
  const segments = data.map(item => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0;
    const startAngle = (accumulatedPercentage / 100) * 360;
    const endAngle = ((accumulatedPercentage + percentage) / 100) * 360;
    accumulatedPercentage += percentage;
    
    return {
      ...item,
      percentage,
      startAngle,
      endAngle
    };
  });
  
  return (
    <div className="text-center">
      <div className="relative mx-auto mb-2" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size/2}
            cy={size/2}
            r={size/2 - 8}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="16"
          />
          {segments.map((segment, index) => {
            const radius = size/2 - 8;
            const circumference = 2 * Math.PI * radius;
            const strokeDasharray = (segment.percentage / 100) * circumference;
            const strokeDashoffset = -((segment.startAngle / 360) * circumference);
            
            return (
              <circle
                key={index}
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${strokeDasharray} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'all 0.3s ease' }}
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs font-medium">{data.length}</div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="space-y-1">
        {segments.slice(0, 3).map((segment, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate max-w-[60px]">{segment.label}</span>
            </div>
            <span className="text-muted-foreground">{toFixedSafe(segment.percentage, 0, '0')}%</span>
          </div>
        ))}
        {segments.length > 3 && (
          <div className="text-xs text-muted-foreground">+{segments.length - 3} more</div>
        )}
      </div>
    </div>
  );
}

export function SnapshotCard({ className = '' }: SnapshotCardProps) {
  const [userId, setUserId] = useState(getActiveUserId() || 'guest');
  const [cashUSD, setCashUSD] = useState(0);
  const [cashBalances, setCashBalances] = useState({ USDC: 0, SOL: 0 });
  const [positions, setPositions] = useState<PositionSnapshot[]>([]);
  
  // Calculate total capital from cash + active positions
  const totalPositionsUSD = positions.reduce((s, p) => s + toNum(p.amountUSD, 0), 0);
  const totalAvailableCapital = cashUSD + totalPositionsUSD;

  // Update wallet data
  const updateWalletData = (currentUserId: string) => {
    const wallet = getWallet(currentUserId);
    const totalUSD = getTotalUSD(currentUserId);
    setCashUSD(totalUSD);
    setCashBalances({ USDC: wallet.USDC, SOL: wallet.SOL });
    
    // Update positions
    const currentUserPositions = getPositions(currentUserId);
    setPositions(currentUserPositions);
  };

  // Ensure seeding on mount and subscribe to wallet changes
  useEffect(() => {
    const currentUserId = getActiveUserId() || 'guest';
    setUserId(currentUserId);
    
    // Ensure user has seeded balances
    ensureSeed(currentUserId).then(() => {
      updateWalletData(currentUserId);
    });

    // Safe loading of positions by user
    let cancelled = false;
    const load = () => setPositions(getPositions(currentUserId));
    load();
    const off = onPositionsChanged((e) => {
      if (!cancelled && (e as any).detail?.userId === currentUserId) load();
    });

        // Subscribe to wallet changes
    const cleanup = onWalletChanged((detail) => {
      if (detail.userId === currentUserId) {
        updateWalletData(currentUserId);
      }
    });
    
    const handlePositionsCreated = () => {
      updateWalletData(currentUserId);
    };
    
    window.addEventListener('blossom:positions:created', handlePositionsCreated);

    return () => {
      cancelled = true;
      cleanup();
      off();
      window.removeEventListener('blossom:positions:created', handlePositionsCreated);
    };
  }, []);
  
  // Prepare protocol distribution data from positions
  const protocolData = positions.reduce((acc, pos) => {
    acc[pos.protocol] = (acc[pos.protocol] || 0) + toNum(pos.amountUSD, 0);
    return acc;
  }, {} as Record<string, number>);
  
  const protocolChartData = Object.entries(protocolData)
    .sort(([,a], [,b]) => b - a)
    .map(([protocol, amount], index) => ({
      label: protocol,
      value: amount,
      color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
    }));
  
  // Prepare chain distribution data from positions
  const chainData = positions.reduce((acc, pos) => {
    acc[pos.chain] = (acc[pos.chain] || 0) + toNum(pos.amountUSD, 0);
    return acc;
  }, {} as Record<string, number>);
  
  const chainChartData = Object.entries(chainData)
    .sort(([,a], [,b]) => b - a)
    .map(([chain, amount], index) => ({
      label: chain,
      value: amount,
      color: `hsl(${(index * 120) % 360}, 60%, 45%)`
    }));
  
  return (
    <Card className={`shadow-sm border-border/50 w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center space-x-1.5">
            <Wallet className="h-4 w-4 text-green-500" />
            <span>Portfolio Snapshot</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs px-2 py-0.5">
            {positions.length} positions
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Total Capital</div>
            <div className="text-sm font-semibold text-green-600">
              {fmtUSD(totalAvailableCapital)}
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Weighted APY</div>
            <div className="text-sm font-semibold text-green-600">
              {fmtPct(positions.length > 0 ? 
                positions.reduce((sum, p) => sum + toNum(p.baseAPY, 0), 0) / positions.length * 100 
                : 0)}
            </div>
          </div>
        </div>
        
        {/* Capital Breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Cash Available</div>
            <div className="text-sm font-semibold text-blue-600">
              {fmtUSD(cashUSD)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalAvailableCapital > 0 ? ((cashUSD / totalAvailableCapital) * 100).toFixed(1) : '0'}% of capital
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Deployed</div>
            <div className="text-sm font-semibold text-purple-600">
              {fmtUSD(totalPositionsUSD)}
            </div>
            <div className="text-xs text-muted-foreground">
              {totalAvailableCapital > 0 ? ((totalPositionsUSD / totalAvailableCapital) * 100).toFixed(1) : '0'}% of capital
            </div>
          </div>
        </div>
        
        {/* Position Summary */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Active Positions</div>
            <div className="text-sm font-medium text-green-600">
              {positions.length} positions
            </div>
          </div>
          
          <div className="bg-background rounded-lg border p-1.5">
            <div className="text-xs text-muted-foreground mb-0.5">Protocols</div>
            <div className="text-sm font-medium text-blue-600">
              {new Set(positions.map(p => p.protocol)).size} protocols
            </div>
          </div>
        </div>
        
        {/* Mini Charts */}
        <div className="grid grid-cols-2 gap-3">
          <MiniDonutChart
            data={protocolChartData}
            title="Protocols"
            size={80}
          />
          
          <MiniDonutChart
            data={chainChartData}
            title="Chains"
            size={80}
          />
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            <Building2 className="h-3 w-3 mr-1" />
            {positions.length} protocols
          </Badge>
          
          {positions.length > 0 && (
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              <Timer className="h-3 w-3 mr-1" />
              Active positions
            </Badge>
          )}
          
          {positions.length === 0 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5">
              <Shield className="h-3 w-3 mr-1" />
              No positions yet
            </Badge>
          )}
        </div>
        
        <Separator />
        
        {/* Summary Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Total Capital:</span>
            <span>{fmtUSD(totalAvailableCapital)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Available:</span>
            <span>{fmtUSD(cashUSD)}</span>
          </div>
          <div className="flex justify-between">
            <span>Positions Value:</span>
            <span>{fmtUSD(totalPositionsUSD)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
