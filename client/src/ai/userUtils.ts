/**
 * User identity utilities for chat scoping
 */

export function getActiveUserId(): string {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'guest';
  }
  
  try {
    // Try to read from demo auth first (if available)
    const demoUser = localStorage.getItem('demo.auth.user');
    if (demoUser) {
      const parsed = JSON.parse(demoUser);
      if (parsed.username) {
        return parsed.username;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  try {
    // Check for blossomai-demo-user (current auth system)
    const blossomaiUser = localStorage.getItem('blossomai-demo-user');
    if (blossomaiUser) {
      const parsed = JSON.parse(blossomaiUser);
      if (parsed.username) {
        return parsed.username;
      }
    }
  } catch (e) {
    // Ignore parsing errors
  }
  
  try {
    // Fallback to blossom user storage
    const blossomUser = localStorage.getItem('blossom.user');
    if (blossomUser) {
      return blossomUser;
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  // Final fallback
  return 'guest';
}

// Log active user on boot (once)
let hasLoggedUser = false;
export function logActiveUserOnce(): void {
  if (!hasLoggedUser && import.meta.env.VITE_DEBUG_CHAT === '1') {
    const userId = getActiveUserId();
    console.info('[user] active', userId);
    hasLoggedUser = true;
  }
}

export function onUserChange(callback: (userId: string) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}; // No-op cleanup
  }
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'demo.auth.user' || e.key === 'blossom.user' || e.key === 'blossomai-demo-user') {
      callback(getActiveUserId());
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
