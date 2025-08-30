import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      // Return mock data for now - later this will come from database
      const mockOpportunities = [
        {
          id: '1',
          name: 'Aave V3 USDC',
          apy: '4.85',
          tvl: '1250.5',
          riskScore: 7,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Compound USDT',
          apy: '3.92',
          tvl: '890.2',
          riskScore: 6,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Yearn Finance ETH',
          apy: '8.45',
          tvl: '567.8',
          riskScore: 8,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Curve 3pool',
          apy: '2.15',
          tvl: '2340.1',
          riskScore: 5,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.status(200).json(mockOpportunities);
    } catch (error) {
      console.error("Error fetching yield opportunities:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunities" });
    }
  } else if (req.method === 'GET' && req.query.id) {
    try {
      const { id } = req.query;
      // For now, return a mock opportunity
      const mockOpportunity = {
        id: id as string,
        name: 'Mock Opportunity',
        apy: '5.0',
        tvl: '1000.0',
        riskScore: 6,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      res.status(200).json(mockOpportunity);
    } catch (error) {
      console.error("Error fetching yield opportunity:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunity" });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
