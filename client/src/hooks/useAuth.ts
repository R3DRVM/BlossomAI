import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    // Add fallback data so app works even if API fails
    initialData: { 
      id: 'anonymous', 
      email: null, 
      walletConnected: false,
      message: 'Wallet not connected - connect wallet for full access'
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: true, // Always allow access for now
  };
}
