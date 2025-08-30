import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/terminal/Header";
import { YieldOverview } from "@/components/terminal/YieldOverview";
import { StrategyBuilder } from "@/components/terminal/StrategyBuilder";
import { PerformanceChart } from "@/components/terminal/PerformanceChart";
import { RiskMetrics } from "@/components/terminal/RiskMetrics";
import { ChatSidebar } from "@/components/terminal/ChatSidebar";
import { Strategies } from "./strategies";
import { BarChart3, Wallet } from "lucide-react";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("terminal");
  const { isLoading } = useAuth();

  // WebSocket removed for Vercel deployment - will add back with SSE/polling later

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

  // Always show terminal - no authentication required

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
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">Advanced analytics and insights coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="col-span-2 p-6">
              <div className="text-center py-12">
                <Wallet className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Portfolio Management</h3>
                <p className="text-muted-foreground">Portfolio tracking and management coming soon...</p>
              </div>
            </div>
          )}
        </main>

        {/* Chat Sidebar */}
        <ChatSidebar />
      </div>
    </div>
  );
}
