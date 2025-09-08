import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getActiveUserId } from "@/ai/userUtils";
import { ensureSeed, debit, getTotalUSD } from "@/bridge/paperCustody";
import { saveProposedPlan, ProposedPlan } from "@/bridge/proposedPlanStore";
import { applyPlanById } from "@/bridge/portfolioStore";
import { debugPositions } from "@/bridge/positionsStore";
import { parseSize, formatSize } from "@/lib/num";
import { useLocation } from "wouter";
import { fetchYields } from "@/lib/yields";
import { fmtUSD } from "@/lib/format";
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap, 
  Star, 
  Clock, 
  Coins, 
  Target,
  ArrowUpDown,
  Filter,
  Search,
  Eye,
  Play,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Rocket
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string;
  rating: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  expectedReturn: number;
  timeHorizon: string;
  autoRebalance: boolean;
  rebalanceFrequency?: string;
  totalValue: number;
  protocols: Protocol[];
  assets: Asset[];
  performance: PerformanceMetrics;
  tags: string[];
  isPremium: boolean;
}

interface Protocol {
  name: string;
  tvl: number;
  apy: number;
  allocation: number;
  risk: 'Low' | 'Medium' | 'High';
  icon: string;
}

interface Asset {
  symbol: string;
  name: string;
  allocation: number;
  currentPrice: number;
  change24h: number;
  color: string;
}

interface PerformanceMetrics {
  historicalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  winRate: number;
}

// Create realistic allocations based on strategy type
function createStrategyAllocations(strategy: Strategy, protocols: any[], amount: number) {
  let allocations: any[] = [];
  
  if (strategy.name === "AI-Optimized Yield Aggregator") {
    // Balanced approach with slight preference for higher APY
    const weights = [0.25, 0.22, 0.20, 0.18, 0.15]; // Decreasing weights
    allocations = protocols.slice(0, 5).map((proto, index) => ({
      protocol: proto.protocol,
      asset: proto.asset,
      percentage: Math.round(weights[index] * 100),
      amount: Math.round((amount * weights[index])),
      apy: proto.apy,
      chain: 'solana',
      estApy: proto.apy,
      tvl: proto.tvlUSD,
      riskLabel: proto.risk
    }));
  } else if (strategy.name === "Conservative Stable Yield") {
    // Focus on established, lower-risk protocols
    const weights = [0.40, 0.30, 0.20, 0.10]; // Heavy focus on top 2
    allocations = protocols.slice(0, 4).map((proto, index) => ({
      protocol: proto.protocol,
      asset: proto.asset,
      percentage: Math.round(weights[index] * 100),
      amount: Math.round((amount * weights[index])),
      apy: proto.apy,
      chain: 'solana',
      estApy: proto.apy,
      tvl: proto.tvlUSD,
      riskLabel: proto.risk
    }));
  } else if (strategy.name === "High-Performance DeFi Rotation") {
    // Aggressive allocation favoring emerging protocols
    const weights = [0.30, 0.25, 0.20, 0.15, 0.10]; // More even distribution
    allocations = protocols.slice(0, 5).map((proto, index) => ({
      protocol: proto.protocol,
      asset: proto.asset,
      percentage: Math.round(weights[index] * 100),
      amount: Math.round((amount * weights[index])),
      apy: proto.apy,
      chain: 'solana',
      estApy: proto.apy,
      tvl: proto.tvlUSD,
      riskLabel: proto.risk
    }));
  } else {
    // Default: equal distribution
    const percentage = Math.round(100 / Math.min(protocols.length, 5));
    allocations = protocols.slice(0, 5).map((proto, index) => ({
      protocol: proto.protocol,
      asset: proto.asset,
      percentage,
      amount: Math.round((amount * percentage) / 100),
      apy: proto.apy,
      chain: 'solana',
      estApy: proto.apy,
      tvl: proto.tvlUSD,
      riskLabel: proto.risk
    }));
  }
  
  return allocations;
}

