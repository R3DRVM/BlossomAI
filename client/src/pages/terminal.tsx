import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/terminal/Header";
import { YieldOverview } from "@/components/terminal/YieldOverview";
import { StrategyBuilder } from "@/components/terminal/StrategyBuilder";
import { PerformanceChart } from "@/components/terminal/PerformanceChart";
import { RiskMetrics } from "@/components/terminal/RiskMetrics";
import { LazyChat } from "@/components/chat/LazyChat";
import { Strategies } from "./strategies";
import { BarChart3, Wallet } from "lucide-react";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("terminal");
  const { user, signOut, isLoading } = useAuth();

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
            <div className="col-span-2 p-6">
              <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
              <p className="text-muted-foreground">Advanced analytics and insights will be displayed here.</p>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="col-span-2 p-6">
              <h2 className="text-2xl font-bold mb-4">Portfolio Management</h2>
              <p className="text-muted-foreground">Portfolio tracking and management will be displayed here.</p>
            </div>
          )}
        </main>

                        {/* Persistent Chat Sidebar */}
                <LazyChat />
      </div>
    </div>
  );
}
