export function useAuth() {
  // For now, return immediately without API calls to avoid loading issues
  return {
    user: { id: 'anonymous', email: null, walletConnected: false },
    isLoading: false,
    isAuthenticated: true, // Always allow access for now
  };
}
