import { z } from "zod";

// Base response schema with provenance
export const BaseResponseSchema = z.object({
  schemaVersion: z.literal("v1"),
  provenance: z.enum(["live", "mock"]),
  timestamp: z.string().datetime(),
});

// Price data types
export const TokenPriceSchema = z.object({
  symbol: z.string(),
  price: z.number().positive(),
  change24h: z.number(),
  marketCap: z.number().optional(),
  volume24h: z.number().optional(),
});

export const PriceResponseSchema = BaseResponseSchema.extend({
  data: z.array(TokenPriceSchema),
});

// Yield data types
export const YieldOpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  protocol: z.string(),
  chain: z.string(),
  apy: z.number().positive(),
  tvl: z.number().positive(),
  riskScore: z.number().min(1).max(10),
  assets: z.array(z.string()),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const YieldResponseSchema = BaseResponseSchema.extend({
  data: z.array(YieldOpportunitySchema),
  total: z.number(),
  filters: z.object({
    chain: z.string().optional(),
    assets: z.array(z.string()).optional(),
    limit: z.number().optional(),
    sort: z.enum(["apy", "tvl", "risk"]).optional(),
  }).optional(),
});

// TVL data types
export const ProtocolTVLSchema = z.object({
  id: z.string(),
  name: z.string(),
  chain: z.string(),
  tvl: z.number().positive(),
  change24h: z.number(),
  protocols: z.array(z.string()),
});

export const TVLResponseSchema = BaseResponseSchema.extend({
  data: z.array(ProtocolTVLSchema),
  total: z.number(),
  filters: z.object({
    chain: z.string().optional(),
    protocols: z.array(z.string()).optional(),
  }).optional(),
});

// Risk data types (mock for now)
export const RiskScoreSchema = z.object({
  protocol: z.string(),
  riskScore: z.number().min(1).max(10),
  factors: z.array(z.string()),
  lastUpdated: z.string().datetime(),
});

export const RiskResponseSchema = BaseResponseSchema.extend({
  data: z.array(RiskScoreSchema),
});

// Provider interface types
export interface TokenPriceProvider {
  getPrices(symbols: string[]): Promise<z.infer<typeof PriceResponseSchema>>;
}

export interface YieldProvider {
  getYields(params: {
    chain?: string;
    assets?: string[];
    limit?: number;
    sort?: "apy" | "tvl" | "risk";
  }): Promise<z.infer<typeof YieldResponseSchema>>;
}

export interface TVLProvider {
  getTVL(params: {
    chain?: string;
    protocols?: string[];
  }): Promise<z.infer<typeof TVLResponseSchema>>;
}

export interface RiskProvider {
  getRiskScores(params: {
    protocols?: string[];
  }): Promise<z.infer<typeof RiskResponseSchema>>;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl: number;
  key: string;
}

// Export types
export type TokenPrice = z.infer<typeof TokenPriceSchema>;
export type YieldOpportunity = z.infer<typeof YieldOpportunitySchema>;
export type ProtocolTVL = z.infer<typeof ProtocolTVLSchema>;
export type RiskScore = z.infer<typeof RiskScoreSchema>;
export type PriceResponse = z.infer<typeof PriceResponseSchema>;
export type YieldResponse = z.infer<typeof YieldResponseSchema>;
export type TVLResponse = z.infer<typeof TVLResponseSchema>;
export type RiskResponse = z.infer<typeof RiskResponseSchema>;
