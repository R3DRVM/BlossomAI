import { TVLProvider, TVLResponse } from "../../types.ts";
import { generateMockTVL } from "../../normalize.ts";

export class MockTVLProvider implements TVLProvider {
  async getTVL(params: {
    chain?: string;
    protocols?: string[];
  }): Promise<TVLResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
    
    const { chain = "solana" } = params;
    
    let data = generateMockTVL(chain);
    
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
      provenance: "mock",
      timestamp: new Date().toISOString(),
      data,
      total: data.length,
      filters: params,
    };
  }
}

export const mockTVLProvider = new MockTVLProvider();
