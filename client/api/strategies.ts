import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // For now, return empty array
      // Later this will check wallet connection and return user strategies
      res.status(200).json([]);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Failed to fetch strategies" });
    }
  } else if (req.method === 'POST') {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to create strategies" });
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Failed to create strategy" });
    }
  } else if (req.method === 'PUT') {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to update strategies" });
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(400).json({ message: "Failed to update strategy" });
    }
  } else if (req.method === 'DELETE') {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to delete strategies" });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
