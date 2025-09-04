
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { useEffect } from "react";

console.info('[blossom] App mount OK', new Date().toISOString());
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { getActiveUserId, logActiveUserOnce, onUserChange } from "@/ai/userUtils";
import { ensureSeed } from "@/bridge/paperCustody";
import Landing from "@/pages/landing";
import Terminal from "@/pages/terminal";
import { Strategies } from "@/pages/strategies";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { DevPanel403 } from "@/dev/DevPanel403";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading screen while checking authentication
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

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      
      {/* Protected routes - redirect to auth if not authenticated */}
      <Route path="/terminal">
        {isAuthenticated ? (
          <Terminal />
        ) : (
          <Auth />
        )}
      </Route>
      
      <Route path="/strategies">
        {isAuthenticated ? (
          <Strategies />
        ) : (
          <Auth />
        )}
      </Route>
      
      {/* Auth page */}
      <Route path="/auth" component={Auth} />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Bootstrap paper custody seeding on first mount and track user switches
  useEffect(() => {
    // Log active user once
    logActiveUserOnce();
    
    // Seed current user
    const seedCurrentUser = async () => {
      const userId = getActiveUserId() || 'guest';
      await ensureSeed(userId);
      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[app:bootstrap]', { userId, seeded: true });
      }
    };
    
    seedCurrentUser();
    
    // Track user changes and seed new users
    const cleanup = onUserChange(async (userId) => {
      await ensureSeed(userId);
      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[app:user:changed]', { userId, seeded: true });
      }
    });
    
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="blossom-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
          <DevPanel403 />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
