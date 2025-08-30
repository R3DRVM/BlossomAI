import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertYieldOpportunitySchema, insertStrategySchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {

  // Auth routes - simplified for wallet-based auth later
  app.get('/api/auth/user', async (req: any, res) => {
    // For now, return a placeholder user
    // Later this will check wallet connection
    res.json({ 
      id: 'anonymous',
      email: null,
      walletConnected: false,
      message: 'Wallet not connected - connect wallet for full access'
    });
  });

  // Yield opportunities routes - public access with mock data
  app.get('/api/yield-opportunities', async (req, res) => {
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
      res.json(mockOpportunities);
    } catch (error) {
      console.error("Error fetching yield opportunities:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunities" });
    }
  });

  app.get('/api/yield-opportunities/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const opportunity = await storage.getYieldOpportunityById(id);
      if (!opportunity) {
        return res.status(404).json({ message: "Yield opportunity not found" });
      }
      res.json(opportunity);
    } catch (error) {
      console.error("Error fetching yield opportunity:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunity" });
    }
  });

  // Strategy routes - require wallet connection later
  app.get('/api/strategies', async (req: any, res) => {
    try {
      // For now, return empty array
      // Later this will check wallet connection and return user strategies
      res.json([]);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Failed to fetch strategies" });
    }
  });

  app.post('/api/strategies', async (req: any, res) => {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to create strategies" });
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Failed to create strategy" });
    }
  });

  app.get('/api/strategies/:id', async (req, res) => {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to access strategies" });
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });

  app.put('/api/strategies/:id', async (req, res) => {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to update strategies" });
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(400).json({ message: "Failed to update strategy" });
    }
  });

  app.delete('/api/strategies/:id', async (req, res) => {
    try {
      // For now, return error - requires wallet connection
      res.status(500).json({ message: "Wallet connection required to delete strategies" });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  // Portfolio routes - require wallet connection later
  app.get('/api/portfolio', async (req: any, res) => {
    try {
      // For now, return empty portfolio - requires wallet connection
      res.json({ 
        totalValue: 0,
        assets: [],
        message: 'Connect wallet to view your portfolio'
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Chat routes - require wallet connection later
  app.get('/api/chat/messages', async (req: any, res) => {
    try {
      // For now, return empty messages - requires wallet connection
      res.json([]);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/messages', async (req: any, res) => {
    try {
      // For now, return error - requires wallet connection
      res.status(401).json({ message: "Wallet connection required to send messages" });
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Failed to create chat message" });
    }
  });

  // Risk assessment routes - public access for basic info
  app.get('/api/risk-assessment/:opportunityId', async (req, res) => {
    try {
      const { opportunityId } = req.params;
      // For now, return basic risk info - detailed assessment requires wallet connection
      res.json({
        opportunityId,
        basicRisk: 'Medium',
        message: 'Connect wallet for detailed risk assessment'
      });
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });

  // Protocols routes - public access with mock data
  app.get('/api/protocols', async (req, res) => {
    try {
      // Return mock data for now - later this will come from database
      const mockProtocols = [
        {
          id: '1',
          name: 'Aave',
          description: 'Decentralized lending protocol',
          tvl: '1250000000',
          apy: '4.2',
          riskScore: 7,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Compound',
          description: 'Algorithmic interest rate protocol',
          tvl: '890000000',
          apy: '3.8',
          riskScore: 6,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Yearn Finance',
          description: 'Yield optimization protocol',
          tvl: '567000000',
          apy: '8.1',
          riskScore: 8,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(mockProtocols);
    } catch (error) {
      console.error("Error fetching protocols:", error);
      res.status(500).json({ message: "Failed to fetch protocols" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'subscribe_yields':
            // Subscribe to yield updates
            ws.send(JSON.stringify({ type: 'subscribed', data: 'yield_updates' }));
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', data: 'Blossom Terminal' }));
  });

  // Simulate real-time yield updates
  setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const updateData = {
          type: 'yield_update',
          data: {
            id: Math.random().toString(36).substr(2, 9),
            apy: (Math.random() * 20 + 5).toFixed(2), // Random APY between 5-25%
            timestamp: new Date().toISOString(),
          }
        };
        client.send(JSON.stringify(updateData));
      }
    });
  }, 10000); // Update every 10 seconds

  return httpServer;
}
