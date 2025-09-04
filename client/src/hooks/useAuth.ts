import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simple demo user interface
interface DemoUser {
  username: string;
  createdAt: string;
}

export function useAuth() {
  const { toast } = useToast();
  
  // Initialize state from localStorage immediately to prevent flash
  const [user, setUser] = useState<DemoUser | null>(() => {
    try {
      const storedUser = localStorage.getItem('blossomai-demo-user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (error) {
      localStorage.removeItem('blossomai-demo-user');
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('blossomai-demo-user') !== null;
    } catch {
      return false;
    }
  });

  // Sync state with localStorage changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('blossomai-demo-user');
        if (storedUser && !user) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } else if (!storedUser && user) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        localStorage.removeItem('blossomai-demo-user');
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage events
    window.addEventListener('storage', checkAuth);
    
    // Add a custom event listener for sign-out to ensure all components update
    const handleSignOut = () => {
      setUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('blossomai-signout', handleSignOut);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('blossomai-signout', handleSignOut);
    };
  }, []); // Remove user dependency to prevent infinite loop

  const signIn = async (username: string) => {
    try {
      setIsLoading(true);
      
      if (!username.trim()) {
        toast({
          title: "Username Required",
          description: "Please enter a username to continue.",
          variant: "destructive",
        });
        return { success: false, error: "Username required" };
      }

      // Create demo user
      const demoUser: DemoUser = {
        username: username.trim(),
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem('blossomai-demo-user', JSON.stringify(demoUser));
      
      // Update state
      setUser(demoUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Welcome to Blossom!",
        description: `Hello ${username}! You now have access to the full terminal.`,
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: "Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Clear all user data and session
      localStorage.removeItem('blossomai-demo-user');
      
      // Clear any other session-related data
      sessionStorage.clear();
      
      // Reset state immediately
      setUser(null);
      setIsAuthenticated(false);
      
      // Dispatch custom event to notify all components about sign-out
      window.dispatchEvent(new CustomEvent('blossomai-signout'));
      
      // Show success message
      toast({
        title: "Signed Out Successfully",
        description: "You've been signed out. Please sign in again to continue.",
      });
      
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign Out Failed",
        description: "Please try again or refresh the page.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    authMode: 'demo',
  };
}
