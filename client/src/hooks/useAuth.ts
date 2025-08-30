import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AUTH_MODE, DEMO_CONFIG, SUPABASE_CONFIG } from '@/lib/auth-config';

// Import Supabase only when needed
let supabase: any = null;
if (AUTH_MODE === 'supabase') {
  import('@supabase/supabase-js').then(({ createClient }) => {
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  });
}

// User interfaces
interface DemoUser {
  username: string;
  acknowledged: boolean;
  createdAt: string;
}

interface SupabaseUser {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: 'institutional' | 'individual' | 'admin';
  created_at: string;
  updated_at: string;
}

type User = DemoUser | SupabaseUser;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (AUTH_MODE === 'demo') {
      checkDemoSession();
    } else if (AUTH_MODE === 'supabase' && supabase) {
      checkSupabaseSession();
    }
  }, []);

  const checkDemoSession = () => {
    try {
      const storedUser = localStorage.getItem(DEMO_CONFIG.sessionKey);
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        // Check if session is still valid
        const sessionAge = Date.now() - new Date(userData.createdAt).getTime();
        if (sessionAge < DEMO_CONFIG.sessionDuration) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Session expired, clear it
          localStorage.removeItem(DEMO_CONFIG.sessionKey);
        }
      }
    } catch (error) {
      console.error('Error checking demo session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSupabaseSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user as SupabaseUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking Supabase session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (username: string, acknowledged: boolean) => {
    if (AUTH_MODE === 'demo') {
      return signInDemo(username, acknowledged);
    } else if (AUTH_MODE === 'supabase') {
      // This would be email/password for Supabase
      return { success: false, error: "Supabase auth not implemented yet" };
    }
  };

  const signInDemo = async (username: string, acknowledged: boolean) => {
    try {
      setIsLoading(true);
      
      if (!acknowledged) {
        toast({
          title: "Acknowledgement Required",
          description: "Please check the acknowledgment box to continue.",
          variant: "destructive",
        });
        return { success: false, error: "Acknowledgement required" };
      }

      // Create demo user
      const demoUser: DemoUser = {
        username,
        acknowledged,
        createdAt: new Date().toISOString(),
      };

      // Store in localStorage
      localStorage.setItem(DEMO_CONFIG.sessionKey, JSON.stringify(demoUser));
      
      // Update state
      setUser(demoUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Welcome to BlossomAI!",
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
      if (AUTH_MODE === 'demo') {
        localStorage.removeItem(DEMO_CONFIG.sessionKey);
      } else if (AUTH_MODE === 'supabase' && supabase) {
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Signed Out",
        description: "You've been signed out of your session.",
      });
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: "Please try again.",
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
    authMode: AUTH_MODE,
  };
}
