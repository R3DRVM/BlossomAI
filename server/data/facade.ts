import { env } from "../env.ts";
import { TokenPriceProvider, YieldProvider, TVLProvider, RiskProvider, PriceResponse, YieldResponse, TVLResponse, RiskResponse } from "./types.ts";

// Live providers
import { defiLlamaProvider } from "./providers/live/defillama.ts";

// Mock providers
import { mockPriceProvider } from "./providers/mock/prices.ts";
import { mockYieldProvider } from "./providers/mock/yields.ts";
import { mockTVLProvider } from "./providers/mock/tvl.ts";
import { mockRiskProvider } from "./providers/mock/risk.ts";

export class DataFacade implements TokenPriceProvider, YieldProvider, TVLProvider, RiskProvider {
  private priceProvider: TokenPriceProvider;
  private yieldProvider: YieldProvider;
  private tvlProvider: TVLProvider;
  private riskProvider: RiskProvider;

  constructor() {
    // Initialize providers based on environment flags
    this.priceProvider = env.livePrices ? defiLlamaProvider : mockPriceProvider;
    this.yieldProvider = env.liveYields ? defiLlamaProvider : mockYieldProvider;
    this.tvlProvider = env.liveTVL ? defiLlamaProvider : mockTVLProvider;
    this.riskProvider = env.liveRisk ? defiLlamaProvider : mockRiskProvider;
  }

  async getPrices(symbols: string[]): Promise<PriceResponse> {
    try {
      return await this.priceProvider.getPrices(symbols);
    } catch (error) {
      console.warn("Live price provider failed, falling back to mock:", error);
      return await mockPriceProvider.getPrices(symbols);
    }
  }

  async getYields(params: {
    chain?: string;
    assets?: string[];
    limit?: number;
    sort?: "apy" | "tvl" | "risk";
  }): Promise<YieldResponse> {
    try {
      return await this.yieldProvider.getYields(params);
    } catch (error) {
      console.warn("Live yield provider failed, falling back to mock:", error);
      return await mockYieldProvider.getYields(params);
    }
  }

  async getTVL(params: {
    chain?: string;
    protocols?: string[];
  }): Promise<TVLResponse> {
    try {
      return await this.tvlProvider.getTVL(params);
    } catch (error) {
      console.warn("Live TVL provider failed, falling back to mock:", error);
      return await mockTVLProvider.getTVL(params);
    }
  }

  async getRiskScores(params: {
    protocols?: string[];
  }): Promise<RiskResponse> {
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
      risk: env.liveRisk ? "live" : "mock",
    };
  }
}

// Export singleton instance
export const dataFacade = new DataFacade();
