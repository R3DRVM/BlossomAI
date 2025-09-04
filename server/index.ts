import 'dotenv/config';
import express, { type Request, Response, NextFunction } from 'express';
import cors from 'cors';
import onFinished from 'on-finished';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { env } from "./env";
import { devReqLogMiddleware } from "./mw/dev-req-log";

// Extend Request interface to include traceId
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
    }
  }
}

// Simple in-memory 403 record storage
interface Error403Record {
  ts: string;
  method: string;
  path: string;
  origin: string | null;
  referer: string | null;
  host: string | null;
  ip: string | null;
  userAgent: string | null;
  why: string;
  traceId: string;
}

function add403Record(record: Error403Record) {
  if (!(global as any).__error403Records) {
    (global as any).__error403Records = [];
  }
  (global as any).__error403Records.push(record);
  if ((global as any).__error403Records.length > 50) {
    (global as any).__error403Records.shift();
  }
}

const app = express();
const DEV = process.env.NODE_ENV !== 'production';
const ALLOW_ALL = DEV || process.env.ALLOW_ALL_DEV_ORIGINS === '1' || process.env.DISABLE_CORS_DEV === '1';

// 0) Print env snapshot for sanity
console.log('[server] DEV=', DEV, 'ALLOW_ALL=', ALLOW_ALL, 'PORT=', process.env.PORT);

// 1) Dev CORS: never block in dev
app.use(cors({
  origin: (_origin, cb) => ALLOW_ALL ? cb(null, true) : cb(null, _origin || false),
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['content-type','authorization','x-requested-with'],
  optionsSuccessStatus: 200,
}));

// 2) Dev-only "no 403" pre-guard: if a handler tries to 403 HTML routes, short-circuit earlier
if (ALLOW_ALL) {
  app.use((req, res, next) => {
    // Let API flow normally
    if (req.url.startsWith('/api')) return next();
    // Only GET HTML pages get this safety
    const accept = (req.headers['accept'] || '') as string;
    const wantsHtml = accept.includes('text/html');
    if (!wantsHtml || req.method !== 'GET') return next();
    // Mark request so downstream won't 403 these
    (req as any).__no403 = true;
    next();
  });
}

// 3) OPTIONS helper
app.options('*', (_req, res) => res.sendStatus(200));

// Add dev request logging middleware
app.use(devReqLogMiddleware);

// 403 recorder middleware (early - before CORS)
app.use((req: any, res: Response, next: NextFunction) => {
  // Initialize 403 reason tracking
  res.locals.why403 = null;
  
  // Wrap res.status to capture 403s
  const originalStatus = res.status.bind(res);
  res.status = function(code: number) {
    if (code === 403) {
      // If this request is marked as no-403, don't record it
      if (req.__no403) {
        console.warn('[403:blocked] Request marked as __no403, not recording');
        return originalStatus(200); // Override 403 with 200 for dev
      }
      
      const record: Error403Record = {
        ts: new Date().toISOString(),
        method: req.method,
        path: req.path,
        origin: req.headers.origin as string || null,
        referer: req.headers.referer as string || null,
        host: req.headers.host as string || null,
        ip: req.ip || req.connection.remoteAddress || null,
        userAgent: req.headers['user-agent'] as string || null,
        why: res.locals.why403 || 'unknown',
        traceId: req.traceId
      };
      
      // Add to ring buffer
      add403Record(record);
      
      console.warn(`[403:block] ${record.why} | ${record.method} ${record.path} | origin=${record.origin} | ip=${record.ip} | traceId=${req.traceId}`);
    }
    return originalStatus(code);
  };
  
  next();
});

// DEBUG_403: Add trust proxy and diagnostic headers
if (process.env.DEBUG_403 === '1') {
  app.set('trust proxy', 1);
  
  // Add diagnostic header to all responses
  app.use((req, res, next) => {
    res.set('x-app-layer', 'api');
    next();
  });
  
  // 403 diagnostic logging
  app.use((req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode === 403) {
        console.error(JSON.stringify({
          at: new Date().toISOString(),
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          origin: req.headers.origin,
          referer: req.headers.referer,
          hasCookie: Boolean(req.headers.cookie),
          ua: req.headers['user-agent'],
          ip: req.ip,
        }));
      }
    });
    next();
  });
}

// Trace ID middleware (add to all responses)
app.use((req, res, next) => {
  const traceId = req.headers['x-trace-id'] as string || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.set('x-trace-id', traceId);
  req.traceId = traceId;
  next();
});

// Request logger (dev): method path status origin
if (process.env.NODE_ENV !== 'production') {
  app.use((req: any, res, next) => {
    const started = Date.now();
    onFinished(res, () => {
      const ms = Date.now() - started;
      console.log('[REQ]', req.method, req.path, res.statusCode, `${ms}ms`,
        `origin=${req.headers.origin || 'none'}`, `host=${req.headers.host || 'none'}`, `traceId=${req.traceId}`);
    });
    next();
  });
}

// Old CORS middleware removed - using bulletproof CORS setup above

// Dev: expose active switches
app.get('/api/debug/vars', (_req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    allowAllDevOrigins: process.env.ALLOW_ALL_DEV_ORIGINS,
    disableCorsDev: process.env.DISABLE_CORS_DEV,
    port: process.env.PORT,
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate environment on startup
  try {
    const { logEnvConfig } = await import("./env");
    logEnvConfig();
  } catch (error) {
    console.error("❌ Environment validation failed:");
    console.error(error);
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development mode
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the port from environment
  const PORT = Number(process.env.PORT) || 5050;
  server.listen({
    port: PORT,
    host: "localhost",
  }, () => {
    log(`🚀 Server running on http://localhost:${PORT}`);
    log(`📱 Development mode: ${env.nodeEnv}`);
    log(`🔧 API endpoints available at http://localhost:${PORT}/api/*`);
    log(`🌐 CORS allowed origins: ${env.allowedOrigins.join(', ')}`);
  });
})();
