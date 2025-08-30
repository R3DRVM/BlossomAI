import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/terminal/Header";
import { YieldOverview } from "@/components/terminal/YieldOverview";
import { StrategyBuilder } from "@/components/terminal/StrategyBuilder";
import { PerformanceChart } from "@/components/terminal/PerformanceChart";
import { RiskMetrics } from "@/components/terminal/RiskMetrics";
import { ChatSidebar } from "@/components/terminal/ChatSidebar";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Terminal() {
  const [activeTab, setActiveTab] = useState("terminal");
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to YieldLayer Terminal');
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
      console.log('Disconnected from YieldLayer Terminal');
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-muted-foreground">Loading YieldLayer Terminal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

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
