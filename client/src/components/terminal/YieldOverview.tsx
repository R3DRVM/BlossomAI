import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Filter, TrendingUp, Shield, DollarSign } from "lucide-react";
import { YieldOpportunity } from "@shared/schema";

export function YieldOverview() {
  const { data: opportunities = [], isLoading, refetch } = useQuery<YieldOpportunity[]>({
    queryKey: ["/api/yield-opportunities"],
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
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="terminal-panel p-6">
      <div className="flex items-center justify-between mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {opportunities.slice(0, 8).map((opportunity) => (
            <Card
              key={opportunity.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer group"
              data-testid={`card-opportunity-${opportunity.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate" title={opportunity.name}>
                    {opportunity.name}
                  </span>
                  <div className={`w-6 h-6 rounded-full ${getProtocolColor(opportunity.name.split(' ')[0])}`}></div>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent font-mono">
                  {opportunity.apy}%
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span>APY • ${opportunity.tvl ? parseFloat(opportunity.tvl).toFixed(1) : '0'}M TVL</span>
                  {opportunity.riskScore && (
                    <Badge variant="outline" className={`text-xs ${getRiskColor(opportunity.riskScore)}`}>
                      Risk: {opportunity.riskScore}/10
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-1">
                  <Badge variant="secondary" className="text-xs">
                    {opportunity.category || 'DeFi'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {opportunity.asset}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
