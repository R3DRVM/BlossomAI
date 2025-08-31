
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Terminal from "@/pages/terminal";
import { Strategies } from "@/pages/strategies";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, hasLocalAuth } = useAuth();
  const [, setLocation] = useLocation();
  
  // Use the computed value from useAuth to avoid race conditions
  const isActuallyAuthenticated = isAuthenticated || hasLocalAuth;

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
        {isActuallyAuthenticated ? (
          <Terminal />
        ) : (
          <Auth onAuthSuccess={() => setLocation('/terminal')} />
        )}
      </Route>
      
      <Route path="/strategies">
        {isActuallyAuthenticated ? (
          <Strategies />
        ) : (
          <Auth onAuthSuccess={() => setLocation('/strategies')} />
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="blossom-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
