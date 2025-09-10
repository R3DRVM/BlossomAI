import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertYieldOpportunitySchema, insertStrategySchema, insertChatMessageSchema } from "@shared/schema";
import { dataFacade } from "./data/facade.ts";
import { env } from "./env.ts";
import { getLiveBundle } from "./data/live";

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
      // For demo purposes, create a mock strategy
      const mockStrategy = {
        id: Date.now().toString(),
        name: req.body.name || 'Demo Strategy',
        description: req.body.description || 'A demo strategy for testing',
        apy: '12.5',
        riskScore: 6,
        tvl: '1000000',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.status(201).json(mockStrategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Failed to create strategy" });
    }
  });

  app.get('/api/strategies/:id', async (req, res) => {
    try {
      // For demo purposes, return a mock strategy
      const mockStrategy = {
        id: req.params.id,
        name: 'Demo Strategy',
        description: 'A demo strategy for testing purposes',
        apy: '12.5',
        riskScore: 6,
        tvl: '1000000',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(mockStrategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });

  app.put('/api/strategies/:id', async (req, res) => {
    try {
      // For demo purposes, return updated mock strategy
      const mockStrategy = {
        id: req.params.id,
        name: req.body.name || 'Updated Demo Strategy',
        description: req.body.description || 'An updated demo strategy',
        apy: '13.2',
        riskScore: 6,
        tvl: '1100000',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(mockStrategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(400).json({ message: "Failed to update strategy" });
    }
  });

  app.delete('/api/strategies/:id', async (req, res) => {
    try {
      // For demo purposes, return success
      res.json({ message: "Strategy deleted successfully", id: req.params.id });
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
      // Return initial welcome message for demo
      const initialMessages = [
        {
          id: '1',
          userId: 'blossom-ai',
          content: "Hello! I'm your DeFi strategy assistant. I can help you optimize yields, manage risk, and build strategies. What would you like to accomplish today?",
          isBot: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      res.json(initialMessages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });

  app.post('/api/chat/messages', async (req: any, res) => {
    try {
      const { content, isBot } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // For now, create a mock message response
      // Later this will be stored in database and can integrate with AI APIs
      const mockMessage = {
        id: Date.now().toString(),
        userId: 'demo-user',
        content: isBot ? content : `Echo: ${content}`,
        isBot: isBot || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json(mockMessage);
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

  // Live protocols endpoint
  app.get('/api/live/protocols', async (req, res) => {
    try {
      const { chain, asset } = req.query as { chain?: string; asset?: string };
      const b = await getLiveBundle();
      let list = b.protocols;
      if (chain) list = list.filter(p => p.chain === chain);
      if (asset) list = list.filter(p => p.asset.toUpperCase() === String(asset).toUpperCase());
      res.json({ updatedAt: b.updatedAt, protocols: list });
    } catch {
      res.status(200).json({ updatedAt: Date.now(), protocols: [] }); // graceful fallback
    }
  });

  // Live yields endpoint with protocol filtering
  app.get('/api/live-yields', async (req, res) => {
    try {
      console.log('[routes] /api/live-yields called');
      const { chain, protocols } = req.query as { chain?: string; protocols?: string };
      console.log('[routes] Query params:', { chain, protocols });
      const b = await getLiveBundle();
      console.log('[routes] Got live bundle with', b.protocols.length, 'protocols');
      let list = b.protocols;
      
      if (chain) {
        console.log('[routes] Filtering by chain:', chain);
        list = list.filter(p => p.chain === chain);
        console.log('[routes] After chain filtering:', list.length, 'protocols');
      }
      
      if (protocols) {
        const protocolList = protocols.split(',').map(p => p.trim().toLowerCase());
        list = list.filter(p => 
          protocolList.some(proto => p.protocol.toLowerCase().includes(proto))
        );
      }
      
      console.log('[routes] Returning', list.length, 'yields');
      res.json({ updatedAt: b.updatedAt, yields: list });
    } catch {
      res.status(200).json({ updatedAt: Date.now(), yields: [] }); // graceful fallback
    }
  });

  // Data API endpoints
  app.get('/api/data/prices', async (req, res) => {
    try {
      const symbols = req.query.symbols?.toString().split(',') || ['USDC', 'WETH', 'SOL'];
      const response = await dataFacade.getPrices(symbols);
      res.json(response);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });

  app.get('/api/data/yields', async (req, res) => {
    try {
      const params = {
        chain: req.query.chain?.toString(),
        assets: req.query.assets?.toString().split(','),
        limit: req.query.limit ? parseInt(req.query.limit.toString()) : 25,
        sort: req.query.sort as "apy" | "tvl" | "risk",
      };
      const response = await dataFacade.getYields(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching yields:", error);
      res.status(500).json({ message: "Failed to fetch yields" });
    }
  });

  app.get('/api/data/tvl', async (req, res) => {
    try {
      const params = {
        chain: req.query.chain?.toString(),
        protocols: req.query.protocols?.toString().split(','),
      };
      const response = await dataFacade.getTVL(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching TVL:", error);
      res.status(500).json({ message: "Failed to fetch TVL" });
    }
  });

  app.get('/api/data/risk', async (req, res) => {
    try {
      const params = {
        protocols: req.query.protocols?.toString().split(','),
      };
      const response = await dataFacade.getRiskScores(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching risk scores:", error);
      res.status(500).json({ message: "Failed to fetch risk scores" });
    }
  });

  // Chat endpoints
  app.post('/api/demo/chat', async (req, res) => {
    const startTime = Date.now();
    try {
      const { sessionId, message } = req.body;
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] POST /api/demo/chat request received', {
          sessionId: sessionId ? 'provided' : 'missing',
          messageLength: message?.length || 0,
          mode: 'JSON'
        });
      }
      
      if (!message) {
        res.locals.why403 = 'payload';
        return res.status(400).json({ 
          error: 'forbidden',
          why: 'payload',
          path: req.path,
          method: req.method,
          message: "Message parameter required" 
        });
      }
      
      // Import here to avoid circular dependencies
      const { parseIntent } = await import('./data/ai/intent-parser.ts');
      const { generateResponse } = await import('./data/ai/response-generator.ts');
      
      const intent = parseIntent(message);
      const response = await generateResponse(intent, message);
      
      const finalResponse = {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: new Date().toISOString(),
        ...response,
      };
      
      const responseSize = JSON.stringify(finalResponse).length;
      const duration = Date.now() - startTime;
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] JSON response ready', {
          responseSize,
          duration: `${duration}ms`,
          hasAllocations: !!response.allocations?.length,
          hasStrategy: !!response.strategy
        });
      }
      
      res.json(finalResponse);
    } catch (error) {
      console.error("Error processing chat:", error);
      res.status(500).json({ message: "Failed to process chat request" });
    }
  });

  // OPTIONS handler for SSE endpoint
  app.options('/api/demo/chat/stream', (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'content-type, authorization, x-requested-with');
    res.status(204).end();
  });

  app.get('/api/demo/chat/stream', async (req, res) => {
    const startTime = Date.now();
    let bytesWritten = 0;
    
    try {
      const { sessionId, message } = req.query;
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] GET /api/demo/chat/stream request received', {
          sessionId: sessionId ? 'provided' : 'missing',
          messageLength: message?.toString().length || 0,
          mode: 'SSE'
        });
      }
      
      // Check if streaming is disabled
      if (!env.aiStream) {
        if (env.debugChat) {
          console.log('[DEBUG_CHAT] SSE disabled, returning fallback response');
        }
        return res.json({ disabled: true });
      }
      
      if (!message) {
        res.locals.why403 = 'payload';
        return res.status(400).json({ 
          error: 'forbidden',
          why: 'payload',
          path: req.path,
          method: req.method,
          message: "Message parameter required" 
        });
      }
      
      // Set SSE headers with CORS headers (identical to middleware)
      const headers: Record<string, string> = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      };
      
      // Add CORS headers for SSE (same logic as middleware)
      const origin = req.headers.origin;
      if (origin) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Access-Control-Allow-Credentials'] = 'true';
        headers['Vary'] = 'Origin';
      }
      
      res.writeHead(200, headers);
      
      const writeData = (data: any) => {
        const line = `data: ${JSON.stringify(data)}\n\n`;
        bytesWritten += line.length;
        res.write(line);
      };
      
      // Import here to avoid circular dependencies
      const { parseIntent } = await import('./data/ai/intent-parser.ts');
      const { generateResponse } = await import('./data/ai/response-generator.ts');
      
      const intent = parseIntent(message.toString());
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] Starting SSE stream');
      }
      
      // Generate response (this takes time, so we get the full payload)
      const response = await generateResponse(intent, message.toString());
      
      // Simulate token streaming by splitting the plan summary
      const tokens = response.planSummary?.split(' ') || ['Response', 'generated'];
      
      for (let i = 0; i < tokens.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing
        writeData({ token: tokens[i] + (i < tokens.length - 1 ? ' ' : '') });
        
        if (env.debugChat && i === 0) {
          console.log('[DEBUG_CHAT] First SSE chunk sent');
        }
      }
      
      // Send final payload
      const finalPayload = {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: new Date().toISOString(),
        ...response,
      };
      
      writeData({ final: finalPayload });
      writeData('[DONE]');
      
      const duration = Date.now() - startTime;
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] SSE stream completed', {
          duration: `${duration}ms`,
          bytesWritten,
          tokensStreamed: tokens.length,
          endSignal: 'sent'
        });
      }
      
      res.end();
    } catch (error) {
      console.error("Error in chat stream:", error);
      const errorData = `data: ${JSON.stringify({ error: 'Failed to process request' })}\n\n`;
      bytesWritten += errorData.length;
      res.write(errorData);
      res.end();
      
      if (env.debugChat) {
        console.log('[DEBUG_CHAT] SSE stream error', {
          duration: `${Date.now() - startTime}ms`,
          bytesWritten,
          error: error instanceof Error ? error.message : 'unknown'
        });
      }
    }
  });

  app.get('/api/demo/health', async (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      providers: dataFacade.getProviderStatus(),
    });
  });

  // 403 debug endpoint (dev only)
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/debug/403s', (req, res) => {
      try {
        // Use a simple in-memory store for now
        const records = (global as any).__error403Records || [];
        res.json({
          records,
          count: records.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.json({
          records: [],
          count: 0,
          timestamp: new Date().toISOString(),
          error: 'Failed to load 403 buffer'
        });
      }
    });
  }

  // CORS diagnostic echo endpoint
  app.get('/api/cors/echo', (req, res) => {
    const origin = req.headers.origin as string | undefined;
    
    // Reuse the same normalization logic from middleware
    const normalizeOrigin = (origin: string): string => {
      try {
        const url = new URL(origin);
        return url.origin;
      } catch {
        return origin;
      }
    };
    
    // Helper to check if origin is a loopback address
    const isLoopbackOrigin = (origin: string): boolean => {
      try {
        const url = new URL(origin);
        const hostname = url.hostname.toLowerCase();
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname === '[::1]' ||
               hostname === '::1';
      } catch {
        return false;
      }
    };
    
    const DEV_ALLOWED = [
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://[::1]:5000',
      'http://localhost:5001',
      'http://127.0.0.1:5001',
      'http://[::1]:5001',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://[::1]:5173',
    ];
    
    const extra = (process.env.ALLOWED_ORIGINS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    
    const ALLOWED = new Set([...DEV_ALLOWED, ...extra]);
    
    let allowed = false;
    let matched: string | null = null;
    
    if (origin) {
      const normalizedOrigin = normalizeOrigin(origin);
      
      // Check against normalized allowed origins
      for (const allowedOrigin of Array.from(ALLOWED)) {
        const normalizedAllowed = normalizeOrigin(allowedOrigin);
        if (normalizedOrigin === normalizedAllowed) {
          allowed = true;
          matched = allowedOrigin;
          break;
        }
      }
      
      // Auto-allow any loopback origin in development if flag is set
      if (!allowed) {
        const allowAllDevOrigins = (process.env.ALLOW_ALL_DEV_ORIGINS || '1') === '1';
        const isDev = process.env.NODE_ENV !== 'production';
        
        if (allowAllDevOrigins && isDev && isLoopbackOrigin(origin)) {
          allowed = true;
          matched = 'loopback';
        }
      }
      
      // Check regex match
      if (!allowed && env.allowedOriginRegexPreview) {
        const regex = new RegExp(env.allowedOriginRegexPreview);
        if (regex.test(origin)) {
          allowed = true;
          matched = 'regex';
        }
      }
    } else {
      // No origin in dev is allowed
      allowed = process.env.NODE_ENV !== 'production';
      matched = 'no-origin-dev';
    }
    
    const echoData = {
      method: req.method,
      path: req.path,
      origin: origin || null,
      referer: req.headers.referer || null,
      host: req.headers.host,
      resolvedOrigin: origin ? normalizeOrigin(origin) : null,
      allowed,
      matched
    };
    
    res.json(echoData);
  });

  // DEBUG_403: Add debug endpoint for CSRF testing
  if (process.env.DEBUG_403 === '1') {
    app.get('/api/__debug/csrf', (req, res) => {
      try { 
        res.json({ csrfToken: null, message: 'No CSRF protection enabled' }); 
      } catch (error: any) { 
        res.json({ csrfToken: null, error: error.message }); 
      }
    });
    
    app.get('/api/__debug/ping', (req, res) => {
      const cookies: Record<string, boolean> = {};
      if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(cookie => {
          const [key] = cookie.trim().split('=');
          if (key) cookies[key] = true;
        });
      }
      
      res.json({ 
        ok: true, 
        cookies: Object.keys(cookies),
        headers: {
          origin: req.headers.origin,
          referer: req.headers.referer,
          userAgent: req.headers['user-agent']
        }
      });
    });
  }

  const httpServer = createServer(app);

  // WebSocket server temporarily disabled to fix refresh issues
  // TODO: Re-enable WebSocket once the refresh issue is resolved
  console.log('WebSocket server temporarily disabled for stability');
  
  // const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  // ... WebSocket logic here

  return httpServer;
}
