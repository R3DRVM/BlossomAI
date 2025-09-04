import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAlertsBadge } from "@/hooks/useAlertsBadge";
import { BarChart3, Moon, Sun, Activity, Wallet, Check } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const alertsUnreadCount = useAlertsBadge();
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  const tabs = [
    { id: "terminal", label: "Terminal" },
    { id: "strategies", label: "Strategies" },
    { id: "analytics", label: "Analytics" },
    { id: "portfolio", label: "Portfolio" },
    ...(import.meta.env.VITE_API_KEYS === '1' ? [{ id: "api-keys", label: "API Keys" }] : []),
  ];

  const connectWallet = async () => {
    try {
      // Mock wallet connection for now - in a real app this would integrate with Web3 providers
      const mockAddress = "0x" + Math.random().toString(16).substr(2, 40);
      setWalletAddress(mockAddress);
      setIsWalletConnected(true);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setWalletAddress("");
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <header className="terminal-panel col-span-2 flex items-center justify-between px-6 border-b border-border">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <Logo size={48} className="flex-shrink-0" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Blossom
          </span>
        </div>
        <nav className="flex items-center space-x-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              data-testid={`button-tab-${tab.id}`}
              className="relative"
            >
              {tab.label}
              {tab.id === "analytics" && alertsUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {alertsUnreadCount > 9 ? '9+' : alertsUnreadCount}
                </span>
              )}
            </Button>
          ))}
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live Data</span>
          </div>
          
          {/* Connect Wallet Button */}
          {isWalletConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="flex items-center space-x-2"
              data-testid="button-disconnect-wallet"
            >
              <Check className="h-4 w-4 text-green-500" />
              <span className="font-mono text-xs">
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={connectWallet}
              className="flex items-center space-x-2"
              data-testid="button-connect-wallet"
            >
              <Wallet className="h-4 w-4" />
              <span>Connect Wallet</span>
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        {/* User Profile */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center">
            {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="text-left">
            <span className="text-sm font-medium block" data-testid="text-user-name">
              {user?.username || "Demo User"}
            </span>
            <span className="text-xs text-muted-foreground block">
              Demo Session
            </span>
          </div>
        </div>
        
        {/* Sign Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          data-testid="button-signout"
          className="text-muted-foreground hover:text-destructive"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}
