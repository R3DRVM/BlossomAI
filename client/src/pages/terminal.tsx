import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/terminal/Header";
import { YieldOverview } from "@/components/terminal/YieldOverview";
import { StrategyBuilder } from "@/components/terminal/StrategyBuilder";
import { PerformanceChart } from "@/components/terminal/PerformanceChart";
import { RiskMetrics } from "@/components/terminal/RiskMetrics";
import { LazyChat } from "@/components/chat/LazyChat";
import { Strategies } from "./strategies";
import { PlanCard } from "./analytics/PlanCard";
import { AlertsCard } from "./analytics/AlertsCard";
import { ActivePositionsCard } from "@/components/analytics/ActivePositionsCard";
import { InstitutionalKPIs } from "@/components/analytics/InstitutionalKPIs";
import { SnapshotCard } from "./portfolio/SnapshotCard";
import { PositionsTable } from "./portfolio/PositionsTable";
import { getLatestPlan, hasPendingPlan } from "@/bridge/planBridge";

import { getProposedPlan, onPlanProposed } from "@/bridge/proposedPlanStore";
import { BarChart3, Wallet, Share2 } from "lucide-react";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("terminal");
  const { user, signOut, isLoading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [location] = useLocation();
  
  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    console.log('Terminal: URL params changed', { tab, location, search: window.location.search });
    if (tab && ['terminal', 'analytics', 'portfolio', 'strategies'].includes(tab)) {
      console.log('Terminal: Setting active tab to', tab);
      setActiveTab(tab);
    }
  }, [location]);
  
  // Force refresh when user changes
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, [user?.username]);
  
  // Auto-open Analytics when a plan is proposed
  useEffect(() => {
    const unsubscribe = onPlanProposed((event: CustomEvent) => {
      if (import.meta.env.VITE_ALERTS_AUTO_OPEN_ANALYTICS !== '0') { // Default to true
        setActiveTab('analytics');
        if (import.meta.env.VITE_DEBUG_CHAT === '1') {
          console.log('analytics:auto-open', { sizeUSD: event.detail.sizeUSD });
        }
      }
    });

    return unsubscribe;
  }, []);
  
  // Get current plan state
  const latestPlan = getLatestPlan();
  const currentProposedPlan = getProposedPlan(user?.username || 'guest');
  
  const handlePlanApplied = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-muted-foreground">Loading Blossom Terminal...</p>
        </div>
      </div>
    );
  }

  // Full terminal interface with all components
  return (
    <div className="min-h-screen bg-background">
      <div className="terminal-grid">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="main-content">
          {activeTab === "terminal" && (
            <>
              {/* Yield Overview Panel */}
              <YieldOverview />

              {/* Strategy Builder Panel */}
              <StrategyBuilder />

                                    {/* Bottom Analytics Panels */}
                      <div className="bottom-panels">
                        <PerformanceChart />
                        <RiskMetrics />
                      </div>
            </>
          )}

                            {activeTab === "strategies" && (
                    <div className="col-span-2">
                      <Strategies />
                    </div>
                  )}

          {activeTab === "analytics" && (
            <div className="col-span-2">
              <div className="min-h-screen bg-background p-4">
                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                        Institutional Analytics
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        Professional-grade portfolio analysis and risk management insights
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Show proposed plan if available */}
                {currentProposedPlan && currentProposedPlan.status === 'pending' && (
                  <div className="mb-4">
                    <PlanCard 
                      plan={currentProposedPlan}
                      onApplied={handlePlanApplied}
                    />
                  </div>
                )}
                
                {/* Main Analytics Grid - More compact layout */}
                <div className="space-y-4">
                  {/* Institutional KPIs - Main analytics dashboard */}
                  <InstitutionalKPIs />
                  
                  {/* Secondary Analytics Cards - Side by side */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ActivePositionsCard />
                    <AlertsCard />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="col-span-2">
              <div className="min-h-screen bg-background p-6">
                                 {/* Header */}
                 <div className="mb-4">
                   <div className="flex items-center justify-between mb-2">
                     <div>
                       <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                         Portfolio Management
                       </h1>
                       <p className="text-muted-foreground text-sm">
                         Monitor your DeFi positions and capital allocation in real-time
                       </p>
                     </div>
                     <div className="flex items-center space-x-1.5">
                       <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                         <Wallet className="h-3 w-3 mr-1" />
                         Export CSV
                       </Button>
                       <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                         <Share2 className="h-3 w-3 mr-1" />
                         Share
                       </Button>
                     </div>
                   </div>
                 </div>

                                 {/* Portfolio Overview */}
                 <div className="mb-4">
                   <SnapshotCard />
                 </div>

                 {/* API Management Section */}
                 <div className="mb-4">
                                     <Card className="w-full shadow-sm border-border/50">
                     <CardHeader className="pb-2">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                           <div className="p-1.5 bg-blue-500/10 rounded-md">
                             <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                             </svg>
                           </div>
                           <div>
                             <CardTitle className="text-base">API Management</CardTitle>
                             <p className="text-xs text-muted-foreground">
                               Manage your Blossom API keys for institutional integration
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center space-x-1.5">
                           <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-2 py-0.5">
                             Professional
                           </Badge>
                           <Button 
                             variant="outline" 
                             size="sm"
                             className="h-6 px-2 text-xs"
                             onClick={() => window.location.href = '/terminal?tab=institution'}
                           >
                             Manage Keys
                           </Button>
                         </div>
                       </div>
                     </CardHeader>
                     <CardContent className="pt-0">
                       <div className="grid md:grid-cols-3 gap-3">
                         <div className="text-center p-2 bg-muted/20 rounded-md">
                           <div className="text-base font-bold text-blue-500">3</div>
                           <div className="text-xs text-muted-foreground">Active Keys</div>
                         </div>
                         <div className="text-center p-2 bg-muted/20 rounded-md">
                           <div className="text-base font-bold text-green-500">1.2M</div>
                           <div className="text-xs text-muted-foreground">API Calls/Month</div>
                         </div>
                         <div className="text-center p-2 bg-muted/20 rounded-md">
                           <div className="text-base font-bold text-purple-500">99.9%</div>
                           <div className="text-xs text-muted-foreground">Uptime</div>
                         </div>
                       </div>
                       <div className="mt-3 p-2 bg-blue-500/5 border border-blue-500/20 rounded-md">
                         <div className="flex items-center space-x-1.5 mb-1">
                           <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                           <span className="text-xs font-medium text-blue-600">Integration Ready</span>
                         </div>
                         <p className="text-xs text-blue-600/80">
                           Connect your trading desk with real-time yield data, automated deployments, and risk monitoring.
                         </p>
                       </div>
                     </CardContent>
                   </Card>
                </div>
                
                                 {/* Positions Table */}
                 <div className="space-y-4">
                   <PositionsTable />
                 </div>
              </div>
            </div>
          )}
        </main>

                        {/* Persistent Chat Sidebar */}
                <LazyChat />
      </div>
    </div>
  );
}
