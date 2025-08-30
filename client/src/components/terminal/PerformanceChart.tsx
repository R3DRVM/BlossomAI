import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown } from "lucide-react";

const chartData = [
  { time: '00:00', value: 100 },
  { time: '04:00', value: 102.5 },
  { time: '08:00', value: 105.8 },
  { time: '12:00', value: 108.2 },
  { time: '16:00', value: 112.3 },
  { time: '20:00', value: 118.7 },
  { time: '24:00', value: 123.45 },
];

export function PerformanceChart() {
  const [timeframe, setTimeframe] = useState('7D');
  
  const currentValue = chartData[chartData.length - 1].value;
  const initialValue = chartData[0].value;
  const change = ((currentValue - initialValue) / initialValue) * 100;
  const isPositive = change >= 0;

  const timeframes = [
    { id: '1D', label: '1D' },
    { id: '7D', label: '7D' },
    { id: '30D', label: '30D' },
    { id: '1Y', label: '1Y' },
  ];

  return (
    <section className="terminal-panel p-6">
      <CardHeader className="p-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Portfolio Performance</CardTitle>
          <div className="flex items-center space-x-1">
            {timeframes.map((tf) => (
              <Button
                key={tf.id}
                variant={timeframe === tf.id ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeframe(tf.id)}
                className="h-7 px-2 text-xs"
                data-testid={`button-timeframe-${tf.id}`}
              >
                {tf.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-32 bg-muted/20 rounded-lg relative overflow-hidden">
          {/* SVG Chart */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120">
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--chart-2))', stopOpacity: 1 }} />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            
            {/* Grid lines */}
            <g stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3">
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1="0" y1={20 + i * 20} x2="300" y2={20 + i * 20} />
              ))}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line key={i} x1={i * 60} y1="0" x2={i * 60} y2="120" />
              ))}
            </g>
            
            {/* Area fill */}
            <path
              fill="url(#areaGradient)"
              d="M10,80 L50,70 L90,45 L130,40 L170,35 L210,25 L250,20 L290,15 L290,120 L10,120 Z"
            />
            
            {/* Main line */}
            <polyline
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              points="10,80 50,70 90,45 130,40 170,35 210,25 250,20 290,15"
            />
            
            {/* Data points */}
            {chartData.map((point, index) => (
              <circle
                key={index}
                cx={10 + index * 40}
                cy={80 - (index * 10)}
                r="3"
                fill="hsl(var(--primary))"
                className="opacity-0 hover:opacity-100 transition-opacity"
              />
            ))}
          </svg>
          
          {/* Performance indicator */}
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded px-2 py-1">
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-mono font-medium ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Current value */}
          <div className="absolute top-4 right-4 bg-background/80 backdrop-blur rounded px-2 py-1">
            <span className="text-xs font-mono font-medium bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              ${currentValue.toFixed(2)}K
            </span>
          </div>
        </div>
        
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <div className="text-sm font-medium">Total Value</div>
            <div className="text-lg font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              ${currentValue.toFixed(2)}K
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">24h Change</div>
            <div className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">P&L</div>
            <div className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              ${((currentValue - initialValue) * 1000).toFixed(0)}
            </div>
          </div>
        </div>
      </CardContent>
    </section>
  );
}
