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
  const { user, signOut } = useAuth();

  // WebSocket connection for real-time updates (with fallback for Vercel)
  useEffect(() => {
    // Try WebSocket first, fallback to polling if it fails
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let socket: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('Connected to Blossom Terminal via WebSocket');
        socket?.send(JSON.stringify({ type: 'subscribe_yields' }));
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
        console.log('WebSocket disconnected, falling back to polling');
        // Fallback to polling if WebSocket fails
        fallbackInterval = setInterval(() => {
          // Simulate real-time updates
          console.log('Polling for updates...');
        }, 30000); // Poll every 30 seconds
      };

      socket.onerror = (error) => {
        console.log('WebSocket error, falling back to polling:', error);
        // Fallback to polling if WebSocket fails
        fallbackInterval = setInterval(() => {
          // Simulate real-time updates
          console.log('Polling for updates...');
        }, 30000); // Poll every 30 seconds
      };
    } catch (error) {
      console.log('WebSocket not available, using polling fallback');
      // Fallback to polling if WebSocket fails
      fallbackInterval = setInterval(() => {
        // Simulate real-time updates
        console.log('Polling for updates...');
      }, 30000); // Poll every 30 seconds
    }

    return () => {
      if (socket) {
        socket.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
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
