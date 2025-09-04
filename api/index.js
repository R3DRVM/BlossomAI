var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/env.ts
var env_exports = {};
__export(env_exports, {
  env: () => env,
  logEnvConfig: () => logEnvConfig
});
import "dotenv/config";
function validateEnv() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const vercelEnv = process.env.VERCEL_ENV;
  const isDev = nodeEnv === "development";
  const isPreview = vercelEnv === "preview";
  const isProd = vercelEnv === "production";
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) || [];
  const allowedOriginRegexPreview = process.env.ALLOWED_ORIGIN_REGEX_PREVIEW;
  if (isPreview) {
    if (!allowedOriginRegexPreview) {
      console.warn("\u26A0\uFE0F  VERCEL_ENV=preview but ALLOWED_ORIGIN_REGEX_PREVIEW not set");
      console.warn("   This may cause CORS issues in preview deployments");
    }
  }
  if (!isDev && allowedOrigins.length === 0 && !allowedOriginRegexPreview) {
    throw new Error(
      "\u274C CORS configuration required for production:\n   Set ALLOWED_ORIGINS or ALLOWED_ORIGIN_REGEX_PREVIEW\n   Example: ALLOWED_ORIGINS=https://yourdomain.com"
    );
  }
  const demoAI = process.env.DEMO_AI !== void 0 ? process.env.DEMO_AI === "1" : isDev;
  const aiStream = process.env.AI_STREAM !== void 0 ? process.env.AI_STREAM === "1" : isDev;
  const demoPersistServer = process.env.DEMO_PERSIST_SERVER === "1";
  const debugChat = process.env.DEBUG_CHAT === "1";
  const livePrices = process.env.LIVE_PRICES !== void 0 ? process.env.LIVE_PRICES === "1" : true;
  const liveYields = process.env.LIVE_YIELDS !== void 0 ? process.env.LIVE_YIELDS === "1" : true;
  const liveTVL = process.env.LIVE_TVL !== void 0 ? process.env.LIVE_TVL === "1" : true;
  const liveRisk = process.env.LIVE_RISK !== void 0 ? process.env.LIVE_RISK === "1" : false;
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
    vercelEnv
  };
}
function logEnvConfig() {
  console.log("\u{1F527} Environment Configuration:");
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
var env;
var init_env = __esm({
  "server/env.ts"() {
    "use strict";
    env = validateEnv();
  }
});

// server/data/normalize.ts
function normalizeDefiLlamaPrices(rawData) {
  if (!rawData || typeof rawData !== "object") return [];
  return Object.entries(rawData).map(([symbol, data]) => ({
    symbol: symbol.toUpperCase(),
    price: parseFloat(data.usd) || 0,
    change24h: parseFloat(data.usd_24h_change) || 0,
    marketCap: parseFloat(data.usd_market_cap) || void 0,
    volume24h: parseFloat(data.usd_24h_vol) || void 0
  }));
}
function normalizeDefiLlamaYields(rawData) {
  if (!Array.isArray(rawData)) return [];
  return rawData.map((item) => ({
    id: item.pool || item.id || `yield-${Date.now()}`,
    name: item.name || item.pool || "Unknown",
    protocol: item.protocol || "Unknown",
    chain: item.chain || "ethereum",
    apy: parseFloat(item.apy) || parseFloat(item.apr) || 0,
    tvl: parseFloat(item.tvlUsd) || parseFloat(item.tvl) || 0,
    riskScore: calculateRiskScore(item),
    assets: Array.isArray(item.underlyingTokens) ? item.underlyingTokens.map((t) => t.symbol || t) : [item.symbol || "Unknown"],
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
function normalizeDefiLlamaTVL(rawData) {
  if (!Array.isArray(rawData)) return [];
  return rawData.map((item) => ({
    id: item.id || `tvl-${Date.now()}`,
    name: item.name || "Unknown",
    chain: item.chain || "ethereum",
    tvl: parseFloat(item.tvl) || 0,
    change24h: parseFloat(item.change_1d) || 0,
    protocols: Array.isArray(item.protocols) ? item.protocols.map((p) => p.name || p) : []
  }));
}
function calculateRiskScore(item) {
  const tvl = parseFloat(item.tvlUsd) || parseFloat(item.tvl) || 0;
  const age = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) / (1e3 * 60 * 60 * 24) : 0;
  let score = 5;
  if (tvl > 1e6) score -= 1;
  if (tvl > 1e7) score -= 1;
  if (tvl < 1e5) score += 1;
  if (age > 30) score -= 1;
  if (age < 7) score += 1;
  return Math.max(1, Math.min(10, score));
}
function generateMockPrices(symbols) {
  return symbols.map((symbol) => ({
    symbol,
    price: Math.random() * 1e3 + 1,
    change24h: (Math.random() - 0.5) * 20,
    marketCap: Math.random() * 1e9,
    volume24h: Math.random() * 1e8
  }));
}
function generateMockYields(chain = "solana", assets = ["USDC", "SOL"]) {
  const protocols2 = ["Raydium", "Orca", "Jupiter", "Marinade", "Lido"];
  return assets.flatMap(
    (asset) => protocols2.map((protocol, i) => ({
      id: `mock-${asset}-${protocol}-${i}`,
      name: `${asset} ${protocol} Pool`,
      protocol,
      chain,
      apy: Math.random() * 15 + 2,
      // 2-17% APY
      tvl: Math.random() * 1e7 + 1e5,
      riskScore: Math.floor(Math.random() * 5) + 3,
      // 3-7 risk score
      assets: [asset],
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    }))
  );
}
function generateMockTVL(chain = "solana") {
  const protocols2 = ["Raydium", "Orca", "Jupiter", "Marinade", "Lido", "Meteora"];
  return protocols2.map((protocol, i) => ({
    id: `mock-tvl-${protocol}`,
    name: protocol,
    chain,
    tvl: Math.random() * 1e9 + 1e7,
    change24h: (Math.random() - 0.5) * 10,
    protocols: [protocol]
  }));
}
function generateMockRiskScores(protocols2) {
  return protocols2.map((protocol) => ({
    protocol,
    riskScore: Math.floor(Math.random() * 5) + 3,
    factors: ["Smart Contract Risk", "Liquidity Risk", "Market Risk"].slice(0, Math.floor(Math.random() * 3) + 1),
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
  }));
}
var init_normalize = __esm({
  "server/data/normalize.ts"() {
    "use strict";
  }
});

// server/data/cache.ts
var Cache, cache;
var init_cache = __esm({
  "server/data/cache.ts"() {
    "use strict";
    Cache = class {
      store = /* @__PURE__ */ new Map();
      get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
          this.store.delete(key);
          return null;
        }
        return entry.data;
      }
      set(key, data, ttl) {
        this.store.set(key, {
          data,
          timestamp: Date.now(),
          ttl
        });
      }
      delete(key) {
        this.store.delete(key);
      }
      clear() {
        this.store.clear();
      }
      size() {
        return this.store.size;
      }
    };
    cache = new Cache();
  }
});

// server/data/providers/live/defillama.ts
var DefiLlamaProvider, defiLlamaProvider;
var init_defillama = __esm({
  "server/data/providers/live/defillama.ts"() {
    "use strict";
    init_normalize();
    init_cache();
    DefiLlamaProvider = class {
      baseUrl = "https://api.llama.fi";
      timeout = 1500;
      maxRetries = 1;
      circuitBreaker = {
        failures: 0,
        lastFailure: 0,
        threshold: 3,
        resetTimeout: 3e4
        // 30 seconds
      };
      async makeRequest(endpoint, cacheKey, ttl) {
        const cached = cache.get(cacheKey);
        if (cached) return cached;
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
          const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
          if (timeSinceLastFailure < this.circuitBreaker.resetTimeout) {
            throw new Error("Circuit breaker open - too many recent failures");
          }
          this.circuitBreaker.failures = 0;
        }
        const url = `${this.baseUrl}${endpoint}`;
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent": "BlossomAI/1.0"
              }
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            cache.set(cacheKey, data, ttl);
            this.circuitBreaker.failures = 0;
            return data;
          } catch (error) {
            this.circuitBreaker.failures++;
            this.circuitBreaker.lastFailure = Date.now();
            if (attempt === this.maxRetries) {
              throw error;
            }
            const delay = Math.random() * 100 + 50;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
        throw new Error("Max retries exceeded");
      }
      async getPrices(symbols) {
        try {
          const cacheKey = `prices:${symbols.sort().join(",")}`;
          const rawData = await this.makeRequest(`/v2/simple/price?ids=${symbols.join(",")}`, cacheKey, 15e3);
          const data = normalizeDefiLlamaPrices(rawData);
          return {
            schemaVersion: "v1",
            provenance: "live",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            data
          };
        } catch (error) {
          console.error("DefiLlama price fetch failed:", error);
          throw error;
        }
      }
      async getYields(params) {
        try {
          const { chain = "solana", limit = 25 } = params;
          const cacheKey = `yields:${chain}:${limit}`;
          const rawData = await this.makeRequest(`/v2/yields?chain=${chain}`, cacheKey, 12e4);
          let data = normalizeDefiLlamaYields(rawData);
          if (params.assets) {
            data = data.filter(
              (yieldItem) => params.assets.some(
                (asset) => yieldItem.assets.some(
                  (yieldAsset) => yieldAsset.toLowerCase().includes(asset.toLowerCase())
                )
              )
            );
          }
          if (params.sort) {
            data.sort((a, b) => {
              switch (params.sort) {
                case "apy":
                  return b.apy - a.apy;
                case "tvl":
                  return b.tvl - a.tvl;
                case "risk":
                  return a.riskScore - b.riskScore;
                default:
                  return 0;
              }
            });
          }
          if (limit) {
            data = data.slice(0, limit);
          }
          return {
            schemaVersion: "v1",
            provenance: "live",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            data,
            total: data.length,
            filters: params
          };
        } catch (error) {
          console.error("DefiLlama yield fetch failed:", error);
          throw error;
        }
      }
      async getTVL(params) {
        try {
          const { chain = "solana" } = params;
          const cacheKey = `tvl:${chain}`;
          const rawData = await this.makeRequest(`/v2/chains`, cacheKey, 6e4);
          let data = normalizeDefiLlamaTVL(rawData);
          data = data.filter(
            (item) => item.chain.toLowerCase() === chain.toLowerCase()
          );
          if (params.protocols) {
            data = data.filter(
              (item) => params.protocols.some(
                (protocol) => item.name.toLowerCase().includes(protocol.toLowerCase())
              )
            );
          }
          return {
            schemaVersion: "v1",
            provenance: "live",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            data,
            total: data.length,
            filters: params
          };
        } catch (error) {
          console.error("DefiLlama TVL fetch failed:", error);
          throw error;
        }
      }
      async getRiskScores(params) {
        return {
          schemaVersion: "v1",
          provenance: "mock",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data: []
        };
      }
    };
    defiLlamaProvider = new DefiLlamaProvider();
  }
});

