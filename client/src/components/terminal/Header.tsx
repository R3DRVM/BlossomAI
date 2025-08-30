import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Moon, Sun, Activity } from "lucide-react";
import { Link } from "wouter";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const tabs = [
    { id: "terminal", label: "Terminal" },
    { id: "strategies", label: "Strategies" },
    { id: "analytics", label: "Analytics" },
    { id: "portfolio", label: "Portfolio" },
  ];

  return (
    <header className="terminal-panel col-span-2 flex items-center justify-between px-6 border-b border-border">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            YieldLayer
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
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live Data</span>
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
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center">
            {user?.firstName ? user.firstName.charAt(0) : "U"}
          </div>
          <span className="text-sm font-medium" data-testid="text-user-name">
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "User"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/api/logout'}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
