import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/terminal/Header";
import { YieldOverview } from "@/components/terminal/YieldOverview";
import { StrategyBuilder } from "@/components/terminal/StrategyBuilder";
import { PerformanceChart } from "@/components/terminal/PerformanceChart";
import { RiskMetrics } from "@/components/terminal/RiskMetrics";
import { ChatSidebar } from "@/components/terminal/ChatSidebar";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("terminal");
  const { isLoading } = useAuth();

  // WebSocket connection for real-time updates
  useEffect(() => {
    // Always connect to WebSocket for real-time data

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to Blossom Terminal');
      socket.send(JSON.stringify({ type: 'subscribe_yields' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        switch (data.type) {
          case 'yield_update':
            // Handle real-time yield updates
            break;
          case 'chat_message':
            // Handle new chat messages
            break;
          case 'connected':
            console.log('WebSocket connected:', data.data);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('Disconnected from Blossom Terminal');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

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
          {/* Yield Overview Panel */}
          <YieldOverview />

          {/* Strategy Builder Panel */}
          <StrategyBuilder />

          {/* Bottom Analytics Panels */}
          <div className="bottom-panels">
            <PerformanceChart />
            <RiskMetrics />
          </div>
        </main>

        {/* Chat Sidebar */}
        <ChatSidebar />
      </div>
    </div>
  );
}