// server/data/providers/mock/prices.ts
var MockPriceProvider, mockPriceProvider;
var init_prices = __esm({
  "server/data/providers/mock/prices.ts"() {
    "use strict";
    init_normalize();
    MockPriceProvider = class {
      async getPrices(symbols) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        const data = generateMockPrices(symbols);
        return {
          schemaVersion: "v1",
          provenance: "mock",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data
        };
      }
    };
    mockPriceProvider = new MockPriceProvider();
  }
});

// server/data/providers/mock/yields.ts
var MockYieldProvider, mockYieldProvider;
var init_yields = __esm({
  "server/data/providers/mock/yields.ts"() {
    "use strict";
    init_normalize();
    MockYieldProvider = class {
      async getYields(params) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        const { chain = "solana", assets = ["USDC", "SOL"], limit = 25 } = params;
        let data = generateMockYields(chain, assets);
        if (params.sort) {
          data.sort((a, b) => {
            switch (params.sort) {
              case "apy":
                return b.apy - a.apy;
              case "tvl":
                return b.tvl - a.tvl;
              case "risk":
                return a.riskScore - b.riskScore;
              default:
                return 0;
            }
          });
        }
        if (limit) {
          data = data.slice(0, limit);
        }
        return {
          schemaVersion: "v1",
          provenance: "mock",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data,
          total: data.length,
          filters: params
        };
      }
    };
    mockYieldProvider = new MockYieldProvider();
  }
});

// server/data/providers/mock/tvl.ts
var MockTVLProvider, mockTVLProvider;
var init_tvl = __esm({
  "server/data/providers/mock/tvl.ts"() {
    "use strict";
    init_normalize();
    MockTVLProvider = class {
      async getTVL(params) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        const { chain = "solana" } = params;
        let data = generateMockTVL(chain);
        if (params.protocols) {
          data = data.filter(
            (item) => params.protocols.some(
              (protocol) => item.name.toLowerCase().includes(protocol.toLowerCase())
            )
          );
        }
        return {
          schemaVersion: "v1",
          provenance: "mock",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data,
          total: data.length,
          filters: params
        };
      }
    };
    mockTVLProvider = new MockTVLProvider();
  }
});

// server/data/providers/mock/risk.ts
var MockRiskProvider, mockRiskProvider;
var init_risk = __esm({
  "server/data/providers/mock/risk.ts"() {
    "use strict";
    init_normalize();
    MockRiskProvider = class {
      async getRiskScores(params) {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 + 50));
        const { protocols: protocols2 = ["Raydium", "Orca", "Jupiter"] } = params;
        const data = generateMockRiskScores(protocols2);
        return {
          schemaVersion: "v1",
          provenance: "mock",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          data
        };
      }
    };
    mockRiskProvider = new MockRiskProvider();
  }
});

