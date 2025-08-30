import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // For now, return empty messages - requires wallet connection
      res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  } else if (req.method === 'POST') {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to send messages" });
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Failed to create chat message" });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
