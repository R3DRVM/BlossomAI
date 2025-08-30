import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // For now, return empty portfolio - requires wallet connection
    res.status(200).json({ 
      totalValue: 0,
      assets: [],
      message: 'Connect wallet to view your portfolio'
    });
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    res.status(500).json({ message: "Failed to fetch portfolio" });
  }
}
