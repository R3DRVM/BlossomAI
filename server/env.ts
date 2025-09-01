import "dotenv/config";

// Environment validation and defaults
export interface EnvConfig {
  // CORS Configuration
  allowedOrigins: string[];
  allowedOriginRegexPreview?: string;
  
  // Demo Chat Configuration
  demoAI: boolean;
  aiStream: boolean;
  demoPersistServer: boolean;
  debugChat: boolean;
  
  // Live Data Providers
  livePrices: boolean;
  liveYields: boolean;
  liveTVL: boolean;
  liveRisk: boolean;
  
  // API Configuration
  apiBase?: string;
  port: number;
  nodeEnv: string;
  vercelEnv?: string;
}

function validateEnv(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const vercelEnv = process.env.VERCEL_ENV;
  const isDev = nodeEnv === "development";
  const isPreview = vercelEnv === "preview";
  const isProd = vercelEnv === "production";

  // CORS Validation
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map(s => s.trim()).filter(Boolean) || [];
  const allowedOriginRegexPreview = process.env.ALLOWED_ORIGIN_REGEX_PREVIEW;

  if (isPreview) {
    if (!allowedOriginRegexPreview) {
      console.warn("⚠️  VERCEL_ENV=preview but ALLOWED_ORIGIN_REGEX_PREVIEW not set");
      console.warn("   This may cause CORS issues in preview deployments");
    }
  }

  if (!isDev && allowedOrigins.length === 0 && !allowedOriginRegexPreview) {
    throw new Error(
      "❌ CORS configuration required for production:\n" +
      "   Set ALLOWED_ORIGINS or ALLOWED_ORIGIN_REGEX_PREVIEW\n" +
      "   Example: ALLOWED_ORIGINS=https://yourdomain.com"
    );
  }

  // Demo Chat Configuration (with safe defaults)
  const demoAI = process.env.DEMO_AI !== undefined 
    ? process.env.DEMO_AI === "1" 
    : isDev; // Default: true in dev, false in prod

  const aiStream = process.env.AI_STREAM !== undefined 
    ? process.env.AI_STREAM === "1" 
    : isDev; // Default: true in dev, false in prod

  const demoPersistServer = process.env.DEMO_PERSIST_SERVER === "1";
  const debugChat = process.env.DEBUG_CHAT === "1";

  // Live Data Provider Configuration (with safe defaults)
  const livePrices = process.env.LIVE_PRICES !== undefined 
    ? process.env.LIVE_PRICES === "1" 
    : true; // Default: true

  const liveYields = process.env.LIVE_YIELDS !== undefined 
    ? process.env.LIVE_YIELDS === "1" 
    : true; // Default: true

  const liveTVL = process.env.LIVE_TVL !== undefined 
    ? process.env.LIVE_TVL === "1" 
    : true; // Default: true

  const liveRisk = process.env.LIVE_RISK !== undefined 
    ? process.env.LIVE_RISK === "1" 
    : false; // Default: false (stay mock)

  // API Configuration
  const apiBase = process.env.VITE_API_BASE;
  const port = parseInt(process.env.PORT || "5050", 10);

  return {
    allowedOrigins,
    allowedOriginRegexPreview,
    demoAI,
    aiStream,
    demoPersistServer,
    debugChat,
    livePrices,
    liveYields,
    liveTVL,
    liveRisk,
    apiBase,
    port,
    nodeEnv,
    vercelEnv,
  };
}

export const env = validateEnv();

// Startup logging (no secrets)
export function logEnvConfig() {
  console.log("🔧 Environment Configuration:");
  console.log(`   NODE_ENV: ${env.nodeEnv}`);
  console.log(`   VERCEL_ENV: ${env.vercelEnv || "not set"}`);
  console.log(`   Port: ${env.port}`);
  console.log(`   CORS Origins: ${env.allowedOrigins.length} configured`);
  console.log(`   Preview Regex: ${env.allowedOriginRegexPreview ? "set" : "not set"}`);
  console.log(`   Demo AI: ${env.demoAI ? "enabled" : "disabled"}`);
  console.log(`   AI Stream: ${env.aiStream ? "enabled" : "disabled"}`);
  console.log(`   Live Data: Prices=${env.livePrices}, Yields=${env.liveYields}, TVL=${env.liveTVL}, Risk=${env.liveRisk}`);
  console.log(`   API Base: ${env.apiBase || "same-origin"}`);
  console.log("");
}
