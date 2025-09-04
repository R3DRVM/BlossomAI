export interface PriceData {
  symbol: string;
  price: number;
  source: 'live' | 'fallback' | 'mock';
  timestamp: number;
  chain?: string;
}

export interface PriceFeedConfig {
  ttlSeconds: number;
  enableLivePrices: boolean;
  fallbackEnabled: boolean;
}

class PriceFeedStore {
  private cache = new Map<string, PriceData>();
  private config: PriceFeedConfig;
  private lastFetch = 0;

  constructor() {
    this.config = {
      ttlSeconds: Number(import.meta.env.VITE_PRICE_TTL_SECONDS) || 15,
      enableLivePrices: import.meta.env.VITE_LIVE_PRICES === '1',
      fallbackEnabled: true
    };
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > (this.config.ttlSeconds * 1000);
  }

  private getCacheKey(symbol: string, chain?: string): string {
    return chain ? `${symbol}-${chain}` : symbol;
  }

  private async fetchFromDefiLlama(symbols: string[]): Promise<PriceData[]> {
    try {
      // DefiLlama price API endpoint
      const response = await fetch(`https://coins.llama.fi/prices/current/${symbols.join(',')}`);
      
      if (!response.ok) {
        throw new Error(`DefiLlama API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: PriceData[] = [];

      for (const [key, value] of Object.entries(data.coins || {})) {
        const coinData = value as any;
        const symbol = key.split(':')[1] || key; // Extract symbol from "chain:address" format
        
        prices.push({
          symbol: symbol.toUpperCase(),
          price: coinData.price || 0,
          source: 'live',
          timestamp: Date.now(),
          chain: key.split(':')[0]
        });
      }

      console.log('price:feed:defillama', { count: prices.length, symbols });
      return prices;
    } catch (error) {
      console.warn('price:feed:defillama:failed', error);
      throw error;
    }
  }

  private async fetchFromCoinGecko(symbols: string[]): Promise<PriceData[]> {
    try {
      // CoinGecko API endpoint
      const ids = symbols.map(s => this.getCoinGeckoId(s)).filter(Boolean);
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`
      );
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const prices: PriceData[] = [];

      for (const [id, value] of Object.entries(data)) {
        const priceData = value as any;
        const symbol = this.getSymbolFromCoinGeckoId(id);
        
        if (symbol && priceData.usd) {
          prices.push({
            symbol,
            price: priceData.usd,
            source: 'fallback',
            timestamp: Date.now()
          });
        }
      }

      console.log('price:feed:coingecko', { count: prices.length, symbols });
      return prices;
    } catch (error) {
      console.warn('price:feed:coingecko:failed', error);
      throw error;
    }
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'SOL': 'solana',
      'ETH': 'ethereum',
      'WETH': 'ethereum',
      'INJ': 'injective-protocol',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai'
    };
    return mapping[symbol.toUpperCase()] || '';
  }

  private getSymbolFromCoinGeckoId(id: string): string {
    const mapping: Record<string, string> = {
      'solana': 'SOL',
      'ethereum': 'ETH',
      'injective-protocol': 'INJ',
      'usd-coin': 'USDC',
      'tether': 'USDT',
      'dai': 'DAI'
    };
    return mapping[id] || '';
  }

  private getMockPrices(symbols: string[]): PriceData[] {
    const mockPrices: Record<string, number> = {
      'USDC': 1.00,
      'USDT': 1.00,
      'DAI': 1.00,
      'SOL': 95.50,
      'ETH': 2850.00,
      'WETH': 2850.00,
      'INJ': 24.75
    };

    return symbols.map(symbol => ({
      symbol: symbol.toUpperCase(),
      price: mockPrices[symbol.toUpperCase()] || 0,
      source: 'mock',
      timestamp: Date.now()
    }));
  }

  private async fetchPrices(symbols: string[]): Promise<PriceData[]> {
    if (!this.config.enableLivePrices) {
      return this.getMockPrices(symbols);
    }

    try {
      // Try DefiLlama first
      return await this.fetchFromDefiLlama(symbols);
    } catch (error) {
      if (this.config.fallbackEnabled) {
        try {
          // Fallback to CoinGecko
          return await this.fetchFromCoinGecko(symbols);
        } catch (fallbackError) {
          console.warn('price:feed:all:failed', { error: fallbackError });
          // Final fallback to mock prices
          return this.getMockPrices(symbols);
        }
      } else {
        throw error;
      }
    }
  }

  private updateCache(prices: PriceData[]): void {
    for (const price of prices) {
      const key = this.getCacheKey(price.symbol, price.chain);
      this.cache.set(key, price);
    }
    this.lastFetch = Date.now();
  }

  async getPrice(symbol: string, chain?: string): Promise<PriceData> {
    const key = this.getCacheKey(symbol, chain);
    const cached = this.cache.get(key);

    // Return cached if not expired
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached;
    }

    // Fetch fresh prices
    const prices = await this.fetchPrices([symbol]);
    this.updateCache(prices);

    // Return the requested price
    const result = prices.find(p => p.symbol === symbol.toUpperCase());
    if (result) {
      return result;
    }

    // Fallback to mock if not found
    return {
      symbol: symbol.toUpperCase(),
      price: 0,
      source: 'mock',
      timestamp: Date.now(),
      chain
    };
  }

  async getPrices(symbols: string[]): Promise<PriceData[]> {
    const results: PriceData[] = [];
    const symbolsToFetch: string[] = [];

    // Check cache first
    for (const symbol of symbols) {
      const key = this.getCacheKey(symbol);
      const cached = this.cache.get(key);

      if (cached && !this.isExpired(cached.timestamp)) {
        results.push(cached);
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // Fetch missing prices
    if (symbolsToFetch.length > 0) {
      const freshPrices = await this.fetchPrices(symbolsToFetch);
      this.updateCache(freshPrices);
      results.push(...freshPrices);
    }

    return results;
  }

  getCachedPrice(symbol: string, chain?: string): PriceData | null {
    const key = this.getCacheKey(symbol, chain);
    const cached = this.cache.get(key);
    return cached && !this.isExpired(cached.timestamp) ? cached : null;
  }

  getCacheStatus(): { size: number; lastFetch: number; ttlSeconds: number } {
    return {
      size: this.cache.size,
      lastFetch: this.lastFetch,
      ttlSeconds: this.config.ttlSeconds
    };
  }

  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
    console.log('price:feed:cache:cleared');
  }

  // Helper to get price for wallet value calculation
  async getWalletValue(balances: Array<{ asset: string; amount: number }>): Promise<number> {
    const symbols = balances.map(b => b.asset);
    const prices = await this.getPrices(symbols);
    
    return balances.reduce((total, balance) => {
      const price = prices.find(p => p.symbol === balance.asset);
      return total + (balance.amount * (price?.price || 0));
    }, 0);
  }
}

export const priceFeed = new PriceFeedStore();




