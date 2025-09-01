import { YieldProvider, YieldResponse } from "../../types.ts";
import { generateMockYields } from "../../normalize.ts";

export class MockYieldProvider implements YieldProvider {
  async getYields(params: {
    chain?: string;
    assets?: string[];
    limit?: number;
    sort?: "apy" | "tvl" | "risk";
  }): Promise<YieldResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const { chain = "solana", assets = ["USDC", "SOL"], limit = 25 } = params;
    
    let data = generateMockYields(chain, assets);
    
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
      provenance: "mock",
      timestamp: new Date().toISOString(),
      data,
      total: data.length,
      filters: params,
    };
  }
}

export const mockYieldProvider = new MockYieldProvider();
