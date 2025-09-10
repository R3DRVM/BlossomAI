/**
 * Institutional Positions Table - All professional columns with CSV export
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Download, Table as TableIcon } from 'lucide-react';
import { Position } from '@/bridge/types';
import { getPositions, onPositionsChanged, PositionSnapshot } from '@/bridge/positionsStore';
import { getActiveUserId } from '@/ai/userUtils';
import { fmtUSD, fmtPct } from '@/lib/format';
import { toNum, toFixedSafe } from '@/lib/num';

interface PositionsTableProps {
  className?: string;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  
  return (
    <Badge variant="secondary" className={`text-xs ${colors[risk as keyof typeof colors] || colors.medium}`}>
      {risk}
    </Badge>
  );
}

function formatCurrency(amount: unknown): string {
  return fmtUSD(amount as number);
}

function formatAPY(apy: unknown): string {
  return fmtPct(apy as number);
}

function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `$${(volume / 1000000000).toFixed(1)}B`;
  }
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(0)}M`;
  }
  if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(0)}K`;
  }
  return `$${volume.toLocaleString()}`;
}

export function PositionsTable({ className = '' }: PositionsTableProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const [rows, setRows] = useState<PositionSnapshot[]>([]);
  const [userId, setUserId] = useState(getActiveUserId() || 'guest');
  
  // Calculate total for percentage calculations
  const totalPositionsUSD = rows.reduce((sum, pos) => sum + toNum(pos.amountUSD, 0), 0);
  
  useEffect(() => {
    const currentUserId = getActiveUserId() || 'guest';
    setUserId(currentUserId);
    
    // Safe loading of positions by user
    let cancelled = false;
    const load = () => setRows(getPositions(currentUserId));
    load();
    const off = onPositionsChanged((e) => {
      if (!cancelled && (e as any).detail?.userId === currentUserId) load();
    });
    
    // Also listen to the legacy event for backward compatibility
    const handlePositionsCreated = () => {
      if (!cancelled) load();
    };
    
    window.addEventListener('blossom:positions:created', handlePositionsCreated);
    
    return () => {
      cancelled = true;
      off();
      window.removeEventListener('blossom:positions:created', handlePositionsCreated);
    };
  }, []);
  
  const handleExportCSV = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      const headers = ['Protocol', 'Chain', 'Asset', 'Amount USD', 'APY', 'Risk', 'Entry Time'];
      const csvContent = [
        headers.join(','),
        ...rows.map(pos => [
          pos.protocol,
          pos.chain,
          pos.asset,
          pos.amountUSD,
          pos.baseAPY,
          pos.risk || 'medium',
          pos.entryTime || new Date().toISOString()
        ].join(','))
      ].join('\n');
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `positions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "CSV Export Complete",
        description: `Downloaded ${rows.length} positions.`,
      });
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV export. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  if (!Array.isArray(rows) || rows.length === 0) {
    return (
      <Card className={`shadow-sm border-border/50 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center space-x-1.5">
            <TableIcon className="h-4 w-4 text-blue-500" />
            <span>Positions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="text-center py-6">
            <TableIcon className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
            <p className="text-sm text-muted-foreground">No active positions</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`shadow-sm border-border/50 w-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center space-x-1.5">
            <TableIcon className="h-4 w-4 text-blue-500" />
            <span>Positions</span>
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="h-6 px-2 text-xs"
          >
            {isExporting ? (
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Download className="h-3 w-3 mr-1" />
            )}
            Export CSV
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs h-8">
                <TableHead className="w-[120px] py-1">Protocol</TableHead>
                <TableHead className="w-[100px] py-1">Chain</TableHead>
                <TableHead className="w-[80px] py-1">Asset</TableHead>
                <TableHead className="w-[80px] text-right py-1">Alloc %</TableHead>
                <TableHead className="w-[100px] text-right py-1">Amount (USD)</TableHead>
                <TableHead className="w-[80px] text-right py-1">Base APY</TableHead>
                <TableHead className="w-[80px] text-right py-1">Emissions APY</TableHead>
                <TableHead className="w-[80px] text-right py-1">Net APY</TableHead>
                <TableHead className="w-[100px] text-right py-1">TVL at Entry</TableHead>
                <TableHead className="w-[100px] text-right py-1">30d Vol</TableHead>
                <TableHead className="w-[80px] py-1">Risk</TableHead>
                <TableHead className="w-[80px] text-right py-1">Fees (bps)</TableHead>
                <TableHead className="w-[120px] text-right py-1">Entry Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((position) => {
                try {
                  return (
                    <TableRow key={position.id} className="text-xs h-8">
                  <TableCell className="font-medium py-1">
                    <div className="truncate max-w-[120px]" title={position.protocol}>
                      {position.protocol}
                    </div>
                  </TableCell>
                  
                  <TableCell className="py-1">
                    <Badge variant="outline" className="text-xs capitalize">
                      {position.chain}
                    </Badge>
                  </TableCell>
                  
                  <TableCell className="font-medium py-1">
                    {position.asset}
                  </TableCell>
                  
                  <TableCell className="text-right font-medium py-1">
                    {fmtPct((position.amountUSD / Math.max(totalPositionsUSD, 1)) * 100)}
                  </TableCell>
                  
                  <TableCell className="text-right font-medium py-1">
                    {fmtUSD(position.amountUSD)}
                  </TableCell>
                  
                  <TableCell className="text-right py-1">
                    {fmtPct(position.baseAPY)}
                  </TableCell>
                  
                  <TableCell className="text-right py-1">
                    —
                  </TableCell>
                  
                  <TableCell className="text-right font-medium text-green-600 py-1">
                    {fmtPct(position.baseAPY)}
                  </TableCell>
                  
                  <TableCell className="text-right py-1">
                    —
                  </TableCell>
                  
                  <TableCell className="text-right py-1">
                    —
                  </TableCell>
                  
                  <TableCell className="py-1">
                    <RiskBadge risk={position.risk || 'medium'} />
                  </TableCell>
                  
                  <TableCell className="text-right py-1">
                    —
                  </TableCell>
                  
                  <TableCell className="text-right text-muted-foreground py-1">
                    {position.entryTime ? new Date(position.entryTime).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
                  );
                } catch (error) {
                  if (import.meta.env.VITE_DEBUG_CHAT === '1') {
                    console.error('Error rendering position row:', error, position);
                  }
                  return null;
                }
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary Footer */}
        <div className="border-t bg-muted/20 px-4 py-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>
              {rows.length} positions • 
              Total: {fmtUSD(totalPositionsUSD)} • 
              Weighted Net APY: {fmtPct(rows.length > 0 ? 
                rows.reduce((sum, p) => sum + toNum(p.baseAPY, 0), 0) / rows.length * 100 
                : 0)}
            </span>
            <span>
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
