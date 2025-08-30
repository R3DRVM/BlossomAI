import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { opportunityId } = req.query;
    // For now, return basic risk info - detailed assessment requires wallet connection
    res.status(200).json({
      opportunityId,
      basicRisk: 'Medium',
      message: 'Connect wallet for detailed risk assessment'
    });
  } catch (error) {
    console.error("Error fetching risk assessment:", error);
    res.status(500).json({ message: "Failed to fetch risk assessment" });
  }
}