// server/data/facade.ts
var DataFacade, dataFacade;
var init_facade = __esm({
  "server/data/facade.ts"() {
    "use strict";
    init_env();
    init_defillama();
    init_prices();
    init_yields();
    init_tvl();
    init_risk();
    DataFacade = class {
      priceProvider;
      yieldProvider;
      tvlProvider;
      riskProvider;
      constructor() {
        this.priceProvider = env.livePrices ? defiLlamaProvider : mockPriceProvider;
        this.yieldProvider = env.liveYields ? defiLlamaProvider : mockYieldProvider;
        this.tvlProvider = env.liveTVL ? defiLlamaProvider : mockTVLProvider;
        this.riskProvider = env.liveRisk ? defiLlamaProvider : mockRiskProvider;
      }
      async getPrices(symbols) {
        try {
          return await this.priceProvider.getPrices(symbols);
        } catch (error) {
          console.warn("Live price provider failed, falling back to mock:", error);
          return await mockPriceProvider.getPrices(symbols);
        }
      }
      async getYields(params) {
        try {
          return await this.yieldProvider.getYields(params);
        } catch (error) {
          console.warn("Live yield provider failed, falling back to mock:", error);
          return await mockYieldProvider.getYields(params);
        }
      }
      async getTVL(params) {
        try {
          return await this.tvlProvider.getTVL(params);
        } catch (error) {
          console.warn("Live TVL provider failed, falling back to mock:", error);
          return await mockTVLProvider.getTVL(params);
        }
      }
      async getRiskScores(params) {
        try {
          return await this.riskProvider.getRiskScores(params);
        } catch (error) {
          console.warn("Live risk provider failed, falling back to mock:", error);
          return await mockRiskProvider.getRiskScores(params);
        }
      }
      // Helper method to get provider status
      getProviderStatus() {
        return {
          prices: env.livePrices ? "live" : "mock",
          yields: env.liveYields ? "live" : "mock",
          tvl: env.liveTVL ? "live" : "mock",
          risk: env.liveRisk ? "live" : "mock"
        };
      }
    };
    dataFacade = new DataFacade();
  }
});

// server/data/ai/intent-parser.ts
var intent_parser_exports = {};
__export(intent_parser_exports, {
  parseIntent: () => parseIntent
});
function parseIntent(message) {
  const lowerMessage = message.toLowerCase();
  const assetPatterns = [
    /\b(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/gi,
    /\b(\d+)\s*(usdc|usdt|dai|eth|weth|sol|btc|wbtc|matic|avax|bnb)\b/gi
  ];
  const assets = [];
  assetPatterns.forEach((pattern) => {
    const matches = lowerMessage.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        const asset = match.replace(/\d+\s*/, "").toUpperCase();
        if (!assets.includes(asset)) {
          assets.push(asset);
        }
      });
    }
  });
  let chain;
  if (lowerMessage.includes("solana") || lowerMessage.includes("sol")) {
    chain = "solana";
  } else if (lowerMessage.includes("ethereum") || lowerMessage.includes("eth")) {
    chain = "ethereum";
  } else if (lowerMessage.includes("polygon") || lowerMessage.includes("matic")) {
    chain = "polygon";
  }
  let amount;
  let percentage;
  const amountMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(usdc|usdt|dai|eth|weth|sol|btc|wbtc)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }
  const percentMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    percentage = parseFloat(percentMatch[1]);
  }
  let apy;
  const apyMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:apy|apr)/);
  if (apyMatch) {
    apy = parseFloat(apyMatch[1]);
  }
  if (!apy) {
    const percentMatch2 = lowerMessage.match(/(\d+(?:\.\d+)?)\s*%/);
    if (percentMatch2) {
      apy = parseFloat(percentMatch2[1]);
    }
  }
  let action = "discover";
  if (lowerMessage.includes("deploy") || lowerMessage.includes("allocate") || lowerMessage.includes("invest")) {
    action = "allocate";
  } else if (lowerMessage.includes("rebalance") || lowerMessage.includes("re-balance")) {
    action = "rebalance";
  } else if (lowerMessage.includes("notify") || lowerMessage.includes("alert") || lowerMessage.includes("drop") || lowerMessage.includes("spike") || lowerMessage.includes("set up")) {
    action = "notify";
  } else if (lowerMessage.includes("list") || lowerMessage.includes("show") || lowerMessage.includes("find")) {
    action = "list";
  }
  let riskLevel;
  if (lowerMessage.includes("low risk") || lowerMessage.includes("safe")) {
    riskLevel = "low";
  } else if (lowerMessage.includes("high risk") || lowerMessage.includes("risky")) {
    riskLevel = "high";
  } else if (lowerMessage.includes("medium risk")) {
    riskLevel = "medium";
  }
  return {
    action,
    assets: assets.length > 0 ? assets : void 0,
    chain,
    amount,
    percentage,
    apy,
    riskLevel
  };
}
var init_intent_parser = __esm({
  "server/data/ai/intent-parser.ts"() {
    "use strict";
  }
});

