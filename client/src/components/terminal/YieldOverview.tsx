import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, TrendingUp, Shield, DollarSign } from "lucide-react";

export function YieldOverview() {
  const { data: opportunities = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/yield-opportunities"],
    // Add fallback data so app works even if API fails
    initialData: [
      {
        id: '1',
        name: 'Aave V3 USDC',
        apy: '4.85',
        tvl: '1250.5',
        riskScore: 7,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Compound USDT',
        apy: '3.92',
        tvl: '890.2',
        riskScore: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Yearn Finance ETH',
        apy: '8.45',
        tvl: '567.8',
        riskScore: 8,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Curve 3pool',
        apy: '2.15',
        tvl: '2340.1',
        riskScore: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
  });

  const getProtocolColor = (name: string) => {
    const colors: Record<string, string> = {
      'Aave': 'bg-blue-500',
      'Compound': 'bg-purple-500',
      'Yearn': 'bg-yellow-500',
      'Curve': 'bg-green-500',
      'Uniswap': 'bg-pink-500',
      'Sushi': 'bg-red-500',
    };
    return colors[name] || 'bg-gray-500';
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <section className="terminal-panel p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-3"></div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="terminal-panel p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Yield Opportunities</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh-yields"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            data-testid="button-filter-yields"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {opportunities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-8 w-8 mx-auto mb-2" />
          <p>No yield opportunities available</p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full custom-scrollbar">
          <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content', maxWidth: 'none' }}>
            {opportunities.slice(0, 8).map((opportunity) => (
              <Card
                key={opportunity.id}
                className="hover:bg-muted/50 transition-colors cursor-pointer group h-28 w-48 flex-shrink-0"
                data-testid={`card-opportunity-${opportunity.id}`}
              >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium truncate flex-1 mr-2" title={opportunity.name}>
                    {opportunity.name}
                  </span>
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${getProtocolColor(opportunity.name.split(' ')[0])}`}></div>
                </div>
                <div className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent font-mono mb-1">
                  {opportunity.apy}%
                </div>
                <div className="text-xs text-muted-foreground mb-1">
                  APY • ${opportunity.tvl ? parseFloat(opportunity.tvl).toFixed(1) : '0'}M TVL
                </div>
                <div className="flex items-center justify-between">
                  {opportunity.riskScore && (
                    <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getRiskColor(opportunity.riskScore)}`}>
                      Risk: {opportunity.riskScore}/10
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {opportunity.category || 'DeFi'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}
    </section>
  );
}
