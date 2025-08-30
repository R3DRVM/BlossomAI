import { useEffect, useState } from 'react';
import { User, supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user as User);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user as User);
          setIsAuthenticated(true);
          toast({
            title: "Welcome to BlossomAI!",
            description: "You've successfully signed in to your account.",
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          toast({
            title: "Signed Out",
            description: "You've been signed out of your account.",
          });
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, company?: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company: company || null,
            role: 'institutional',
          },
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Sign Out Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
}
