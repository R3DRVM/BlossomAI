import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Bell, Check } from "lucide-react";
import { alertsStore, type AlertRule } from "@/bridge/alertsStore";

interface AlertsPanelProps {
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

export function AlertsPanel({ isOpen: initialOpen = false, onToggle }: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(initialOpen);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial alerts
    const loadAlerts = () => {
      const allAlerts = alertsStore.listAlerts();
      setAlerts(allAlerts);
      setUnreadCount(alertsStore.unreadCount());
    };

    loadAlerts();

    // Listen for new alerts
    const handleNewAlert = () => {
      loadAlerts();
    };

    // Listen for badge updates
    const handleBadgeUpdate = (e: CustomEvent) => {
      setUnreadCount(e.detail.count);
    };

    window.addEventListener('blossom:alert', handleNewAlert);
    window.addEventListener('alerts:badge:update', handleBadgeUpdate as EventListener);

    return () => {
      window.removeEventListener('blossom:alert', handleNewAlert);
      window.removeEventListener('alerts:badge:update', handleBadgeUpdate as EventListener);
    };
  }, []);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
    console.log('alerts:panel', newState ? 'open' : 'close');
  };

  const handleMarkAllRead = () => {
    alertsStore.markAllRead();
    setAlerts(alertsStore.listAlerts());
    setUnreadCount(0);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getAlertTypeColor = (type: AlertRule['type']) => {
    switch (type) {
      case 'apy_threshold': return 'bg-pink-100 text-pink-800';
      case 'apy_drop': return 'bg-red-100 text-red-800';
      case 'rebalance': return 'bg-blue-100 text-blue-800';
      case 'risk_alert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="mb-4 border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-pink-600" />
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-pink-100 text-pink-800 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs text-pink-600 hover:text-pink-700"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="text-xs"
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No alerts configured yet. Create alerts through chat to monitor your DeFi positions.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.readAt ? 'bg-gray-50 border-gray-200' : 'bg-white border-pink-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getAlertTypeColor(alert.type)}`}>
                        {alert.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(alert.createdAt)}
                      </span>
                    </div>
                    {!alert.readAt && (
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 mb-1">
                      {alert.asset} on {alert.chain}
                    </p>
                    <p className="text-gray-600 mb-2">
                      {alert.condition}
                    </p>
                    <p className="text-xs text-gray-500">
                      Check frequency: {alert.frequency}
                    </p>
                  </div>

                  {alert.plan && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">
                        Proposed Plan:
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {alert.plan.summary}
                      </p>
                      {alert.plan.allocations.length > 0 && (
                        <div className="space-y-1">
                          {alert.plan.allocations.slice(0, 3).map((allocation, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-gray-600">
                                {allocation.asset} → {allocation.protocol}
                              </span>
                              <span className="text-gray-500">
                                {allocation.estApy.toFixed(2)}% APY
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

