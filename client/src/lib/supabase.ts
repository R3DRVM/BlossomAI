import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  role?: 'institutional' | 'individual' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  twitter?: string;
  linkedin?: string;
  company_size?: string;
  investment_focus?: string[];
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  created_at: string;
  updated_at: string;
}

export interface WalletConnection {
  id: string;
  user_id: string;
  wallet_address: string;
  wallet_type: 'metamask' | 'walletconnect' | 'coinbase' | 'phantom';
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'solana';
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}
