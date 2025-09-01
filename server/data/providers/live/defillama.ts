import { TokenPriceProvider, YieldProvider, TVLProvider, PriceResponse, YieldResponse, TVLResponse } from "../../types.ts";
import { normalizeDefiLlamaPrices, normalizeDefiLlamaYields, normalizeDefiLlamaTVL } from "../../normalize.ts";
import { cache } from "../../cache.ts";

class DefiLlamaProvider implements TokenPriceProvider, YieldProvider, TVLProvider {
  private baseUrl = "https://api.llama.fi";
  private timeout = 1500;
  private maxRetries = 1;
  private circuitBreaker = {
    failures: 0,
    lastFailure: 0,
    threshold: 3,
    resetTimeout: 30000, // 30 seconds
  };

  private async makeRequest<T>(endpoint: string, cacheKey: string, ttl: number): Promise<T> {
    // Check cache first
    const cached = cache.get<T>(cacheKey);
    if (cached) return cached;

    // Circuit breaker check
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceLastFailure < this.circuitBreaker.resetTimeout) {
        throw new Error("Circuit breaker open - too many recent failures");
      }
      // Reset circuit breaker
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
            'User-Agent': 'BlossomAI/1.0',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Cache successful response
        cache.set(cacheKey, data, ttl);
        
        // Reset circuit breaker on success
        this.circuitBreaker.failures = 0;
        
        return data;
      } catch (error) {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Add jitter to retry delay
        const delay = Math.random() * 100 + 50;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error("Max retries exceeded");
  }

  async getPrices(symbols: string[]): Promise<PriceResponse> {
    try {
      const cacheKey = `prices:${symbols.sort().join(',')}`;
      const rawData = await this.makeRequest<any>(`/v2/simple/price?ids=${symbols.join(',')}`, cacheKey, 15000);
      
      const data = normalizeDefiLlamaPrices(rawData);
      
      return {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: new Date().toISOString(),
        data,
      };
    } catch (error) {
      console.error("DefiLlama price fetch failed:", error);
      throw error;
    }
  }

  async getYields(params: {
    chain?: string;
    assets?: string[];
    limit?: number;
    sort?: "apy" | "tvl" | "risk";
  }): Promise<YieldResponse> {
    try {
      const { chain = "solana", limit = 25 } = params;
      const cacheKey = `yields:${chain}:${limit}`;
      
      const rawData = await this.makeRequest<any[]>(`/v2/yields?chain=${chain}`, cacheKey, 120000);
      
      let data = normalizeDefiLlamaYields(rawData);
      
      // Apply filters
      if (params.assets) {
        data = data.filter(yieldItem => 
          params.assets!.some(asset => 
            yieldItem.assets.some(yieldAsset => 
              yieldAsset.toLowerCase().includes(asset.toLowerCase())
            )
          )
        );
      }
      
      // Apply sorting
      if (params.sort) {
        data.sort((a, b) => {
          switch (params.sort) {
            case "apy": return b.apy - a.apy;
            case "tvl": return b.tvl - a.tvl;
            case "risk": return a.riskScore - b.riskScore;
            default: return 0;
          }
        });
      }
      
      // Apply limit
      if (limit) {
        data = data.slice(0, limit);
      }
      
      return {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: new Date().toISOString(),
        data,
        total: data.length,
        filters: params,
      };
    } catch (error) {
      console.error("DefiLlama yield fetch failed:", error);
      throw error;
    }
  }

  async getTVL(params: {
    chain?: string;
    protocols?: string[];
  }): Promise<TVLResponse> {
    try {
      const { chain = "solana" } = params;
      const cacheKey = `tvl:${chain}`;
      
      const rawData = await this.makeRequest<any[]>(`/v2/chains`, cacheKey, 60000);
      
      let data = normalizeDefiLlamaTVL(rawData);
      
      // Filter by chain
      data = data.filter(item => 
        item.chain.toLowerCase() === chain.toLowerCase()
      );
      
      // Filter by protocols if specified
      if (params.protocols) {
        data = data.filter(item => 
          params.protocols!.some(protocol => 
            item.name.toLowerCase().includes(protocol.toLowerCase())
          )
        );
      }
      
      return {
        schemaVersion: "v1",
        provenance: "live",
        timestamp: new Date().toISOString(),
        data,
        total: data.length,
        filters: params,
      };
    } catch (error) {
      console.error("DefiLlama TVL fetch failed:", error);
      throw error;
    }
  }
}

export const defiLlamaProvider = new DefiLlamaProvider();
