import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

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

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
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

  // Use the port from environment or default to 5000
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen({
    port,
    host: "localhost",
  }, () => {
    log(`🚀 Server running on http://localhost:${port}`);
    log(`📱 Development mode: ${app.get("env")}`);
    log(`🔧 API endpoints available at http://localhost:${port}/api/*`);
  });
})();
