/**
 * Alerts Card - Manages user alert rules and manual triggers
 * Shows active/inactive alerts with run check functionality
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Play, Trash2, Clock } from 'lucide-react';
import { AlertRule } from '@/bridge/alertsStore';
import { 
  listAlertRules, 
  simulateTrigger, 
  deleteAlertRule, 
  toggleAlertRule,
  formatAlertRule,
  getNextCheckTime 
} from '@/bridge/alertsStore';

interface AlertsCardProps {
  className?: string;
}

export function AlertsCard({ className = '' }: AlertsCardProps) {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Load alerts on mount
  useEffect(() => {
    loadAlerts();
  }, []);
  
  const loadAlerts = () => {
    const userAlerts = listAlertRules();
    setAlerts(userAlerts);
  };
  
  const handleRunCheck = async (alertId: string) => {
    setTriggeringId(alertId);
    
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (!alert) return;
      
      // Simulate triggering
      const updatedAlert = simulateTrigger(alertId);
      
      if (updatedAlert) {
        // Mock trigger result - in production this would check real data
        const mockTriggered = Math.random() > 0.7; // 30% chance to trigger
        
        if (mockTriggered) {
          toast({
            title: "Alert Triggered!",
            description: `${formatAlertRule(alert)} - Current conditions met`,
          });
        } else {
          toast({
            title: "Check Complete",
            description: `${formatAlertRule(alert)} - No trigger conditions met`,
          });
        }
        
        loadAlerts(); // Refresh to show updated lastTriggeredAt
      }
    } catch (error) {
      console.error('Failed to run alert check:', error);
      toast({
        title: "Check Failed",
        description: "Failed to run alert check. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTriggeringId(null);
    }
  };
  
  const handleToggleAlert = async (alertId: string) => {
    try {
      const updatedAlert = toggleAlertRule(alertId);
      if (updatedAlert) {
        toast({
          title: updatedAlert.active ? "Alert Activated" : "Alert Deactivated",
          description: formatAlertRule(updatedAlert),
        });
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      toast({
        title: "Toggle Failed",
        description: "Failed to update alert status.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const success = deleteAlertRule(alertId);
      if (success) {
        toast({
          title: "Alert Deleted",
          description: "Alert rule has been removed.",
        });
        loadAlerts();
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete alert rule.",
        variant: "destructive",
      });
    }
  };
  
  const formatLastTriggered = (alert: AlertRule): string => {
    if (!alert.lastTriggeredAt) return 'Never';
    
    const date = new Date(alert.lastTriggeredAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };
  
  if (alerts.length === 0) {
    return (
      <Card className={`shadow-sm border-border/50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <span>Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <BellOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No alerts configured yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create alerts in chat: "Alert me when USDC APR &lt; 7%"
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={`shadow-sm border-border/50 w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-500" />
            <span>Alerts</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.filter(a => a.active).length} active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {alerts.map((alert, index) => (
          <div key={alert.id}>
            {index > 0 && <Separator className="my-3" />}
            
            <div className="space-y-2">
              {/* Alert Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {alert.active ? (
                    <Bell className="h-4 w-4 text-green-500" />
                  ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm font-medium">
                    {formatAlertRule(alert)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAlert(alert.id)}
                    className="h-7 w-7 p-0"
                  >
                    {alert.active ? (
                      <BellOff className="h-3 w-3" />
                    ) : (
                      <Bell className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {/* Alert Details */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <span>Check: {alert.cadence}</span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Last: {formatLastTriggered(alert)}</span>
                  </span>
                </div>
                
                {alert.active && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRunCheck(alert.id)}
                    disabled={triggeringId === alert.id}
                    className="h-6 px-2 text-xs bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                  >
                    {triggeringId === alert.id ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Run Check
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
