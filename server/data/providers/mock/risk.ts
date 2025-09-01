import { RiskProvider, RiskResponse } from "../../types.ts";
import { generateMockRiskScores } from "../../normalize.ts";

export class MockRiskProvider implements RiskProvider {
  async getRiskScores(params: {
    protocols?: string[];
  }): Promise<RiskResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const { protocols = ["Raydium", "Orca", "Jupiter"] } = params;
    
    const data = generateMockRiskScores(protocols);
    
    return {
      schemaVersion: "v1",
      provenance: "mock",
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

export const mockRiskProvider = new MockRiskProvider();
