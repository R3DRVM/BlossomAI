import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { getActiveUserId } from '@/ai/userUtils';
import { getPositions, onPositionsChanged, PositionSnapshot, debugPositions } from '@/bridge/positionsStore';
import { fmtUSD, fmtPct } from '@/lib/format';
import { toNum, toFixedSafe } from '@/lib/num';

interface ActivePositionsCardProps {
  className?: string;
}

export function ActivePositionsCard({ className = '' }: ActivePositionsCardProps) {
  const [allPositions, setAllPositions] = useState<PositionSnapshot[]>([]);
  const [userId, setUserId] = useState(getActiveUserId() || 'guest');

  useEffect(() => {
    const currentUserId = getActiveUserId() || 'guest';
    setUserId(currentUserId);
    
    // Safe loading of positions by user
    let cancelled = false;
    const load = () => setAllPositions(getPositions(currentUserId)); // Get ALL positions
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

  // Show only first 5 positions for display, but calculate totals from all
  const displayPositions = allPositions.slice(0, 5);

  if (allPositions.length === 0) {
    return (
      <Card className={`shadow-sm border-border/50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Active Positions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm mb-3">
              No active positions yet. Deploy a strategy to see positions here.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('=== DEBUG POSITIONS ===');
                debugPositions(userId);
                console.log('Current positions count:', getPositions(userId).length);
                console.log('=== END DEBUG ===');
              }}
            >
              Debug Positions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`shadow-sm border-border/50 w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Active Positions</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {allPositions.length} positions
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayPositions.map((position, index) => {
          try {
            return (
              <div key={position.id || index} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm">{position.protocol || 'Unknown'}</span>
                    <Badge variant="outline" className="text-xs">
                      {position.chain || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {position.asset || 'Unknown'} • {fmtUSD(position.amountUSD)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">
                    {fmtPct(position.baseAPY)}
                  </div>
                  <div className="text-xs text-muted-foreground">APY</div>
                </div>
              </div>
            );
          } catch (error) {
            if (import.meta.env.VITE_DEBUG_CHAT === '1') {
              console.error('Error rendering position:', error, position);
            }
            return null;
          }
        })}
        
        {/* Summary Section */}
        <div className="pt-3 border-t border-border/20 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Value:</span>
            <span className="font-medium">{fmtUSD(allPositions.reduce((sum, p) => sum + toNum(p.amountUSD, 0), 0))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Count:</span>
            <span className="font-medium text-green-600">{allPositions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avg APY:</span>
            <span className="font-medium text-green-600">{fmtPct(allPositions.length > 0 ? 
              allPositions.reduce((sum, p) => sum + toNum(p.baseAPY, 0), 0) / allPositions.length * 100 
              : 0)}</span>
          </div>
        </div>
        
        {allPositions.length >= 5 && (
          <div className="pt-2 border-t border-border/20">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Navigate to portfolio page
                window.location.href = '/terminal?tab=portfolio';
              }}
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View all in Portfolio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

