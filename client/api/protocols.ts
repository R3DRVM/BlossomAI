import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Return mock data for now - later this will come from database
    const mockProtocols = [
      {
        id: '1',
        name: 'Aave',
        description: 'Decentralized lending protocol',
        tvl: '1500000000',
        apy: '4.5',
        risk: 'Low',
        isActive: true
      },
      {
        id: '2',
        name: 'Compound',
        description: 'Algorithmic interest rate protocol',
        tvl: '890000000',
        apy: '3.8',
        risk: 'Low',
        isActive: true
      },
      {
        id: '3',
        name: 'Yearn Finance',
        description: 'Yield aggregator protocol',
        tvl: '567000000',
        apy: '8.2',
        risk: 'Medium',
        isActive: true
      }
    ];
    res.status(200).json(mockProtocols);
  } catch (error) {
    console.error("Error fetching protocols:", error);
    res.status(500).json({ message: "Failed to fetch protocols" });
  }
}
