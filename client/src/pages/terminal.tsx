import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
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
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                        Portfolio Management
                      </h1>
                      <p className="text-muted-foreground mt-2">
                        Monitor your DeFi positions and capital allocation in real-time
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Wallet className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Portfolio Overview */}
                <div className="mb-8">
                  <SnapshotCard />
                </div>
                
                {/* Positions Table */}
                <div className="space-y-6">
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
