import {
  users,
  protocols,
  yieldOpportunities,
  strategies,
  portfolioPositions,
  chatMessages,
  riskAssessments,
  type User,
  type UpsertUser,
  type Protocol,
  type InsertProtocol,
  type YieldOpportunity,
  type InsertYieldOpportunity,
  type Strategy,
  type InsertStrategy,
  type PortfolioPosition,
  type InsertPortfolioPosition,
  type ChatMessage,
  type InsertChatMessage,
  type RiskAssessment,
  type InsertRiskAssessment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Protocol operations
  getProtocols(): Promise<Protocol[]>;
  createProtocol(protocol: InsertProtocol): Promise<Protocol>;
  
  // Yield opportunity operations
  getYieldOpportunities(): Promise<YieldOpportunity[]>;
  getYieldOpportunityById(id: string): Promise<YieldOpportunity | undefined>;
  createYieldOpportunity(opportunity: InsertYieldOpportunity): Promise<YieldOpportunity>;
  updateYieldOpportunityApy(id: string, apy: string): Promise<void>;
  
  // Strategy operations
  getUserStrategies(userId: string): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  getStrategyById(id: string): Promise<Strategy | undefined>;
  updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy>;
  deleteStrategy(id: string): Promise<void>;
  
  // Portfolio operations
  getUserPortfolio(userId: string): Promise<PortfolioPosition[]>;
  createPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition>;
  updatePortfolioPosition(id: string, updates: Partial<InsertPortfolioPosition>): Promise<PortfolioPosition>;
  
  // Chat operations
  getUserChatMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
  getChatMessages(): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  
  // Risk assessment operations
  getRiskAssessment(opportunityId: string): Promise<RiskAssessment | undefined>;
  createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Protocol operations
  async getProtocols(): Promise<Protocol[]> {
    return await db.select().from(protocols);
  }

  async createProtocol(protocol: InsertProtocol): Promise<Protocol> {
    const [newProtocol] = await db.insert(protocols).values(protocol).returning();
    return newProtocol;
  }

  // Yield opportunity operations
  async getYieldOpportunities(): Promise<YieldOpportunity[]> {
    return await db
      .select()
      .from(yieldOpportunities)
      .where(eq(yieldOpportunities.isActive, true))
      .orderBy(desc(yieldOpportunities.apy));
  }

  async getYieldOpportunityById(id: string): Promise<YieldOpportunity | undefined> {
    const [opportunity] = await db
      .select()
      .from(yieldOpportunities)
      .where(eq(yieldOpportunities.id, id));
    return opportunity;
  }

  async createYieldOpportunity(opportunity: InsertYieldOpportunity): Promise<YieldOpportunity> {
    const [newOpportunity] = await db
      .insert(yieldOpportunities)
      .values(opportunity)
      .returning();
    return newOpportunity;
  }

  async updateYieldOpportunityApy(id: string, apy: string): Promise<void> {
    await db
      .update(yieldOpportunities)
      .set({ apy, updatedAt: new Date() })
      .where(eq(yieldOpportunities.id, id));
  }

  // Strategy operations
  async getUserStrategies(userId: string): Promise<Strategy[]> {
    return await db
      .select()
      .from(strategies)
      .where(and(eq(strategies.userId, userId), eq(strategies.isActive, true)))
      .orderBy(desc(strategies.createdAt));
  }

  async createStrategy(strategy: InsertStrategy): Promise<Strategy> {
    const [newStrategy] = await db.insert(strategies).values(strategy).returning();
    return newStrategy;
  }

  async getStrategyById(id: string): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy;
  }

  async updateStrategy(id: string, updates: Partial<InsertStrategy>): Promise<Strategy> {
    const [updatedStrategy] = await db
      .update(strategies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return updatedStrategy;
  }

  async deleteStrategy(id: string): Promise<void> {
    await db
      .update(strategies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(strategies.id, id));
  }

  // Portfolio operations
  async getUserPortfolio(userId: string): Promise<PortfolioPosition[]> {
    return await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.userId, userId))
      .orderBy(desc(portfolioPositions.createdAt));
  }

  async createPortfolioPosition(position: InsertPortfolioPosition): Promise<PortfolioPosition> {
    const [newPosition] = await db
      .insert(portfolioPositions)
      .values(position)
      .returning();
    return newPosition;
  }

  async updatePortfolioPosition(
    id: string,
    updates: Partial<InsertPortfolioPosition>
  ): Promise<PortfolioPosition> {
    const [updatedPosition] = await db
      .update(portfolioPositions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolioPositions.id, id))
      .returning();
    return updatedPosition;
  }

  // Chat operations
  async getUserChatMessages(userId: string, limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt));
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  // Risk assessment operations
  async getRiskAssessment(opportunityId: string): Promise<RiskAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(riskAssessments)
      .where(eq(riskAssessments.opportunityId, opportunityId));
    return assessment;
  }

  async createRiskAssessment(assessment: InsertRiskAssessment): Promise<RiskAssessment> {
    const [newAssessment] = await db
      .insert(riskAssessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }
}

export const storage = new DatabaseStorage();