// server/data/ai/response-generator.ts
var response_generator_exports = {};
__export(response_generator_exports, {
  generateResponse: () => generateResponse
});
async function generateResponse(intent, userMessage) {
  const { action, assets, chain, amount, percentage, apy, riskLevel } = intent;
  const defaultAssets = assets || ["USDC", "SOL"];
  const defaultChain = chain || "solana";
  const defaultAmount = amount || 1e4;
  const defaultPercentage = percentage || 100;
  const yieldData = await dataFacade.getYields({
    chain: defaultChain,
    assets: defaultAssets,
    limit: 10,
    sort: "apy"
  });
  const tvlData = await dataFacade.getTVL({ chain: defaultChain });
  let allocations = [];
  let planSummary = "";
  switch (action) {
    case "allocate":
      allocations = yieldData.data.slice(0, 3).map((yieldItem, index2) => ({
        asset: yieldItem.assets[0] || "USDC",
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        amountPct: index2 === 0 ? 50 : index2 === 1 ? 30 : 20,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore)
      }));
      planSummary = `Deploying ${defaultAmount} ${defaultAssets.join(", ")} across top ${defaultChain} yield sources with ${allocations[0].estApy.toFixed(2)}% APY focus.`;
      break;
    case "rebalance":
      allocations = yieldData.data.slice(0, 3).map((yieldItem, index2) => ({
        asset: yieldItem.assets[0] || "USDC",
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        amountPct: 33.33,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore)
      }));
      planSummary = `Rebalancing portfolio across ${defaultChain} protocols for optimal yield distribution.`;
      break;
    case "notify":
      allocations = [];
      const threshold = apy || 50;
      const checkInterval = userMessage.toLowerCase().includes("5 minutes") ? "5 minutes" : "15 minutes";
      const isDropAlert = userMessage.toLowerCase().includes("drop") || userMessage.toLowerCase().includes("below");
      const isSpikeAlert = userMessage.toLowerCase().includes("spike") || userMessage.toLowerCase().includes("above");
      let alertType, alertCondition;
      if (isDropAlert) {
        alertType = "drops below";
        alertCondition = `${threshold}%`;
      } else if (isSpikeAlert) {
        alertType = "spikes";
        alertCondition = `${threshold}% above the 7-day baseline`;
      } else {
        alertType = "spikes";
        alertCondition = `${threshold}% above the 7-day baseline`;
      }
      planSummary = `\u2705 Alert configured! I'll monitor ${defaultAssets.join(", ")} APR on ${defaultChain} and notify you when it ${alertType} ${alertCondition}. Checking every ${checkInterval}.`;
      break;
    case "list":
    case "discover":
      allocations = yieldData.data.slice(0, 5).map((yieldItem) => ({
        asset: yieldItem.assets[0] || "USDC",
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore)
      }));
      planSummary = `Found ${allocations.length} high-yield opportunities on ${defaultChain} with APY ranging ${allocations[0].estApy.toFixed(2)}% to ${allocations[allocations.length - 1].estApy.toFixed(2)}%.`;
      break;
    default:
      allocations = yieldData.data.slice(0, 3).map((yieldItem) => ({
        asset: yieldItem.assets[0] || "USDC",
        chain: yieldItem.chain,
        protocol: yieldItem.protocol,
        estApy: yieldItem.apy,
        tvl: yieldItem.tvl,
        riskLabel: getRiskLabel(yieldItem.riskScore)
      }));
      planSummary = `Analyzing ${defaultChain} yield opportunities for your ${defaultAssets.join(", ")} holdings.`;
  }
  const totalValue = defaultAmount;
  const avgApy = allocations.length > 0 ? allocations.reduce((sum, alloc) => sum + alloc.estApy, 0) / allocations.length : 0;
  const avgRisk = allocations.length > 0 ? allocations.reduce((sum, alloc) => sum + getRiskScore(alloc.riskLabel), 0) / allocations.length : 0;
  const diversification = Math.min(allocations.length / 3, 1);
  const triggers = [];
  if (action === "notify") {
    const threshold = apy || 50;
    triggers.push({
      type: "apy_drop",
      condition: `${defaultAssets.join(", ")} APR spikes ${threshold}% above 7d baseline`,
      threshold
    });
  } else {
    if (apy) {
      triggers.push({
        type: "apy_drop",
        condition: `APY drops below ${apy}%`,
        threshold: apy
      });
    }
    if (action === "rebalance") {
      triggers.push({
        type: "rebalance",
        condition: "Weekly portfolio rebalance",
        threshold: 7
      });
    }
  }
  let strategy;
  if (action === "notify") {
    strategy = {
      id: `alert-${Date.now()}`,
      name: `${defaultAssets.join(", ")} APR Alert`,
      description: `Monitor ${defaultAssets.join(", ")} APR on ${defaultChain} for ${apy || 50}% spikes above 7-day baseline`,
      steps: [
        {
          step: 1,
          action: "Monitor",
          details: `Track ${defaultAssets.join(", ")} APR on ${defaultChain} every 5 minutes`
        },
        {
          step: 2,
          action: "Calculate",
          details: "Compare current APR to 7-day rolling average baseline"
        },
        {
          step: 3,
          action: "Alert",
          details: `Notify when APR spikes ${apy || 50}% above baseline threshold`
        }
      ]
    };
  } else {
    strategy = {
      id: `strategy-${Date.now()}`,
      name: `${action.charAt(0).toUpperCase() + action.slice(1)} ${defaultChain} Strategy`,
      description: `Automated ${action} strategy for ${defaultAssets.join(", ")} on ${defaultChain}`,
      steps: [
        {
          step: 1,
          action: "Analyze",
          details: `Scan ${defaultChain} protocols for optimal yield opportunities`
        },
        {
          step: 2,
          action: "Allocate",
          details: `Distribute funds across selected protocols based on risk-adjusted returns`
        },
        {
          step: 3,
          action: "Monitor",
          details: "Track performance and trigger rebalancing when thresholds are met"
        }
      ]
    };
  }
  return {
    planSummary,
    allocations,
    portfolioStats: {
      totalValue,
      avgApy,
      riskScore: avgRisk,
      diversification
    },
    triggers,
    strategy
  };
}
function getRiskLabel(score) {
  if (score <= 3) return "Low";
  if (score <= 6) return "Medium";
  return "High";
}
function getRiskScore(label) {
  switch (label.toLowerCase()) {
    case "low":
      return 3;
    case "medium":
      return 6;
    case "high":
      return 9;
    default:
      return 5;
  }
}
var init_response_generator = __esm({
  "server/data/ai/response-generator.ts"() {
    "use strict";
    init_facade();
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import cors from "cors";
import onFinished from "on-finished";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertPortfolioPositionSchema: () => insertPortfolioPositionSchema,
  insertProtocolSchema: () => insertProtocolSchema,
  insertRiskAssessmentSchema: () => insertRiskAssessmentSchema,
  insertStrategySchema: () => insertStrategySchema,
  insertUserSchema: () => insertUserSchema,
  insertYieldOpportunitySchema: () => insertYieldOpportunitySchema,
  portfolioPositions: () => portfolioPositions,
  protocols: () => protocols,
  riskAssessments: () => riskAssessments,
  sessions: () => sessions,
  strategies: () => strategies,
  users: () => users,
  yieldOpportunities: () => yieldOpportunities
});
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var protocols = pgTable("protocols", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  website: varchar("website"),
  iconUrl: varchar("icon_url"),
  chain: varchar("chain").notNull(),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow()
});
var yieldOpportunities = pgTable("yield_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  protocolId: varchar("protocol_id").notNull().references(() => protocols.id),
  name: varchar("name").notNull(),
  asset: varchar("asset").notNull(),
  apy: decimal("apy", { precision: 5, scale: 2 }).notNull(),
  tvl: decimal("tvl", { precision: 20, scale: 2 }),
  riskScore: integer("risk_score"),
  // 1-10 scale
  category: varchar("category"),
  // lending, farming, staking, etc.
  minimumDeposit: decimal("minimum_deposit", { precision: 20, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var strategies = pgTable("strategies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  configuration: jsonb("configuration").notNull(),
  // Strategy flow as JSON
  targetApy: decimal("target_apy", { precision: 5, scale: 2 }),
  riskLevel: varchar("risk_level"),
  // low, medium, high
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var portfolioPositions = pgTable("portfolio_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  strategyId: varchar("strategy_id").references(() => strategies.id),
  opportunityId: varchar("opportunity_id").notNull().references(() => yieldOpportunities.id),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  entryPrice: decimal("entry_price", { precision: 20, scale: 8 }),
  currentValue: decimal("current_value", { precision: 20, scale: 8 }),
  unrealizedPnl: decimal("unrealized_pnl", { precision: 20, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isBot: boolean("is_bot").default(false),
  metadata: jsonb("metadata"),
  // For storing additional context
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var riskAssessments = pgTable("risk_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id").notNull().references(() => yieldOpportunities.id),
  smartContractRisk: integer("smart_contract_risk"),
  // 1-10 scale
  liquidityRisk: integer("liquidity_risk"),
  impermanentLossRisk: integer("impermanent_loss_risk"),
  protocolRisk: integer("protocol_risk"),
  overallScore: decimal("overall_score", { precision: 3, scale: 1 }),
  lastAssessed: timestamp("last_assessed").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true
});
var insertProtocolSchema = createInsertSchema(protocols).omit({
  id: true,
  createdAt: true
});
var insertYieldOpportunitySchema = createInsertSchema(yieldOpportunities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPortfolioPositionSchema = createInsertSchema(portfolioPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});
var insertRiskAssessmentSchema = createInsertSchema(riskAssessments).omit({
  id: true,
  lastAssessed: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var pool = null;
var db = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema: schema_exports });
} else {
  console.warn("\u26A0\uFE0F  No DATABASE_URL set - running in demo mode without database");
}

// server/storage.ts
import { eq, desc, and } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Protocol operations
  async getProtocols() {
    return await db.select().from(protocols);
  }
  async createProtocol(protocol) {
    const [newProtocol] = await db.insert(protocols).values(protocol).returning();
    return newProtocol;
  }
  // Yield opportunity operations
  async getYieldOpportunities() {
    return await db.select().from(yieldOpportunities).where(eq(yieldOpportunities.isActive, true)).orderBy(desc(yieldOpportunities.apy));
  }
  async getYieldOpportunityById(id) {
    const [opportunity] = await db.select().from(yieldOpportunities).where(eq(yieldOpportunities.id, id));
    return opportunity;
  }
  async createYieldOpportunity(opportunity) {
    const [newOpportunity] = await db.insert(yieldOpportunities).values(opportunity).returning();
    return newOpportunity;
  }
  async updateYieldOpportunityApy(id, apy) {
    await db.update(yieldOpportunities).set({ apy, updatedAt: /* @__PURE__ */ new Date() }).where(eq(yieldOpportunities.id, id));
  }
  // Strategy operations
  async getUserStrategies(userId) {
    return await db.select().from(strategies).where(and(eq(strategies.userId, userId), eq(strategies.isActive, true))).orderBy(desc(strategies.createdAt));
  }
  async createStrategy(strategy) {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }
  async getStrategyById(id) {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy;
  }
  async updateStrategy(id, updates) {
    const [updatedStrategy] = await db.update(strategies).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(strategies.id, id)).returning();
    return updatedStrategy;
  }
  async deleteStrategy(id) {
    await db.update(strategies).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where(eq(strategies.id, id));
  }
  // Portfolio operations
  async getUserPortfolio(userId) {
    return await db.select().from(portfolioPositions).where(eq(portfolioPositions.userId, userId)).orderBy(desc(portfolioPositions.createdAt));
  }
  async createPortfolioPosition(position) {
    const [newPosition] = await db.insert(portfolioPositions).values(position).returning();
    return newPosition;
  }
  async updatePortfolioPosition(id, updates) {
    const [updatedPosition] = await db.update(portfolioPositions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(portfolioPositions.id, id)).returning();
    return updatedPosition;
  }
  // Chat operations
  async getUserChatMessages(userId, limit = 50) {
    return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.createdAt)).limit(limit);
  }
  async getChatMessages() {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt));
  }
  async createChatMessage(message) {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }
  // Risk assessment operations
  async getRiskAssessment(opportunityId) {
    const [assessment] = await db.select().from(riskAssessments).where(eq(riskAssessments.opportunityId, opportunityId));
    return assessment;
  }
  async createRiskAssessment(assessment) {
    const [newAssessment] = await db.insert(riskAssessments).values(assessment).returning();
    return newAssessment;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
init_facade();
init_env();

// server/data/live.ts
import fetch2 from "node-fetch";

// server/data/protocols.map.ts
var PROTOCOLS = [
  // Injective
  { protocol: "HYDRO", chain: "injective", projectHint: "hydro" },
  { protocol: "Helix", chain: "injective", projectHint: "helix" },
  { protocol: "Neptune Finance", chain: "injective", projectHint: "neptune" },
  { protocol: "Hydro Lending", chain: "injective", projectHint: "hydro" },
  { protocol: "Helix Spot", chain: "injective", projectHint: "helix" },
  { protocol: "Mito Finance", chain: "injective", projectHint: "mito" },
  { protocol: "Dojoswap", chain: "injective", projectHint: "dojo" },
  { protocol: "Dojoswap LSD", chain: "injective", projectHint: "dojo" },
  // Solana
  { protocol: "Jito (Liquid Staking)", chain: "solana", projectHint: "jito", defaultAsset: "SOL" },
  { protocol: "Raydium", chain: "solana", projectHint: "raydium", defaultAsset: "USDC" },
  { protocol: "Kamino", chain: "solana", projectHint: "kamino" },
  { protocol: "Jupiter Lend", chain: "solana", projectHint: "jupiter" },
  { protocol: "Orca", chain: "solana", projectHint: "orca" },
  { protocol: "Sanctum Infinity", chain: "solana", projectHint: "sanctum", defaultAsset: "SOL" },
  { protocol: "Save (marginfi Save)", chain: "solana", projectHint: "marginfi" },
  { protocol: "Meteora vaults", chain: "solana", projectHint: "meteora" }
  // Optional: Marinade, Binance staked lines were noisy; include if needed by adding hints
];

// server/data/live.ts
var TTL = Number(process.env.LIVE_REFRESH_MS ?? 6e4);
var TIMEOUT = Number(process.env.LIVE_TIMEOUT_MS ?? 6e3);
var CACHE = null;
var INFLIGHT = null;
var withTimeout = (p, ms = TIMEOUT) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
async function fetchLlamaPools() {
  const r = await withTimeout(fetch2("https://yields.llama.fi/pools"));
  if (!r.ok) throw new Error("llama_http");
  const j = await r.json();
  return j.data ?? [];
}
function riskBucket(apy, tvl) {
  if (tvl > 5e8 && apy <= 8) return "low";
  if (tvl > 1e8 && apy <= 15) return "medium";
  return "high";
}
function normalize(pools) {
  const out = [];
  for (const hint of PROTOCOLS) {
    const cand = pools.filter(
      (p) => typeof p.project === "string" && p.project.toLowerCase().includes(hint.projectHint.toLowerCase()) && typeof p.chain === "string" && p.chain.toLowerCase() === hint.chain
    );
    if (!cand.length) continue;
    const top = cand.sort((a, b) => Number(b.tvlUsd || 0) - Number(a.tvlUsd || 0))[0];
    const apy = Number(top.apy ?? top.apyBase ?? 0) || 0;
    const tvl = Number(top.tvlUsd ?? 0) || 0;
    const sym = (top.symbol || "").toUpperCase();
    const asset = hint.defaultAsset || (sym.split("-")[0] || "USDC");
    out.push({
      id: `${hint.protocol.toLowerCase()}:${hint.chain}:${asset}`,
      protocol: hint.protocol,
      chain: hint.chain,
      asset,
      apy,
      tvlUSD: tvl,
      risk: riskBucket(apy, tvl),
      url: top.poolMeta || top.url || void 0
    });
  }
  return out;
}
async function getLiveBundle() {
  const now = Date.now();
  if (CACHE && now - CACHE.updatedAt < TTL) return CACHE;
  if (INFLIGHT) return INFLIGHT;
  INFLIGHT = (async () => {
    try {
      const pools = await fetchLlamaPools();
      const protocols2 = normalize(pools);
      CACHE = { updatedAt: Date.now(), protocols: protocols2 };
      return CACHE;
    } finally {
      INFLIGHT = null;
    }
  })();
  return INFLIGHT;
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.get("/api/auth/user", async (req, res) => {
    res.json({
      id: "anonymous",
      email: null,
      walletConnected: false,
      message: "Wallet not connected - connect wallet for full access"
    });
  });
  app2.get("/api/yield-opportunities", async (req, res) => {
    try {
      const mockOpportunities = [
        {
          id: "1",
          name: "Aave V3 USDC",
          apy: "4.85",
          tvl: "1250.5",
          riskScore: 7,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "2",
          name: "Compound USDT",
          apy: "3.92",
          tvl: "890.2",
          riskScore: 6,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "3",
          name: "Yearn Finance ETH",
          apy: "8.45",
          tvl: "567.8",
          riskScore: 8,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "4",
          name: "Curve 3pool",
          apy: "2.15",
          tvl: "2340.1",
          riskScore: 5,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      res.json(mockOpportunities);
    } catch (error) {
      console.error("Error fetching yield opportunities:", error);
      res.status(500).json({ message: "Failed to fetch yield opportunities" });
    }
  });
  app2.get("/api/yield-opportunities/:id", async (req, res) => {
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
  app2.get("/api/strategies", async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ message: "Failed to fetch strategies" });
    }
  });
  app2.post("/api/strategies", async (req, res) => {
    try {
      const mockStrategy = {
        id: Date.now().toString(),
        name: req.body.name || "Demo Strategy",
        description: req.body.description || "A demo strategy for testing",
        apy: "12.5",
        riskScore: 6,
        tvl: "1000000",
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(mockStrategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(400).json({ message: "Failed to create strategy" });
    }
  });
  app2.get("/api/strategies/:id", async (req, res) => {
    try {
      const mockStrategy = {
        id: req.params.id,
        name: "Demo Strategy",
        description: "A demo strategy for testing purposes",
        apy: "12.5",
        riskScore: 6,
        tvl: "1000000",
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(mockStrategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ message: "Failed to fetch strategy" });
    }
  });
  app2.put("/api/strategies/:id", async (req, res) => {
    try {
      const mockStrategy = {
        id: req.params.id,
        name: req.body.name || "Updated Demo Strategy",
        description: req.body.description || "An updated demo strategy",
        apy: "13.2",
        riskScore: 6,
        tvl: "1100000",
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.json(mockStrategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(400).json({ message: "Failed to update strategy" });
    }
  });
  app2.delete("/api/strategies/:id", async (req, res) => {
    try {
      res.json({ message: "Strategy deleted successfully", id: req.params.id });
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });
  app2.get("/api/portfolio", async (req, res) => {
    try {
      res.json({
        totalValue: 0,
        assets: [],
        message: "Connect wallet to view your portfolio"
      });
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });
  app2.get("/api/chat/messages", async (req, res) => {
    try {
      const initialMessages = [
        {
          id: "1",
          userId: "blossom-ai",
          content: "Hello! I'm your DeFi strategy assistant. I can help you optimize yields, manage risk, and build strategies. What would you like to accomplish today?",
          isBot: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      res.json(initialMessages);
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ message: "Failed to fetch chat messages" });
    }
  });
  app2.post("/api/chat/messages", async (req, res) => {
    try {
      const { content, isBot } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const mockMessage = {
        id: Date.now().toString(),
        userId: "demo-user",
        content: isBot ? content : `Echo: ${content}`,
        isBot: isBot || false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(201).json(mockMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      res.status(400).json({ message: "Failed to create chat message" });
    }
  });
  app2.get("/api/risk-assessment/:opportunityId", async (req, res) => {
    try {
      const { opportunityId } = req.params;
      res.json({
        opportunityId,
        basicRisk: "Medium",
        message: "Connect wallet for detailed risk assessment"
      });
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      res.status(500).json({ message: "Failed to fetch risk assessment" });
    }
  });
  app2.get("/api/protocols", async (req, res) => {
    try {
      const mockProtocols = [
        {
          id: "1",
          name: "Aave",
          description: "Decentralized lending protocol",
          tvl: "1250000000",
          apy: "4.2",
          riskScore: 7,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "2",
          name: "Compound",
          description: "Algorithmic interest rate protocol",
          tvl: "890000000",
          apy: "3.8",
          riskScore: 6,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        {
          id: "3",
          name: "Yearn Finance",
          description: "Yield optimization protocol",
          tvl: "567000000",
          apy: "8.1",
          riskScore: 8,
          isActive: true,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      ];
      res.json(mockProtocols);
    } catch (error) {
      console.error("Error fetching protocols:", error);
      res.status(500).json({ message: "Failed to fetch protocols" });
    }
  });
  app2.get("/api/live/protocols", async (req, res) => {
    try {
      const { chain, asset } = req.query;
      const b = await getLiveBundle();
      let list = b.protocols;
      if (chain) list = list.filter((p) => p.chain === chain);
      if (asset) list = list.filter((p) => p.asset.toUpperCase() === String(asset).toUpperCase());
      res.json({ updatedAt: b.updatedAt, protocols: list });
    } catch {
      res.status(200).json({ updatedAt: Date.now(), protocols: [] });
    }
  });
  app2.get("/api/live-yields", async (req, res) => {
    try {
      const { chain, protocols: protocols2 } = req.query;
      const b = await getLiveBundle();
      let list = b.protocols;
      if (chain) list = list.filter((p) => p.chain === chain);
      if (protocols2) {
        const protocolList = protocols2.split(",").map((p) => p.trim().toLowerCase());
        list = list.filter(
          (p) => protocolList.some((proto) => p.protocol.toLowerCase().includes(proto))
        );
      }
      res.json({ updatedAt: b.updatedAt, yields: list });
    } catch {
      res.status(200).json({ updatedAt: Date.now(), yields: [] });
    }
  });
  app2.get("/api/data/prices", async (req, res) => {
    try {
      const symbols = req.query.symbols?.toString().split(",") || ["USDC", "WETH", "SOL"];
      const response = await dataFacade.getPrices(symbols);
      res.json(response);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ message: "Failed to fetch prices" });
    }
  });
  app2.get("/api/data/yields", async (req, res) => {
    try {
      const params = {
        chain: req.query.chain?.toString(),
        assets: req.query.assets?.toString().split(","),
        limit: req.query.limit ? parseInt(req.query.limit.toString()) : 25,
        sort: req.query.sort
      };
      const response = await dataFacade.getYields(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching yields:", error);
      res.status(500).json({ message: "Failed to fetch yields" });
    }
  });
  app2.get("/api/data/tvl", async (req, res) => {
    try {
      const params = {
        chain: req.query.chain?.toString(),
        protocols: req.query.protocols?.toString().split(",")
      };
      const response = await dataFacade.getTVL(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching TVL:", error);
      res.status(500).json({ message: "Failed to fetch TVL" });
    }
  });
  app2.get("/api/data/risk", async (req, res) => {
    try {
      const params = {
        protocols: req.query.protocols?.toString().split(",")
      };
      const response = await dataFacade.getRiskScores(params);
      res.json(response);
    } catch (error) {
      console.error("Error fetching risk scores:", error);
      res.status(500).json({ message: "Failed to fetch risk scores" });
    }
  });
  app2.post("/api/demo/chat", async (req, res) => {
    const startTime = Date.now();
    try {
      const { sessionId, message } = req.body;
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] POST /api/demo/chat request received", {
          sessionId: sessionId ? "provided" : "missing",
          messageLength: message?.length || 0,
          mode: "JSON"
        });
      }
      if (!message) {
        res.locals.why403 = "payload";
        return res.status(400).json({
          error: "forbidden",
          why: "payload",
          path: req.path,
          method: req.method,
          message: "Message parameter required"
        });
      }
      const { parseIntent: parseIntent2 } = await Promise.resolve().then(() => (init_intent_parser(), intent_parser_exports));
      const { generateResponse: generateResponse2 } = await Promise.resolve().then(() => (init_response_generator(), response_generator_exports));
      const intent = parseIntent2(message);
      const response = await generateResponse2(intent, message);
      const finalResponse = {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ...response
      };
      const responseSize = JSON.stringify(finalResponse).length;
      const duration = Date.now() - startTime;
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] JSON response ready", {
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
  app2.options("/api/demo/chat/stream", (req, res) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Vary", "Origin");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "content-type, authorization, x-requested-with");
    res.status(204).end();
  });
  app2.get("/api/demo/chat/stream", async (req, res) => {
    const startTime = Date.now();
    let bytesWritten = 0;
    try {
      const { sessionId, message } = req.query;
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] GET /api/demo/chat/stream request received", {
          sessionId: sessionId ? "provided" : "missing",
          messageLength: message?.toString().length || 0,
          mode: "SSE"
        });
      }
      if (!env.aiStream) {
        if (env.debugChat) {
          console.log("[DEBUG_CHAT] SSE disabled, returning fallback response");
        }
        return res.json({ disabled: true });
      }
      if (!message) {
        res.locals.why403 = "payload";
        return res.status(400).json({
          error: "forbidden",
          why: "payload",
          path: req.path,
          method: req.method,
          message: "Message parameter required"
        });
      }
      const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      };
      const origin = req.headers.origin;
      if (origin) {
        headers["Access-Control-Allow-Origin"] = origin;
        headers["Access-Control-Allow-Credentials"] = "true";
        headers["Vary"] = "Origin";
      }
      res.writeHead(200, headers);
      const writeData = (data) => {
        const line = `data: ${JSON.stringify(data)}

`;
        bytesWritten += line.length;
        res.write(line);
      };
      const { parseIntent: parseIntent2 } = await Promise.resolve().then(() => (init_intent_parser(), intent_parser_exports));
      const { generateResponse: generateResponse2 } = await Promise.resolve().then(() => (init_response_generator(), response_generator_exports));
      const intent = parseIntent2(message.toString());
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] Starting SSE stream");
      }
      const response = await generateResponse2(intent, message.toString());
      const tokens = response.planSummary?.split(" ") || ["Response", "generated"];
      for (let i = 0; i < tokens.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        writeData({ token: tokens[i] + (i < tokens.length - 1 ? " " : "") });
        if (env.debugChat && i === 0) {
          console.log("[DEBUG_CHAT] First SSE chunk sent");
        }
      }
      const finalPayload = {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        ...response
      };
      writeData({ final: finalPayload });
      writeData("[DONE]");
      const duration = Date.now() - startTime;
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] SSE stream completed", {
          duration: `${duration}ms`,
          bytesWritten,
          tokensStreamed: tokens.length,
          endSignal: "sent"
        });
      }
      res.end();
    } catch (error) {
      console.error("Error in chat stream:", error);
      const errorData = `data: ${JSON.stringify({ error: "Failed to process request" })}

`;
      bytesWritten += errorData.length;
      res.write(errorData);
      res.end();
      if (env.debugChat) {
        console.log("[DEBUG_CHAT] SSE stream error", {
          duration: `${Date.now() - startTime}ms`,
          bytesWritten,
          error: error instanceof Error ? error.message : "unknown"
        });
      }
    }
  });
  app2.get("/api/demo/health", async (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      providers: dataFacade.getProviderStatus()
    });
  });
  if (process.env.NODE_ENV !== "production") {
    app2.get("/api/debug/403s", (req, res) => {
      try {
        const records = global.__error403Records || [];
        res.json({
          records,
          count: records.length,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } catch (error) {
        res.json({
          records: [],
          count: 0,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          error: "Failed to load 403 buffer"
        });
      }
    });
  }
  app2.get("/api/cors/echo", (req, res) => {
    const origin = req.headers.origin;
    const normalizeOrigin = (origin2) => {
      try {
        const url = new URL(origin2);
        return url.origin;
      } catch {
        return origin2;
      }
    };
    const isLoopbackOrigin = (origin2) => {
      try {
        const url = new URL(origin2);
        const hostname = url.hostname.toLowerCase();
        return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
      } catch {
        return false;
      }
    };
    const DEV_ALLOWED = [
      "http://localhost:5000",
      "http://127.0.0.1:5000",
      "http://[::1]:5000",
      "http://localhost:5001",
      "http://127.0.0.1:5001",
      "http://[::1]:5001",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://[::1]:5173"
    ];
    const extra = (process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
    const ALLOWED = /* @__PURE__ */ new Set([...DEV_ALLOWED, ...extra]);
    let allowed = false;
    let matched = null;
    if (origin) {
      const normalizedOrigin = normalizeOrigin(origin);
      for (const allowedOrigin of Array.from(ALLOWED)) {
        const normalizedAllowed = normalizeOrigin(allowedOrigin);
        if (normalizedOrigin === normalizedAllowed) {
          allowed = true;
          matched = allowedOrigin;
          break;
        }
      }
      if (!allowed) {
        const allowAllDevOrigins = (process.env.ALLOW_ALL_DEV_ORIGINS || "1") === "1";
        const isDev = process.env.NODE_ENV !== "production";
        if (allowAllDevOrigins && isDev && isLoopbackOrigin(origin)) {
          allowed = true;
          matched = "loopback";
        }
      }
      if (!allowed && env.allowedOriginRegexPreview) {
        const regex = new RegExp(env.allowedOriginRegexPreview);
        if (regex.test(origin)) {
          allowed = true;
          matched = "regex";
        }
      }
    } else {
      allowed = process.env.NODE_ENV !== "production";
      matched = "no-origin-dev";
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
  if (process.env.DEBUG_403 === "1") {
    app2.get("/api/__debug/csrf", (req, res) => {
      try {
        res.json({ csrfToken: null, message: "No CSRF protection enabled" });
      } catch (error) {
        res.json({ csrfToken: null, error: error.message });
      }
    });
    app2.get("/api/__debug/ping", (req, res) => {
      const cookies = {};
      if (req.headers.cookie) {
        req.headers.cookie.split(";").forEach((cookie) => {
          const [key] = cookie.trim().split("=");
          if (key) cookies[key] = true;
        });
      }
      res.json({
        ok: true,
        cookies: Object.keys(cookies),
        headers: {
          origin: req.headers.origin,
          referer: req.headers.referer,
          userAgent: req.headers["user-agent"]
        }
      });
    });
  }
  const httpServer = createServer(app2);
  console.log("WebSocket server temporarily disabled for stability");
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    cors: true,
    // DO NOT set allowedHosts in dev
    proxy: {
      // only /api should proxy; nothing else
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
  preview: {
    port: 5e3,
    host: "localhost",
    strictPort: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  log("Setting up Vite development middleware...", "vite");
  const serverOptions = {
    middlewareMode: true,
    hmr: {
      server,
      port: 5e3,
      host: "localhost"
    },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        log(`Vite error: ${msg}`, "vite");
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  log("Vite middleware applied successfully", "vite");
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      log(`Error serving client: ${e}`, "vite");
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  log("Vite setup complete", "vite");
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_env();

// server/mw/dev-req-log.ts
var devReqLogMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    const start = Date.now();
    const originalSend = res.send;
    res.send = function(body) {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      return originalSend.call(this, body);
    };
  }
  next();
};

// server/index.ts
function add403Record(record) {
  if (!global.__error403Records) {
    global.__error403Records = [];
  }
  global.__error403Records.push(record);
  if (global.__error403Records.length > 50) {
    global.__error403Records.shift();
  }
}
var app = express2();
var DEV = process.env.NODE_ENV !== "production";
var ALLOW_ALL = DEV || process.env.ALLOW_ALL_DEV_ORIGINS === "1" || process.env.DISABLE_CORS_DEV === "1";
console.log("[server] DEV=", DEV, "ALLOW_ALL=", ALLOW_ALL, "PORT=", process.env.PORT);
app.use(cors({
  origin: (_origin, cb) => ALLOW_ALL ? cb(null, true) : cb(null, _origin || false),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["content-type", "authorization", "x-requested-with"],
  optionsSuccessStatus: 200
}));
if (ALLOW_ALL) {
  app.use((req, res, next) => {
    if (req.url.startsWith("/api")) return next();
    const accept = req.headers["accept"] || "";
    const wantsHtml = accept.includes("text/html");
    if (!wantsHtml || req.method !== "GET") return next();
    req.__no403 = true;
    next();
  });
}
app.options("*", (_req, res) => res.sendStatus(200));
app.use(devReqLogMiddleware);
app.use((req, res, next) => {
  res.locals.why403 = null;
  const originalStatus = res.status.bind(res);
  res.status = function(code) {
    if (code === 403) {
      if (req.__no403) {
        console.warn("[403:blocked] Request marked as __no403, not recording");
        return originalStatus(200);
      }
      const record = {
        ts: (/* @__PURE__ */ new Date()).toISOString(),
        method: req.method,
        path: req.path,
        origin: req.headers.origin || null,
        referer: req.headers.referer || null,
        host: req.headers.host || null,
        ip: req.ip || req.connection.remoteAddress || null,
        userAgent: req.headers["user-agent"] || null,
        why: res.locals.why403 || "unknown",
        traceId: req.traceId
      };
      add403Record(record);
      console.warn(`[403:block] ${record.why} | ${record.method} ${record.path} | origin=${record.origin} | ip=${record.ip} | traceId=${req.traceId}`);
    }
    return originalStatus(code);
  };
  next();
});
if (process.env.DEBUG_403 === "1") {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    res.set("x-app-layer", "api");
    next();
  });
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (res.statusCode === 403) {
        console.error(JSON.stringify({
          at: (/* @__PURE__ */ new Date()).toISOString(),
          method: req.method,
          path: req.originalUrl,
          status: res.statusCode,
          origin: req.headers.origin,
          referer: req.headers.referer,
          hasCookie: Boolean(req.headers.cookie),
          ua: req.headers["user-agent"],
          ip: req.ip
        }));
      }
    });
    next();
  });
}
app.use((req, res, next) => {
  const traceId = req.headers["x-trace-id"] || `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.set("x-trace-id", traceId);
  req.traceId = traceId;
  next();
});
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    const started = Date.now();
    onFinished(res, () => {
      const ms = Date.now() - started;
      console.log(
        "[REQ]",
        req.method,
        req.path,
        res.statusCode,
        `${ms}ms`,
        `origin=${req.headers.origin || "none"}`,
        `host=${req.headers.host || "none"}`,
        `traceId=${req.traceId}`
      );
    });
    next();
  });
}
app.get("/api/debug/vars", (_req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    allowAllDevOrigins: process.env.ALLOW_ALL_DEV_ORIGINS,
    disableCorsDev: process.env.DISABLE_CORS_DEV,
    port: process.env.PORT
  });
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  try {
    const { logEnvConfig: logEnvConfig2 } = await Promise.resolve().then(() => (init_env(), env_exports));
    logEnvConfig2();
  } catch (error) {
    console.error("\u274C Environment validation failed:");
    console.error(error);
    process.exit(1);
  }
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const PORT = Number(process.env.PORT) || 5050;
  server.listen({
    port: PORT,
    host: "localhost"
  }, () => {
    log(`\u{1F680} Server running on http://localhost:${PORT}`);
    log(`\u{1F4F1} Development mode: ${env.nodeEnv}`);
    log(`\u{1F527} API endpoints available at http://localhost:${PORT}/api/*`);
    log(`\u{1F310} CORS allowed origins: ${env.allowedOrigins.join(", ")}`);
  });
})();
