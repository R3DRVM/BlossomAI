import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // For now, return a placeholder user
    // Later this will check wallet connection
    res.status(200).json({ 
      id: 'anonymous',
      email: null,
      walletConnected: false,
      message: 'Wallet not connected - connect wallet for full access'
    });
  } catch (error) {
    console.error("Error in auth user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