const mockStrategies: Strategy[] = [
  {
    id: "1",
    name: "AI-Optimized Yield Aggregator",
    description: "Advanced machine learning strategy that automatically rebalances across top DeFi protocols for optimal yield generation.",
    rating: 4.9,
    riskLevel: "Medium",
    expectedReturn: 18.5,
    timeHorizon: "6-12 months",
    autoRebalance: true,
    rebalanceFrequency: "Weekly",
    totalValue: 2500000,
    protocols: [
      { name: "Aave V3", tvl: 1500000, apy: 12.5, allocation: 35, risk: "Low", icon: "🟢" },
      { name: "Compound V3", tvl: 800000, apy: 11.2, allocation: 25, risk: "Low", icon: "🔵" },
      { name: "Morpho", tvl: 600000, apy: 15.8, allocation: 20, risk: "Medium", icon: "🟣" },
      { name: "Spark", tvl: 400000, apy: 13.4, allocation: 20, risk: "Medium", icon: "🟡" }
    ],
    assets: [
      { symbol: "USDC", name: "USD Coin", allocation: 45, currentPrice: 1.00, change24h: 0.0, color: "bg-blue-500" },
      { symbol: "WETH", name: "Wrapped Ethereum", allocation: 30, currentPrice: 3250.50, change24h: 2.1, color: "bg-purple-500" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", allocation: 25, currentPrice: 67500.00, change24h: 1.8, color: "bg-orange-500" }
    ],
    performance: {
      historicalReturn: 22.3,
      sharpeRatio: 1.8,
      maxDrawdown: -8.5,
      volatility: 12.4,
      winRate: 78
    },
    tags: ["AI-Powered", "Auto-Rebalance", "Multi-Protocol", "Institutional"],
    isPremium: true
  },
  {
    id: "2",
    name: "Conservative Stable Yield",
    description: "Low-risk strategy focused on stablecoins and blue-chip DeFi protocols with consistent yield generation.",
    rating: 4.7,
    riskLevel: "Low",
    expectedReturn: 8.2,
    timeHorizon: "3-6 months",
    autoRebalance: true,
    rebalanceFrequency: "Bi-weekly",
    totalValue: 1800000,
    protocols: [
      { name: "Aave V3", tvl: 1500000, apy: 8.5, allocation: 50, risk: "Low", icon: "🟢" },
      { name: "Compound V3", tvl: 800000, apy: 7.8, allocation: 30, risk: "Low", icon: "🔵" },
      { name: "Lido", tvl: 1200000, apy: 9.2, allocation: 20, risk: "Low", icon: "🟠" }
    ],
    assets: [
      { symbol: "USDC", name: "USD Coin", allocation: 60, currentPrice: 1.00, change24h: 0.0, color: "bg-blue-500" },
      { symbol: "USDT", name: "Tether", allocation: 25, currentPrice: 1.00, change24h: 0.0, color: "bg-green-500" },
      { symbol: "DAI", name: "Dai", allocation: 15, currentPrice: 1.00, change24h: 0.0, color: "bg-yellow-500" }
    ],
    performance: {
      historicalReturn: 9.1,
      sharpeRatio: 2.1,
      maxDrawdown: -3.2,
      volatility: 6.8,
      winRate: 85
    },
    tags: ["Conservative", "Stable", "Low-Risk", "Institutional"],
    isPremium: false
  },
  {
    id: "3",
    name: "High-Performance DeFi Rotation",
    description: "Aggressive strategy that dynamically rotates between emerging DeFi protocols for maximum yield potential.",
    rating: 4.5,
    riskLevel: "High",
    expectedReturn: 32.8,
    timeHorizon: "12+ months",
    autoRebalance: true,
    rebalanceFrequency: "Daily",
    totalValue: 3200000,
    protocols: [
      { name: "Morpho", tvl: 600000, apy: 18.5, allocation: 30, risk: "Medium", icon: "🟣" },
      { name: "Spark", tvl: 400000, apy: 16.2, allocation: 25, risk: "Medium", icon: "🟡" },
      { name: "Euler", tvl: 300000, apy: 22.1, allocation: 20, risk: "High", icon: "🔴" },
      { name: "Radiant", tvl: 200000, apy: 19.8, allocation: 15, risk: "High", icon: "🟠" },
      { name: "Aave V3", tvl: 1500000, apy: 12.5, allocation: 10, risk: "Low", icon: "🟢" }
    ],
    assets: [
      { symbol: "WETH", name: "Wrapped Ethereum", allocation: 40, currentPrice: 3250.50, change24h: 2.1, color: "bg-purple-500" },
      { symbol: "WBTC", name: "Wrapped Bitcoin", allocation: 30, currentPrice: 67500.00, change24h: 1.8, color: "bg-orange-500" },
      { symbol: "USDC", name: "USD Coin", allocation: 20, currentPrice: 1.00, change24h: 0.0, color: "bg-blue-500" },
      { symbol: "SOL", name: "Solana", allocation: 10, currentPrice: 125.50, change24h: 5.2, color: "bg-green-500" }
    ],
    performance: {
      historicalReturn: 35.2,
      sharpeRatio: 1.2,
      maxDrawdown: -18.5,
      volatility: 28.6,
      winRate: 65
    },
    tags: ["High-Yield", "Dynamic", "Emerging Protocols", "Aggressive"],
    isPremium: true
  }
];

export function Strategies() {
  const [, navigate] = useLocation();
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [deployAmount, setDeployAmount] = useState("250k");
  const [deployingStrategy, setDeployingStrategy] = useState<string | null>(null);
  const [activeInstance, setActiveInstance] = useState<any>(null);
  const { toast } = useToast();

  // Load active instance on component mount and listen for changes
  useEffect(() => {
    const loadActiveInstance = () => {
      const instances = JSON.parse(localStorage.getItem('blossom-prime-instances') || '[]');
      const active = instances.find((instance: any) => instance.isActive);
      setActiveInstance(active);
    };

    // Load initially
    loadActiveInstance();

    // Listen for storage changes (when instance is created from chat)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'blossom-prime-instances') {
        loadActiveInstance();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events (for same-tab updates)
    const handleInstanceUpdate = () => {
      loadActiveInstance();
    };

    window.addEventListener('blossom:instance-created', handleInstanceUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('blossom:instance-created', handleInstanceUpdate);
    };
  }, []);

  const filteredStrategies = mockStrategies.filter(strategy => {
    const matchesRisk = selectedRisk === "all" || strategy.riskLevel === selectedRisk;
    const matchesTimeframe = selectedTimeframe === "all" || strategy.timeHorizon === selectedTimeframe;
    const matchesSearch = strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         strategy.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesRisk && matchesTimeframe && matchesSearch;
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "Medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "High": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const handleDeploy = async (strategy: Strategy) => {
    const userId = getActiveUserId() || 'guest';
    const amount = parseSize(deployAmount) || 0;
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deployment amount.",
        variant: "destructive",
      });
      return;
    }

    setDeployingStrategy(strategy.id);
    
    try {
      // Ensure user has seeded balances
      await ensureSeed(userId);
      
      // Check if user has sufficient funds
      const totalAvailable = getTotalUSD(userId);
      if (totalAvailable < amount) {
        toast({
          title: "Insufficient Funds",
          description: `Not enough funds. Available: $${totalAvailable.toLocaleString()}, Required: $${amount.toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }

      // Fetch live yields for the strategy
      const yields = await fetchYields({ chain: 'solana' });
      const topProtocols = yields
        .sort((a, b) => b.tvlUSD - a.tvlUSD)
        .slice(0, 5); // Top 5 by TVL
      
      if (topProtocols.length === 0) {
        toast({
          title: "No Live Data Available",
          description: "Unable to fetch live protocol data. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Create allocations from live data based on strategy type
      const allocations = createStrategyAllocations(strategy, topProtocols, amount || 0);
      
      if (!allocations || allocations.length === 0) {
        toast({
          title: "No Allocations Created",
          description: "Failed to create strategy allocations. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create proposed plan using new system
      const plan: ProposedPlan = {
        id: crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        capitalUSD: amount || 0,
        asset: 'USDC',
        chain: 'solana',
        risk: 'medium',
        autoRebalance: false,
        allocations: allocations.map(a => ({
          protocol: a.protocol,
          chain: 'solana',
          asset: 'USDC',
          apy: a.apy,
          tvl: 1000000,
          risk: 'medium',
          amountUSD: a.amount
        })),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[strategy:deploy]', { userId, amount, allocations: allocations.length, plan: plan.id });
      }

      saveProposedPlan(plan, userId);

      toast({
        title: "Plan Created",
        description: `Proposed plan created for ${fmtUSD(amount)}. Check Analytics to apply.`,
      });
      
      // Navigate to analytics using SPA navigation
      navigate('/terminal?tab=analytics');
    } catch (error) {
      console.error('Failed to create deploy plan:', error);
      toast({
        title: "Deploy Failed",
        description: "Failed to create deployment plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeployingStrategy(null);
    }
  };

  const handleDeployNow = async (strategy: Strategy) => {
    const userId = getActiveUserId() || 'guest';
    const amount = parseSize(deployAmount) || 0;
    
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid deployment amount.",
        variant: "destructive",
      });
      return;
    }

    setDeployingStrategy(strategy.id);
    
    try {
      // Ensure user has seeded balances
      await ensureSeed(userId);
      
      // Check if user has sufficient funds
      const totalAvailable = getTotalUSD(userId);
      if (totalAvailable < amount) {
        toast({
          title: "Insufficient Funds",
          description: `Not enough funds. Available: $${totalAvailable.toLocaleString()}, Required: $${amount.toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }

      // Fetch live yields for the strategy
      const yields = await fetchYields({ chain: 'solana' });
      const topProtocols = yields
        .sort((a, b) => b.tvlUSD - a.tvlUSD)
        .slice(0, 5); // Top 5 by TVL
      
      if (topProtocols.length === 0) {
        toast({
          title: "No Live Data Available",
          description: "Unable to fetch live protocol data. Please try again later.",
          variant: "destructive",
        });
        return;
      }
      
      // Create allocations from live data based on strategy type
      const allocations = createStrategyAllocations(strategy, topProtocols, amount || 0);
      
      if (!allocations || allocations.length === 0) {
        toast({
          title: "No Allocations Created",
          description: "Failed to create strategy allocations. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Create and apply plan immediately using new system
      const plan: ProposedPlan = {
        id: crypto.randomUUID ? crypto.randomUUID() : `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        capitalUSD: amount || 0,
        asset: 'USDC',
        chain: 'solana',
        risk: 'medium',
        autoRebalance: false,
        allocations: allocations.map(a => ({
          protocol: a.protocol,
          chain: a.chain,
          asset: a.asset,
          apy: a.estApy,
          tvl: a.tvl,
          risk: a.riskLabel,
          amountUSD: a.amount
        })),
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      if (import.meta.env.VITE_DEBUG_CHAT === '1') {
        console.log('[strategy:deploy-now]', { userId, amount, allocations: allocations.length, plan: plan.id });
        console.log('[strategy:deploy-now] plan details:', plan);
        console.log('[strategy:deploy-now] allocations:', allocations);
      }

      try {
        await applyPlanById(userId, plan);
        
        // Debug positions after deployment
        debugPositions(userId);
        
        // Trigger analytics refresh
        window.dispatchEvent(new CustomEvent('blossom:plan:applied', { 
          detail: { userId, planId: plan.id, amount } 
        }));
        
        if (import.meta.env.VITE_DEBUG_CHAT === '1') {
          console.log('[strategy:deploy-now] completed successfully');
        }
      } catch (applyError) {
        console.error('[strategy:deploy-now] applyPlanById failed:', applyError);
        throw new Error(`Failed to apply plan: ${applyError.message}`);
      }

      toast({
        title: "Deployed Successfully",
        description: `Deployed ${fmtUSD(amount)} across ${allocations.length} protocols.`,
        action: (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Navigating to portfolio...');
                window.location.href = '/terminal?tab=portfolio';
              }}
            >
              View Positions
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                console.log('Navigating to analytics...');
                window.location.href = '/terminal?tab=analytics';
              }}
            >
              View Analytics
            </Button>
          </div>
        ),
      });

      // Navigate to portfolio using SPA navigation
      navigate('/terminal?tab=portfolio');
    } catch (error) {
      console.error('Failed to deploy now:', error);
      toast({
        title: "Deploy Failed",
        description: "Failed to deploy strategy. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeployingStrategy(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              AI-Curated Strategies
            </h1>
            <p className="text-muted-foreground mt-2">
              Discover top-rated DeFi strategies powered by advanced AI analysis
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Strategies
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Active Instance Banner */}
        {activeInstance && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{activeInstance.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Instance {activeInstance.name}</h3>
                  <p className="text-sm text-blue-700">
                    Whitelisted: {activeInstance.whitelistProtocols.join(', ')}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Clear the active instance
                  const instances = JSON.parse(localStorage.getItem('blossom-prime-instances') || '[]');
                  const updatedInstances = instances.map((inst: any) => ({ ...inst, isActive: false }));
                  localStorage.setItem('blossom-prime-instances', JSON.stringify(updatedInstances));
                  setActiveInstance(null);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear Instance
              </Button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies, protocols, or assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="Low">Low Risk</SelectItem>
              <SelectItem value="Medium">Medium Risk</SelectItem>
              <SelectItem value="High">High Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Horizon" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Timeframes</SelectItem>
              <SelectItem value="3-6 months">3-6 months</SelectItem>
              <SelectItem value="6-12 months">6-12 months</SelectItem>
              <SelectItem value="12+ months">12+ months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid gap-6">
        {filteredStrategies.map((strategy) => (
          <Card key={strategy.id} className="overflow-hidden shadow-sm border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    {strategy.isPremium && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-600 border-yellow-500/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                      {strategy.riskLevel} Risk
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-2 text-sm">{strategy.description}</p>
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-500">{strategy.expectedReturn}%</div>
                      <div className="text-xs text-muted-foreground">Expected Return</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-500">{strategy.rating}</div>
                      <div className="text-xs text-muted-foreground">AI Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-500">{strategy.performance.historicalReturn}%</div>
                      <div className="text-xs text-muted-foreground">Historical Return</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-500">{formatCurrency(strategy.totalValue)}</div>
                      <div className="text-xs text-muted-foreground">Total Value</div>
                    </div>
                  </div>

                  {/* Risk & TVL Info - Similar to Yield Opportunities */}
                  <div className="flex items-center justify-between mt-2 p-2 bg-muted/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Risk Level:</span>
                        <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
                          {strategy.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total TVL:</span>
                        <span className="font-medium">{formatCurrency(strategy.totalValue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">
                        {strategy.autoRebalance ? 'Auto-Rebalance' : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedStrategy(expandedStrategy === strategy.id ? null : strategy.id)}
                    className="h-7 px-2 text-xs"
                  >
                    {expandedStrategy === strategy.id ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                    <span className="ml-1">Details</span>
                  </Button>
                  <Button size="sm" className="h-7 px-2 text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Input
                      value={deployAmount}
                      onChange={(e) => setDeployAmount(e.target.value)}
                      placeholder="250k"
                      className="w-16 h-7 text-xs px-2"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeploy(strategy)}
                      disabled={deployingStrategy === strategy.id}
                      className="h-7 px-2 text-xs bg-pink-500/10 border-pink-500/20 text-pink-600 hover:bg-pink-500/20"
                    >
                      <Rocket className="h-3 w-3 mr-1" />
                      Deploy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDeployNow(strategy)}
                      disabled={deployingStrategy === strategy.id}
                      className="h-7 px-2 text-xs bg-pink-500 hover:bg-pink-600"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Deploy Now
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>

            {/* Expanded Details */}
            {expandedStrategy === strategy.id && (
              <CardContent className="pt-2 border-t border-border/20">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Protocols Breakdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm flex items-center">
                        <BarChart3 className="h-3 w-3 mr-1" />
                        Protocol Allocation
                      </h4>
                      <div className="text-xs text-muted-foreground">
                        TVL: {formatCurrency(strategy.protocols.reduce((sum, p) => sum + p.tvl, 0))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {strategy.protocols.map((protocol, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div className="text-lg">{protocol.icon}</div>
                            <div>
                              <div className="font-medium text-sm">{protocol.name}</div>
                              <div className="text-xs text-muted-foreground">
                                TVL: {formatCurrency(protocol.tvl)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{protocol.allocation}%</div>
                            <div className="text-xs text-green-500">{protocol.apy}% APY</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assets Breakdown */}
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Coins className="h-3 w-3 mr-1" />
                      Asset Composition
                    </h4>
                    <div className="space-y-2">
                      {strategy.assets.map((asset, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${asset.color}`}></div>
                            <div>
                              <div className="font-medium text-sm">{asset.symbol}</div>
                              <div className="text-xs text-muted-foreground">{asset.name}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-sm">{asset.allocation}%</div>
                            <div className={`text-xs ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-sm mb-2 flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      Performance Metrics
                    </h4>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <div className="text-sm font-bold text-green-500">{strategy.performance.sharpeRatio}</div>
                        <div className="text-xs text-muted-foreground">Sharpe</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <div className="text-sm font-bold text-red-500">{strategy.performance.maxDrawdown}%</div>
                        <div className="text-xs text-muted-foreground">Max DD</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <div className="text-sm font-bold text-blue-500">{strategy.performance.volatility}%</div>
                        <div className="text-xs text-muted-foreground">Volatility</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <div className="text-sm font-bold text-purple-500">{strategy.performance.winRate}%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center p-2 bg-muted/20 rounded-md">
                        <div className="text-sm font-bold text-orange-500">{strategy.timeHorizon}</div>
                        <div className="text-xs text-muted-foreground">Horizon</div>
                      </div>
                    </div>
                  </div>

                  {/* Auto-Rebalancing Info */}
                  {strategy.autoRebalance && (
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-sm mb-2 flex items-center">
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        Auto-Rebalancing
                      </h4>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-blue-600 text-sm">Frequency: {strategy.rebalanceFrequency}</span>
                        </div>
                        <p className="text-xs text-blue-600/80">
                          Automatically rebalances portfolio to maintain optimal allocations and capture best yield opportunities.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <div className="flex flex-wrap gap-1">
                      {strategy.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStrategies.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No strategies found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms to find more strategies.
          </p>
          <Button onClick={() => {
            setSelectedRisk("all");
            setSelectedTimeframe("all");
            setSearchQuery("");
          }}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}


