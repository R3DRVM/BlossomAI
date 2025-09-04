import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { positionsStore, PositionWithPnL } from '@/bridge/positionsStore';
import { Download, TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react';

interface PositionsTableProps {
  className?: string;
}

export function PositionsTable({ className }: PositionsTableProps) {
  const [positions, setPositions] = useState<PositionWithPnL[]>([]);
  const [openPositions, setOpenPositions] = useState<PositionWithPnL[]>([]);
  const [closedPositions, setClosedPositions] = useState<PositionWithPnL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');

  const loadPositions = async () => {
    setIsLoading(true);
    try {
      const allPositions = await positionsStore.getPositionsWithPnL();
      const open = allPositions.filter(p => p.status === 'OPEN');
      const closed = allPositions.filter(p => p.status === 'CLOSED');
      
      setPositions(allPositions);
      setOpenPositions(open);
      setClosedPositions(closed);
      
      console.log('positions:loaded', { 
        total: allPositions.length, 
        open: open.length, 
        closed: closed.length 
      });
    } catch (error) {
      console.error('Failed to load positions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPositions();
    
    // Refresh every 15 seconds for live PnL updates
    const interval = setInterval(loadPositions, 15000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getPnLColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPnLIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-3 w-3" />;
    if (value < 0) return <TrendingDown className="h-3 w-3" />;
    return null;
  };

  const handleClosePosition = async (positionId: string) => {
    const success = await positionsStore.closePosition(positionId);
    if (success) {
      loadPositions(); // Refresh the list
    }
  };

  const handleExportCSV = () => {
    const csv = positionsStore.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blossom-positions-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPositionRow = (position: PositionWithPnL) => (
    <TableRow key={position.id}>
      <TableCell className="font-medium">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {position.protocol}
          </Badge>
          <span className="text-xs text-gray-500">{position.chain}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {position.asset}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {position.units.toFixed(6)}
      </TableCell>
      <TableCell className="text-right">
        {formatCurrency(position.entryPrice)}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-1">
          <span>{formatCurrency(position.markPrice)}</span>
          <Badge 
            variant="outline" 
            className={`text-xs ${position.priceSource === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}
          >
            {position.priceSource}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className={`flex items-center justify-end space-x-1 ${getPnLColor(position.unrealizedPnL)}`}>
          {getPnLIcon(position.unrealizedPnL)}
          <span className="font-medium">{formatCurrency(position.unrealizedPnL)}</span>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <span className={`font-medium ${getPnLColor(position.unrealizedPnLPercent)}`}>
          {formatPercentage(position.unrealizedPnLPercent)}
        </span>
      </TableCell>
      <TableCell className="text-right text-xs text-gray-500">
        {formatTime(position.priceUpdated)}
      </TableCell>
      <TableCell>
        {position.status === 'OPEN' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleClosePosition(position.id)}
            className="h-7 text-xs"
          >
            Close
          </Button>
        )}
        {position.status === 'CLOSED' && (
          <Badge variant="outline" className="text-xs">
            Closed
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );

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

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Positions</span>
            <Badge variant="secondary" className="bg-pink-100 text-pink-700">
              {positions.length} total
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="open" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Open ({openPositions.length})</span>
            </TabsTrigger>
            <TabsTrigger value="closed" className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4" />
              <span>Closed ({closedPositions.length})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="open" className="mt-4">
            {openPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No open positions</p>
                <p className="text-sm">Apply a strategy to create positions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Entry Price</TableHead>
                      <TableHead className="text-right">Mark Price</TableHead>
                      <TableHead className="text-right">Unrealized PnL</TableHead>
                      <TableHead className="text-right">PnL %</TableHead>
                      <TableHead className="text-right">Updated</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openPositions.map(renderPositionRow)}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="closed" className="mt-4">
            {closedPositions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <EyeOff className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No closed positions</p>
                <p className="text-sm">Close positions to see realized PnL</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocol</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Entry Price</TableHead>
                      <TableHead className="text-right">Exit Price</TableHead>
                      <TableHead className="text-right">Realized PnL</TableHead>
                      <TableHead className="text-right">PnL %</TableHead>
                      <TableHead className="text-right">Closed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedPositions.map(renderPositionRow)}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}




