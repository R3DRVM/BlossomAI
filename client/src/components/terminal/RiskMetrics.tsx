import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, AlertTriangle, TrendingDown, Activity } from "lucide-react";

interface RiskMetric {
  name: string;
  value: number; // 0-100 scale
  level: 'low' | 'medium' | 'high';
  description: string;
}

const riskMetrics: RiskMetric[] = [
  {
    name: "Smart Contract Risk",
    value: 25,
    level: "low",
    description: "Audited protocols with strong security track record"
  },
  {
    name: "Liquidity Risk",
    value: 45,
    level: "medium", 
    description: "Adequate liquidity but may face constraints during market stress"
  },
  {
    name: "Impermanent Loss",
    value: 20,
    level: "low",
    description: "Low exposure to volatile asset pairs"
  },
  {
    name: "Protocol Risk",
    value: 55,
    level: "medium",
    description: "Some dependency on newer DeFi protocols"
  }
];

export function RiskMetrics() {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getBadgeVariant = (level: string) => {
    switch (level) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Smart Contract Risk':
        return <Shield className="h-4 w-4" />;
      case 'Liquidity Risk':
        return <Activity className="h-4 w-4" />;
      case 'Impermanent Loss':
        return <TrendingDown className="h-4 w-4" />;
      case 'Protocol Risk':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const overallRisk = Math.round(riskMetrics.reduce((sum, metric) => sum + metric.value, 0) / riskMetrics.length);
  const overallLevel = overallRisk <= 30 ? 'low' : overallRisk <= 60 ? 'medium' : 'high';

  return (
    <section className="terminal-panel p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Risk Assessment</CardTitle>
          <Badge variant={getBadgeVariant(overallLevel)} data-testid="badge-overall-risk">
            Overall: {overallLevel.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Overall Risk Score */}
        <div className="mb-6 p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Risk Score</span>
            <span className={`text-lg font-bold ${getRiskColor(overallLevel)}`}>
              {overallRisk}/100
            </span>
          </div>
          <Progress value={overallRisk} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Based on weighted analysis of all risk factors
          </p>
        </div>

        {/* Individual Risk Metrics */}
        <div className="space-y-4">
          {riskMetrics.map((metric, index) => (
            <div key={index} className="space-y-2" data-testid={`risk-metric-${index}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={getRiskColor(metric.level)}>
                    {getIcon(metric.name)}
                  </div>
                  <span className="text-sm font-medium">{metric.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(metric.level)} transition-all duration-300`}
                      style={{ width: `${metric.value}%` }}
                    ></div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getRiskColor(metric.level)} border-current`}
                  >
                    {metric.level}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {metric.description}
              </p>
            </div>
          ))}
        </div>

        {/* Risk Recommendations */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
            Recommendations
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Consider diversifying across more established protocols</li>
            <li>• Monitor liquidity levels during high volatility periods</li>
            <li>• Set up automated stop-loss triggers for risk management</li>
            <li>• Review position sizing relative to overall portfolio</li>
          </ul>
        </div>
      </CardContent>
    </section>
  );
}
