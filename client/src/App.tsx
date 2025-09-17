
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { useEffect, useState } from "react";

console.info('[blossom] App mount OK', new Date().toISOString());
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
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
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for auth changes to force re-render
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('[Router] Auth change event received, forcing re-render');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('blossomai-auth-changed', handleAuthChange);
    return () => window.removeEventListener('blossomai-auth-changed', handleAuthChange);
  }, []);

  // Debug logging
  console.log('[Router] Auth state:', { isAuthenticated, isLoading, user, path: location.pathname, forceUpdate });

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
    <Switch key={`${isAuthenticated}-${user?.username || 'no-user'}-${forceUpdate}`}>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/landing" component={Landing} />
      
      {/* Mobile chat route - premium mobile experience */}
      <Route path="/m">
        {isAuthenticated ? (
          <Terminal />
        ) : (
          <Auth />
        )}
      </Route>
      
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
      <ThemeProvider>
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
