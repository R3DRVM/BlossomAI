import { TokenPriceProvider, PriceResponse } from "../../types.ts";
import { generateMockPrices } from "../../normalize.ts";

export class MockPriceProvider implements TokenPriceProvider {
  async getPrices(symbols: string[]): Promise<PriceResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const data = generateMockPrices(symbols);
    
    return {
      schemaVersion: "v1",
      provenance: "mock",
      timestamp: new Date().toISOString(),
      data,
    };
  }
}

export const mockPriceProvider = new MockPriceProvider();
