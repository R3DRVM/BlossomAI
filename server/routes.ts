import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertYieldOpportunitySchema, insertStrategySchema, insertChatMessageSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Yield opportunities routes
  app.get('/api/yield-opportunities', isAuthenticated, async (req, res) => {
    try {
      const opportunities = await storage.getYieldOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching yield opportunities:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunities" });
    }
  });

  app.get('/api/yield-opportunities/:id', isAuthenticated, async (req, res) => {
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

  // Strategy routes
  app.get('/api/strategies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategies = await storage.getUserStrategies(userId);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Failed to fetch strategies" });
    }
  });

  app.post('/api/strategies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const strategyData = insertStrategySchema.parse({ ...req.body, userId });
      const strategy = await storage.createStrategy(strategyData);
      res.status(201).json(strategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Failed to create strategy" });
    }
  });

  app.get('/api/strategies/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const strategy = await storage.getStrategyById(id);
      if (!strategy) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });

  app.put('/api/strategies/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const strategy = await storage.updateStrategy(id, updates);
      res.json(strategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(400).json({ message: "Failed to update strategy" });
    }
  });

  app.delete('/api/strategies/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteStrategy(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  // Portfolio routes
  app.get('/api/portfolio', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const portfolio = await storage.getUserPortfolio(userId);
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Chat routes
  app.get('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const messages = await storage.getUserChatMessages(userId, limit);
      res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageData = insertChatMessageSchema.parse({ ...req.body, userId });
      const message = await storage.createChatMessage(messageData);
      
      // Broadcast to WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'chat_message', data: message }));
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Failed to create chat message" });
    }
  });

  // Risk assessment routes
  app.get('/api/risk-assessment/:opportunityId', isAuthenticated, async (req, res) => {
    try {
      const { opportunityId } = req.params;
      const assessment = await storage.getRiskAssessment(opportunityId);
      if (!assessment) {
        return res.status(404).json({ message: "Risk assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });

  // Protocols routes
  app.get('/api/protocols', isAuthenticated, async (req, res) => {
    try {
      const protocols = await storage.getProtocols();
      res.json(protocols);
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
