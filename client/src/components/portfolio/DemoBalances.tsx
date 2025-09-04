import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { walletSim, DemoBalance } from '@/bridge/walletSimStore';
import { getActiveUserId } from '@/ai/userUtils';
import { clearPositions } from '@/bridge/positionsStore';
import { priceFeed } from '@/bridge/priceFeed';
import { RefreshCw, Wallet, TrendingUp } from 'lucide-react';

interface DemoBalancesProps {
  className?: string;
}

export function DemoBalances({ className }: DemoBalancesProps) {
  const [balances, setBalances] = useState<DemoBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(0);

  const loadBalances = async () => {
    setIsRefreshing(true);
    try {
      const currentBalances = walletSim.getBalances();
      setBalances(currentBalances);
      
      // Calculate total value with live prices
      const total = await priceFeed.getWalletValue(currentBalances);
      setTotalValue(total);
      setLastUpdated(Date.now());
      
      console.log('demo:balances:loaded', { 
        count: currentBalances.length, 
        totalValue: total 
      });
    } catch (error) {
      console.error('Failed to load balances:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBalances();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatAsset = (amount: number, asset: string) => {
    if (asset === 'USDC' || asset === 'USDT' || asset === 'DAI') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const getAssetColor = (asset: string) => {
    const colors: Record<string, string> = {
      'USDC': 'bg-blue-100 text-blue-800',
      'USDT': 'bg-green-100 text-green-800',
      'DAI': 'bg-yellow-100 text-yellow-800',
      'SOL': 'bg-purple-100 text-purple-800',
      'ETH': 'bg-gray-100 text-gray-800',
      'INJ': 'bg-orange-100 text-orange-800'
    };
    return colors[asset] || 'bg-gray-100 text-gray-800';
  };

  const timeSinceUpdate = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="h-5 w-5 text-pink-600" />
            <CardTitle className="text-lg">Demo Balances</CardTitle>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
              Custodial
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadBalances}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Value */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-pink-600" />
            <span className="text-sm font-medium text-gray-600">Total Portfolio Value</span>
          </div>
          <span className="text-xl font-bold text-pink-700">
            {formatCurrency(totalValue)}
          </span>
        </div>

        {/* Individual Balances */}
        <div className="space-y-2">
          {balances.map((balance) => (
            <div
              key={balance.asset}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center space-x-3">
                <Badge className={getAssetColor(balance.asset)}>
                  {balance.asset}
                </Badge>
                <span className="text-sm font-medium text-gray-900">
                  {formatAsset(balance.amount, balance.asset)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {balance.asset === 'USDC' || balance.asset === 'USDT' || balance.asset === 'DAI' 
                  ? formatCurrency(balance.amount)
                  : `~${formatCurrency(balance.amount * 100)}` // Mock conversion for demo
                }
              </span>
            </div>
          ))}
        </div>

        {/* Last Updated */}
        {lastUpdated > 0 && (
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Last updated {timeSinceUpdate}s ago
          </div>
        )}

        {/* Reset Button */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const userId = getActiveUserId() || 'guest';
              
              if (import.meta.env.VITE_DEBUG_CHAT === '1') {
                console.log('[wallet:reset]', userId, 'Clearing wallet and positions from DemoBalances');
              }
              
              walletSim.resetWallet();
              clearPositions(userId);
              loadBalances();
            }}
            className="w-full text-xs"
          >
            Reset Demo Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}



