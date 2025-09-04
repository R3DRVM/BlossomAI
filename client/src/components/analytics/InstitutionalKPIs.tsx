import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPositions, onPositionsChanged, PositionSnapshot } from '@/bridge/positionsStore';
import { getActiveUserId } from '@/ai/userUtils';
import { getTotalUSD } from '@/bridge/paperCustody';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Activity, 
  Target, 
  BarChart3,
  PieChart,
  AlertTriangle,
  Wallet
} from 'lucide-react';

interface InstitutionalKPIsProps {
  className?: string;
}

interface KPIData {
  grossAPY: number;
  netAPY: number;
  stableVsVolatile: { stable: number; volatile: number };
  chainExposure: Record<string, number>;
  protocolConcentration: number; // HHI
  protocolCount: number;
  positionCount: number;
  expectedRebalance: string | null;
  counterpartyConcentration: number;
  totalValue: number;
  cashValue: number;
  positionsValue: number;
  var95: number; // VaR 95% daily
  maxDrawdown: number;
  complianceRules: string[];
  riskScore: number;
  diversificationScore: number;
}

export function InstitutionalKPIs({ className }: InstitutionalKPIsProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(getActiveUserId() || 'guest');

  const loadKPIs = async () => {
    setIsLoading(true);
    try {
      const currentUserId = getActiveUserId() || 'guest';
      setUserId(currentUserId);
      
      const positions = getPositions(currentUserId);
      const cashValue = getTotalUSD(currentUserId);
      const positionsValue = positions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
      const totalValue = cashValue + positionsValue;
      
      // Calculate KPIs
      const kpiData = calculateKPIs(positions, totalValue, cashValue, positionsValue);
      setKpis(kpiData);
      
      console.log('analytics:kpis:loaded', { 
        positionCount: positions.length,
        positions: positions.map(p => ({ protocol: p.protocol, amountUSD: p.amountUSD })),
        calculatedPositionsValue: positionsValue,
        totalValue: kpiData.totalValue,
        cashValue: kpiData.cashValue,
        finalPositionsValue: kpiData.positionsValue
      });
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
    
    // Subscribe to position changes
    const off = onPositionsChanged((e) => {
      if ((e as any).detail?.userId === userId) {
        console.log('analytics:position-update-received', e);
        loadKPIs();
      }
    });
    
    // Also listen for plan applied events
    const handlePlanApplied = () => {
      console.log('analytics:plan-applied-received');
      loadKPIs();
    };
    
    window.addEventListener('blossom:plan:applied', handlePlanApplied);
    
    // Refresh every 30 seconds
    const interval = setInterval(loadKPIs, 30000);
    
    return () => {
      off();
      window.removeEventListener('blossom:plan:applied', handlePlanApplied);
      clearInterval(interval);
    };
  }, [userId]);

  const calculateKPIs = (positions: PositionSnapshot[], totalValue: number, cashValue: number, positionsValue: number): KPIData => {
    if (positions.length === 0) {
      return {
        grossAPY: 0,
        netAPY: 0,
        stableVsVolatile: { stable: 0, volatile: 0 },
        chainExposure: {},
        protocolConcentration: 0,
        protocolCount: 0,
        positionCount: 0,
        expectedRebalance: null,
        counterpartyConcentration: 0,
        totalValue,
        cashValue,
        positionsValue,
        var95: 0,
        maxDrawdown: 0,
        complianceRules: [],
        riskScore: 0,
        diversificationScore: 0
      };
    }

    // Calculate APY (weighted by position size)
    const totalPositionValue = positions.reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    
    const grossAPY = positions.reduce((sum, pos) => {
      const positionValue = pos.amountUSD || 0;
      const weight = totalPositionValue > 0 ? positionValue / totalPositionValue : 0;
      return sum + ((pos.baseAPY || 0) * weight);
    }, 0);

    const netAPY = grossAPY * 0.85; // Assume 15% fees/emissions

    // Stable vs Volatile split
    const stableAssets = ['USDC', 'USDT', 'DAI', 'FDUSD'];
    const stableValue = positions
      .filter(pos => stableAssets.includes(pos.asset))
      .reduce((sum, pos) => sum + (pos.amountUSD || 0), 0);
    const volatileValue = totalPositionValue - stableValue;

    // Chain exposure
    const chainExposure: Record<string, number> = {};
    positions.forEach(pos => {
      const value = pos.amountUSD || 0;
      chainExposure[pos.chain] = (chainExposure[pos.chain] || 0) + value;
    });

    // Protocol concentration (HHI)
    const protocolValues: Record<string, number> = {};
    positions.forEach(pos => {
      const value = pos.amountUSD || 0;
      protocolValues[pos.protocol] = (protocolValues[pos.protocol] || 0) + value;
    });

    const protocolShares = Object.values(protocolValues).map(value => 
      totalPositionValue > 0 ? (value / totalPositionValue) ** 2 : 0
    );
    const protocolConcentration = protocolShares.reduce((sum, share) => sum + share, 0) * 10000; // HHI

    // Counterparty concentration
    const topProtocol = Object.values(protocolValues).length > 0 ? Math.max(...Object.values(protocolValues)) : 0;
    const counterpartyConcentration = totalPositionValue > 0 ? (topProtocol / totalPositionValue) * 100 : 0;

    // Risk metrics (mock calculations)
    const var95 = totalPositionValue * 0.05; // 5% daily VaR
    const maxDrawdown = 0; // Mock for now

    // Risk score (0-100, higher = riskier)
    const riskScore = Math.min(100, 
      (protocolConcentration / 100) + 
      (counterpartyConcentration * 0.5) + 
      (volatileValue / totalPositionValue) * 30
    );

    // Diversification score (0-100, higher = more diversified)
    const diversificationScore = Math.max(0, 100 - (protocolConcentration / 100) - (counterpartyConcentration * 0.3));

    // Compliance rules
    const complianceRules: string[] = [];
    if (protocolConcentration > 5000) {
      complianceRules.push('High protocol concentration risk');
    }
    if (counterpartyConcentration > 50) {
      complianceRules.push('High counterparty concentration');
    }
    if (volatileValue / totalPositionValue > 0.7) {
      complianceRules.push('High volatile asset exposure');
    }
    if (positions.length < 3) {
      complianceRules.push('Low diversification');
    }

    return {
      grossAPY,
      netAPY,
      stableVsVolatile: { 
        stable: totalPositionValue > 0 ? (stableValue / totalPositionValue) * 100 : 0, 
        volatile: totalPositionValue > 0 ? (volatileValue / totalPositionValue) * 100 : 0
      },
      chainExposure,
      protocolConcentration,
      protocolCount: Object.keys(protocolValues).length,
      positionCount: positions.length,
      expectedRebalance: null, // Not implemented yet
      counterpartyConcentration,
      totalValue,
      cashValue,
      positionsValue,
      var95,
      maxDrawdown,
      complianceRules,
      riskScore,
      diversificationScore
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kpis) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No portfolio data available</p>
            <p className="text-sm">Apply a strategy to see institutional KPIs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Gross APY</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatPercentage(kpis.grossAPY)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Target className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Net APY</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatPercentage(kpis.netAPY)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Activity className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Protocols</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {kpis.protocolCount}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-3 w-3 text-orange-600" />
              <span className="text-xs font-medium text-gray-600">Positions</span>
            </div>
            <div className="text-lg font-bold text-orange-600">
              {kpis.positionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capital Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Wallet className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Total Capital</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(kpis.totalValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <Shield className="h-3 w-3 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Cash Available</span>
            </div>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrency(kpis.cashValue)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardContent className="p-2">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Deployed</span>
            </div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(kpis.positionsValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exposure Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <PieChart className="h-3 w-3 text-pink-600" />
              <span>Asset Allocation & Capital Efficiency</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {/* Asset Allocation Section */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Stable Assets</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                  {formatPercentage(kpis.stableVsVolatile.stable)}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Volatile Assets</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                  {formatPercentage(kpis.stableVsVolatile.volatile)}
                </Badge>
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-t border-border/20 my-2"></div>
            
            {/* Capital Efficiency Section */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Deployment Rate</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                  {kpis.totalValue > 0 ? formatPercentage((kpis.positionsValue / kpis.totalValue) * 100) : '0%'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">Cash Reserve</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                  {kpis.totalValue > 0 ? formatPercentage((kpis.cashValue / kpis.totalValue) * 100) : '100%'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Shield className="h-3 w-3 text-blue-600" />
              <span>Risk Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Risk Score</span>
              <Badge variant="outline" className={`text-xs ${
                kpis.riskScore > 70 ? 'bg-red-50 text-red-700 border-red-200' :
                kpis.riskScore > 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-green-50 text-green-700 border-green-200'
              }`}>
                {kpis.riskScore.toFixed(0)}/100
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Diversification</span>
              <Badge variant="outline" className={`text-xs ${
                kpis.diversificationScore > 70 ? 'bg-green-50 text-green-700 border-green-200' :
                kpis.diversificationScore > 40 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-red-50 text-red-700 border-red-200'
              }`}>
                {kpis.diversificationScore.toFixed(0)}/100
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">VaR (95% daily)</span>
              <span className="text-xs font-medium text-red-600">
                {formatCurrency(kpis.var95)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Protocol HHI</span>
              <span className="text-xs font-medium">
                {kpis.protocolConcentration.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Top Protocol %</span>
              <span className="text-xs font-medium">
                {kpis.counterpartyConcentration.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chain Exposure & Compliance - Combined Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Chain Exposure</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-1">
              {Object.entries(kpis.chainExposure).map(([chain, value]) => (
                <Badge key={chain} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                  {chain}: {formatPercentage((value / kpis.totalValue) * 100)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>Compliance & Rules</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {kpis.complianceRules.length > 0 ? (
                kpis.complianceRules.slice(0, 2).map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs text-gray-700">{rule}</span>
                  </div>
                ))
              ) : (
                <span className="text-xs text-gray-500">No compliance issues</span>
              )}
              {kpis.expectedRebalance && (
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-700">
                    Rebalance: {kpis.expectedRebalance}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}




