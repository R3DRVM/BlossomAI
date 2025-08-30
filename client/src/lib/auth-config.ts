// Authentication Configuration
// Set this to 'demo' for localStorage-based auth, 'supabase' for production auth

export const AUTH_MODE = 'demo' as 'demo' | 'supabase';

// Supabase Configuration (only used when AUTH_MODE === 'supabase')
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
};

// Demo Configuration (only used when AUTH_MODE === 'demo')
export const DEMO_CONFIG = {
  sessionKey: 'blossomai-demo-user',
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// Feature Flags
export const FEATURES = {
  // Demo mode features
  demo: {
    usernameOnly: true,
    noPassword: true,
    acknowledgmentRequired: true,
    localStorage: true,
  },
  
  // Production mode features
  production: {
    emailPassword: true,
    userProfiles: true,
    walletConnections: true,
    database: true,
    emailVerification: true,
  },
} as const;

// Get current feature set based on auth mode
export const getCurrentFeatures = () => {
  return AUTH_MODE === 'demo' ? FEATURES.demo : FEATURES.production;
};

// Check if a specific feature is enabled
export const isFeatureEnabled = (feature: keyof typeof FEATURES.demo | keyof typeof FEATURES.production) => {
  const features = getCurrentFeatures();
  return feature in features && features[feature as keyof typeof features];
};
