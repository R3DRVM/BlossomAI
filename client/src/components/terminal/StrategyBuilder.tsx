import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  Brain,
  Zap,
  TrendingUp,
  Shield,
  Plus,
  Save,
  Play,
    Trash2,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize,
  Home,
  Wallet,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Settings,
  Target,
  Clock,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Link,
  ArrowUpDown,
  Bell
} from "lucide-react";

interface StrategyBlock {
  id: string;
  type: 'token-data' | 'strategy-logic' | 'action-logic';
  position: { x: number; y: number };
  config: Record<string, any>;
  connections: string[];
}

interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'data-flow' | 'execution-flow' | 'manual';
}

const blockTypes = {
  'token-data': {
    label: 'Token Data',
    icon: <Coins className="h-5 w-5" />,
    color: 'border-blue-500 bg-blue-500/10',
    description: 'Define assets and data types',
    configFields: {
      token: { type: 'select', label: 'Token', options: ['USDC', 'SOL', 'WETH', 'ETH', 'BTC', 'INJ'] },
      network: { type: 'select', label: 'Network', options: ['Ethereum', 'Solana', 'Injective'] },
      dataType: { type: 'select', label: 'Data Type', options: ['Price', 'TVL', 'Yield %', 'Volume', 'Risk Score'] },
      amount: { type: 'input', label: 'Amount', placeholder: 'Enter amount' }
    }
  },
  'strategy-logic': {
    label: 'Strategy Logic',
    icon: <Brain className="h-5 w-5" />,
    color: 'border-orange-500 bg-orange-500/10',
    description: 'Define strategy conditions',
    configFields: {
      logicType: { type: 'select', label: 'Logic Type', options: ['Time-Based', 'Yield-Based', 'TVL Ranking', 'Auto Rebalance', 'Price-Based', 'Volatility-Based', 'AI-Optimized'] },
      duration: { type: 'input', label: 'Duration', placeholder: 'e.g., 3 weeks' },
      profitTarget: { type: 'input', label: 'Profit Target (%)', placeholder: '15' },
      riskTolerance: { type: 'select', label: 'Risk Tolerance', options: ['Low', 'Medium', 'High'] }
    }
  },
  'action-logic': {
    label: 'Action Logic',
    icon: <Zap className="h-5 w-5" />,
    color: 'border-red-500 bg-red-500/10',
    description: 'Execute strategy actions',
    configFields: {
      actionType: { type: 'select', label: 'Action Type', options: ['Stake', 'Zap into Pool', 'Auto Rebalance', 'Send to Wallet', 'Notify/Alert', 'View List'] },
      execution: { type: 'select', label: 'Execution', options: ['Manual Preview', 'Auto Execute'] },
      gasOptimization: { type: 'select', label: 'Gas Optimization', options: ['Standard', 'Fast', 'Slow'] }
    }
  }
};



export function StrategyBuilder() {
  const [strategyBlocks, setStrategyBlocks] = useState<StrategyBlock[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [strategyName, setStrategyName] = useState("");
  const [draggedBlockType, setDraggedBlockType] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveStrategyMutation = useMutation({
    mutationFn: async (strategyData: any) => {
      return await apiRequest("POST", "/api/strategies", strategyData);
    },
    onSuccess: () => {
      toast({
        title: "Strategy Saved",
        description: "Your strategy has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, blockType: string) => {
    setDraggedBlockType(blockType);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedBlockType && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newBlock: StrategyBlock = {
        id: Math.random().toString(36).substr(2, 9),
        type: draggedBlockType as StrategyBlock['type'],
        position: { x, y },
        config: {},
        connections: []
      };
      
      const updatedBlocks = [...strategyBlocks, newBlock];
      setStrategyBlocks(updatedBlocks);
      
      // Auto-connect blocks based on their type and order
      setTimeout(() => {
        autoConnectBlocks(updatedBlocks);
      }, 100);
      
      setDraggedBlockType(null);
    }
  };

  const autoConnectBlocks = (blocks: StrategyBlock[]) => {
    const newConnections: Connection[] = [];
    
    // Find blocks by type
    const tokenDataBlocks = blocks.filter(b => b.type === 'token-data');
    const strategyLogicBlocks = blocks.filter(b => b.type === 'strategy-logic');
    const actionLogicBlocks = blocks.filter(b => b.type === 'action-logic');
    
    // Connect Token Data to Strategy Logic (left to right flow)
    tokenDataBlocks.forEach((tokenBlock, index) => {
      if (strategyLogicBlocks[index]) {
        newConnections.push({
          id: `conn-${tokenBlock.id}-${strategyLogicBlocks[index].id}`,
          from: tokenBlock.id,
          to: strategyLogicBlocks[index].id,
          type: 'data-flow'
        });
      }
    });
    
    // Connect Strategy Logic to Action Logic (left to right flow)
    strategyLogicBlocks.forEach((logicBlock, index) => {
      if (actionLogicBlocks[index]) {
        newConnections.push({
          id: `conn-${logicBlock.id}-${actionLogicBlocks[index].id}`,
          from: logicBlock.id,
          to: actionLogicBlocks[index].id,
          type: 'execution-flow'
        });
      }
    });
    
    // Also connect blocks that are positioned close to each other horizontally
    blocks.forEach((block, index) => {
      const nextBlock = blocks[index + 1];
      if (nextBlock && 
          Math.abs(block.position.y - nextBlock.position.y) < 100 && // Within 100px vertically
          nextBlock.position.x > block.position.x + 200) { // At least 200px to the right
        newConnections.push({
          id: `conn-auto-${block.id}-${nextBlock.id}`,
          from: block.id,
          to: nextBlock.id,
          type: 'manual'
        });
      }
    });
    
    setConnections(newConnections);
  };

  const addManualConnection = (fromBlockId: string, toBlockId: string) => {
    const newConnection: Connection = {
      id: `conn-manual-${fromBlockId}-${toBlockId}`,
      from: fromBlockId,
      to: toBlockId,
      type: 'manual'
    };
    
    setConnections(prev => [...prev, newConnection]);
  };

  const updateBlockConfig = (blockId: string, field: string, value: any) => {
    setStrategyBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId 
          ? { ...block, config: { ...block.config, [field]: value } }
          : block
      )
    );
  };

  const removeBlock = (blockId: string) => {
    setStrategyBlocks(blocks => blocks.filter(block => block.id !== blockId));
    setConnections(conns => conns.filter(conn => conn.from !== blockId && conn.to !== blockId));
  };

  const connectBlocks = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const newConnection: Connection = {
      id: Math.random().toString(36).substr(2, 9),
      from: fromId,
      to: toId
    };
    
    setConnections([...connections, newConnection]);
  };

  const validateStrategy = () => {
    if (strategyBlocks.length === 0) return false;
    
    const hasTokenData = strategyBlocks.some(block => block.type === 'token-data');
    const hasStrategyLogic = strategyBlocks.some(block => block.type === 'strategy-logic');
    const hasActionLogic = strategyBlocks.some(block => block.type === 'action-logic');
    
    return hasTokenData && hasStrategyLogic && hasActionLogic;
  };

  const simulateStrategy = () => {
    if (!validateStrategy()) {
      toast({
        title: "Invalid Strategy",
        description: "Please ensure you have Token Data, Strategy Logic, and Action Logic blocks connected.",
        variant: "destructive",
      });
      return;
    }

    // Mock simulation results
    setSimulationResults({
      expectedYield: "12.5%",
      tokenAllocation: "100% USDC",
      selectedVaults: ["Aave V3", "Compound V3"],
      yieldOverTime: "Projected: $1,250 after 1 year",
      successPrediction: "85%",
      gasEstimate: "0.002 ETH"
    });

    toast({
      title: "Simulation Complete",
      description: "Strategy simulation completed successfully!",
    });
  };

  const saveStrategy = () => {
    if (!strategyName.trim()) {
      toast({
        title: "Strategy Name Required",
        description: "Please enter a name for your strategy.",
        variant: "destructive",
      });
      return;
    }

    if (!validateStrategy()) {
      toast({
        title: "Invalid Strategy",
        description: "Please ensure you have all required blocks connected.",
        variant: "destructive",
      });
      return;
    }

    const strategyData = {
      name: strategyName,
      blocks: strategyBlocks,
      connections,
      configuration: {
        flow: connections.map(conn => ({ from: conn.from, to: conn.to }))
      }
    };

    saveStrategyMutation.mutate(strategyData);
  };

  const executeStrategy = () => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to execute strategies.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Strategy Execution",
      description: "Strategy execution initiated. Please confirm in your wallet.",
    });
  };

  const handleBlockMouseDown = (e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    const block = strategyBlocks.find(b => b.id === blockId);
    if (block) {
      setIsDraggingBlock(true);
      setSelectedBlock(blockId);
      setDragOffset({
        x: e.clientX - block.position.x,
        y: e.clientY - block.position.y
      });
    }
  };

  const handleBlockMouseMove = useCallback((e: MouseEvent) => {
    if (isDraggingBlock && selectedBlock) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      setStrategyBlocks(blocks =>
        blocks.map(block =>
          block.id === selectedBlock
            ? { ...block, position: { x: newX, y: newY } }
            : block
        )
      );
    }
  }, [isDraggingBlock, selectedBlock, dragOffset]);

  const handleBlockMouseUp = useCallback(() => {
    setIsDraggingBlock(false);
    setSelectedBlock(null);
  }, []);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDraggingBlock) {
      document.addEventListener('mousemove', handleBlockMouseMove);
      document.addEventListener('mouseup', handleBlockMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleBlockMouseMove);
        document.removeEventListener('mouseup', handleBlockMouseUp);
      };
    }
  }, [isDraggingBlock, handleBlockMouseMove, handleBlockMouseUp]);

  // Canvas panning functionality
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) { // Only pan when clicking on canvas background
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y });
    }
  };

  const handleCanvasMouseMove = useCallback((e: MouseEvent) => {
    if (isPanning) {
      setCanvasPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isPanning, handleCanvasMouseMove, handleCanvasMouseUp]);

  // Zoom functions
  const zoomIn = () => setCanvasZoom(prev => Math.min(prev * 1.2, 3));
  const zoomOut = () => setCanvasZoom(prev => Math.max(prev / 1.2, 0.3));
  const resetZoom = () => setCanvasZoom(1);
  const fitView = () => {
    if (strategyBlocks.length === 0) {
      setCanvasZoom(1);
      setCanvasPan({ x: 0, y: 0 });
      return;
    }
    
    // Calculate bounds of all blocks
    const bounds = strategyBlocks.reduce((acc, block) => {
      const right = block.position.x + 192; // w-48 = 192px
      const bottom = block.position.y + 120; // approximate height
      return {
        minX: Math.min(acc.minX, block.position.x),
        minY: Math.min(acc.minY, block.position.y),
        maxX: Math.max(acc.maxX, right),
        maxY: Math.max(acc.maxY, bottom)
      };
    }, { minX: 0, minY: 0, maxX: 192, maxY: 120 });
    
    // Calculate zoom to fit all blocks
    const canvasWidth = 800; // approximate canvas width
    const canvasHeight = 600; // approximate canvas height
    const scaleX = canvasWidth / (bounds.maxX - bounds.minX + 100);
    const scaleY = canvasHeight / (bounds.maxY - bounds.minY + 100);
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    setCanvasZoom(newZoom);
    
    // Center the view
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    setCanvasPan({
      x: (canvasWidth / 2) - (centerX * newZoom),
      y: (canvasHeight / 2) - (centerY * newZoom)
    });
  };

  const resetCanvas = () => {
    setStrategyBlocks([]);
    setConnections([]);
    setSimulationResults(null);
  };

  return (
    <section className="terminal-panel p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Strategy Builder</h2>
          <Input
            type="text"
            placeholder="Strategy name..."
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateStrategy}
            disabled={!validateStrategy()}
          >
            <Play className="h-4 w-4 mr-2" />
            Simulate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={saveStrategy}
            disabled={saveStrategyMutation.isPending || !strategyName.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStrategyMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={executeStrategy}
            disabled={!isWalletConnected || !simulationResults}
          >
            <Zap className="h-4 w-4 mr-2" />
            Execute
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-4 h-[600px]">
        {/* Left Panel - Building Blocks */}
        <div className="w-64 space-y-2">
          {/* Data Sources */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: <TrendingUp className="h-4 w-4" />, label: "Token Price Data", type: "token-data" },
                { icon: <BarChart3 className="h-4 w-4" />, label: "Volume Data", type: "token-data" },
                { icon: <Link className="h-4 w-4" />, label: "Market Cap Data", type: "token-data" },
                { icon: <TrendingUp className="h-4 w-4" />, label: "TVL", type: "token-data" },
                { icon: <Shield className="h-4 w-4" />, label: "Risk Scores", type: "token-data" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-muted/50 cursor-move transition-colors border border-transparent hover:border-border/30"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  title={`Drag ${item.label} to canvas`}
                >
                  <div className="text-muted-foreground">{item.icon}</div>
                  <span className="text-sm flex-1">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Strategy Logic */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Strategy Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: <TrendingUp className="h-4 w-4" />, label: "Price-Based Logic", type: "strategy-logic" },
                { icon: <BarChart3 className="h-4 w-4" />, label: "Volatility Logic", type: "strategy-logic" },
                { icon: <Brain className="h-4 w-4" />, label: "AI-Optimized Logic", type: "strategy-logic", premium: true }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-muted/50 cursor-move transition-colors border border-transparent hover:border-border/30"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  title={`Drag ${item.label} to canvas`}
                >
                  <div className="text-muted-foreground">{item.icon}</div>
                  <span className="text-sm flex-1">{item.label}</span>
                  {item.premium && (
                    <Badge variant="secondary" className="text-xs">+75%</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { icon: <ArrowUpDown className="h-4 w-4" />, label: "Entry & Exit", type: "action-logic" },
                { icon: <Shield className="h-4 w-4" />, label: "Hedge Action", type: "action-logic" },
                { icon: <Bell className="h-4 w-4" />, label: "Notify (Alerts)", type: "action-logic" }
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-muted/50 cursor-move transition-colors border border-transparent hover:border-border/30"
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  title={`Drag ${item.label} to canvas`}
                >
                  <div className="text-muted-foreground">{item.icon}</div>
                  <span className="text-sm flex-1">{item.label}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Center - Interactive Builder Canvas */}
        <div className="flex-1 relative">
          <div className="absolute top-2 right-2 flex space-x-1 z-10">
            <Button variant="outline" size="icon" onClick={zoomIn} title="Zoom In">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={zoomOut} title="Zoom Out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={resetZoom} title="Reset Zoom">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={fitView} title="Fit View">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={resetCanvas} title="Clear Canvas">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Zoom Indicator */}
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-muted-foreground border">
            {Math.round(canvasZoom * 100)}%
          </div>
          
          <div
            ref={canvasRef}
            className="w-full h-full bg-muted/10 rounded-lg border-2 border-dashed border-border relative overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseDown={handleCanvasMouseDown}
            style={{ cursor: isPanning ? 'grabbing' : 'default' }}
          >
            {/* Canvas Transform Container - This scales the content, not the canvas */}
            <div 
              className="w-full h-full relative"
              style={{
                transform: `scale(${canvasZoom}) translate(${canvasPan.x}px, ${canvasPan.y}px)`,
                transformOrigin: 'center center'
              }}
            >
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-20 pointer-events-none"></div>
            
            {/* Drag & Drop Instructions */}
            {strategyBlocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Plus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">Drag & Drop Building Blocks</p>
                  <p className="text-sm mb-4">Start with Token Data, add Strategy Logic, then Action Logic</p>
                  <div className="flex items-center justify-center space-x-8 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Token Data</span>
                    </div>
                    <div className="w-8 h-0.5 bg-blue-500"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Strategy Logic</span>
                    </div>
                    <div className="w-8 h-0.5 bg-green-500"></div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Action Logic</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Strategy Blocks */}
            {strategyBlocks.map((block) => {
              const blockType = blockTypes[block.type];
              const isSelected = selectedBlock === block.id;
              
              return (
                <div
                  key={block.id}
                  className={`absolute cursor-move ${blockType.color} rounded-lg p-4 w-48 shadow-lg hover:shadow-xl transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  style={{
                    left: block.position.x,
                    top: block.position.y
                  }}
                  onMouseDown={(e) => handleBlockMouseDown(e, block.id)}
                  onClick={() => setSelectedBlock(block.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {blockType.icon}
                      <span className="font-medium text-sm">{blockType.label}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Move className="h-4 w-4 text-muted-foreground cursor-move" title="Drag to move" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(blockType.configFields).map(([field, config]) => (
                      <div key={field}>
                        <label className="text-xs font-medium text-muted-foreground block mb-1">
                          {config.label}
                        </label>
                        {config.type === 'select' ? (
                          <Select
                            value={block.config[field] || ''}
                            onValueChange={(value) => updateBlockConfig(block.id, field, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder={`Select ${config.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {config.options.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type="text"
                            placeholder={config.placeholder}
                            value={block.config[field] || ''}
                            onChange={(e) => updateBlockConfig(block.id, field, e.target.value)}
                            className="h-8 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Connection Points */}
                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-border/20">
                    {block.type === 'token-data' && (
                      <div className="flex items-center space-x-1 text-xs text-blue-500">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Data Output</span>
                      </div>
                    )}
                    {block.type === 'strategy-logic' && (
                      <>
                        <div className="flex items-center space-x-1 text-xs text-blue-500">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Data Input</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-green-500">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Logic Output</span>
                        </div>
                      </>
                    )}
                    {block.type === 'action-logic' && (
                      <div className="flex items-center space-x-1 text-xs text-green-500">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Action Input</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Connections */}
            {connections.map((connection) => {
              const fromBlock = strategyBlocks.find(b => b.id === connection.from);
              const toBlock = strategyBlocks.find(b => b.id === connection.to);
              
              if (!fromBlock || !toBlock) return null;
              
              const fromX = fromBlock.position.x + 192; // 48 * 4 (w-48)
              const fromY = fromBlock.position.y + 60; // Center of block
              const toX = toBlock.position.x;
              const toY = toBlock.position.y + 60; // Center of block
              
              // Calculate control points for smooth, flowing curves
              const distance = Math.abs(toX - fromX);
              const controlOffset = Math.min(distance * 0.25, 60); // Slightly tighter curves
              
              // Create smooth, elegant curves with better flow
              const control1X = fromX + controlOffset;
              const control1Y = fromY;
              const control2X = toX - controlOffset;
              const control2Y = toY;
              const midX = (fromX + toX) / 2;
              const midY = (fromY + toY) / 2;
              
              // Add subtle curve variation for more natural flow
              const curveVariation = Math.min(distance * 0.1, 20);
              const control1YAdjusted = control1Y + (Math.random() > 0.5 ? curveVariation : -curveVariation);
              const control2YAdjusted = control2Y + (Math.random() > 0.5 ? curveVariation : -curveVariation);
              
              // Different stroke colors and styles based on connection type
              const getConnectionStyle = () => {
                switch (connection.type) {
                  case 'data-flow':
                    return {
                      stroke: 'rgb(59 130 246)', // Blue
                      strokeWidth: '2',
                      strokeDasharray: 'none',
                      shadow: '0 0 12px rgba(59, 130, 246, 0.3)',
                      opacity: '0.9'
                    };
                  case 'execution-flow':
                    return {
                      stroke: 'rgb(16 185 129)', // Green
                      strokeWidth: '2',
                      strokeDasharray: 'none',
                      shadow: '0 0 12px rgba(16, 185, 129, 0.3)',
                      opacity: '0.9'
                    };
                  default:
                    return {
                      stroke: 'rgb(148 163 184)', // Gray
                      strokeWidth: '1.5',
                      strokeDasharray: '3,3',
                      shadow: 'none',
                      opacity: '0.7'
                    };
                }
              };
              
              const style = getConnectionStyle();
              
              return (
                <svg
                  key={connection.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%'
                  }}
                >
                  <defs>
                    {/* Add glow filter for data and execution flows */}
                    {style.shadow !== 'none' && (
                      <filter id={`glow-${connection.type}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    )}
                    
                    {/* Add subtle gradient for more aesthetic connections */}
                    <linearGradient id={`gradient-${connection.type}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={style.stroke} stopOpacity="0.8"/>
                      <stop offset="50%" stopColor={style.stroke} stopOpacity="1"/>
                      <stop offset="100%" stopColor={style.stroke} stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Connection line with smooth, elegant curve */}
                  <path
                    d={`M ${fromX} ${fromY} C ${control1X} ${control1YAdjusted}, ${control2X} ${control2YAdjusted}, ${toX} ${toY}`}
                    stroke={style.shadow !== 'none' ? `url(#gradient-${connection.type})` : style.stroke}
                    strokeWidth={style.strokeWidth}
                    strokeDasharray={style.strokeDasharray}
                    fill="none"
                    opacity={style.opacity}
                    className="transition-all duration-300 ease-out"
                    filter={style.shadow !== 'none' ? `url(#glow-${connection.type})` : undefined}
                    style={{
                      filter: style.shadow !== 'none' ? `url(#glow-${connection.type})` : undefined
                    }}
                  />
                  
                  {/* Elegant connection flow indicators */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r="3"
                    fill={style.stroke}
                    opacity="0.2"
                    className="animate-pulse"
                  />
                  
                  {/* Subtle flow direction indicator */}
                  <circle
                    cx={midX + (toX > fromX ? 6 : -6)}
                    cy={midY}
                    r="1.5"
                    fill={style.stroke}
                    opacity="0.4"
                  />
                  
                  {/* Additional subtle flow dots for more aesthetic appeal */}
                  <circle
                    cx={midX + (toX > fromX ? -4 : 4)}
                    cy={midY + 2}
                    r="1"
                    fill={style.stroke}
                    opacity="0.3"
                  />
                </svg>
              );
            })}
            
            </div> {/* Close Canvas Transform Container */}
          </div>
        </div>
        
        {/* Right Panel - Simulation & Execution */}
        <div className="w-80 space-y-3">
          {/* Strategy Status */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium">Strategy Status</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Blocks Connected:</span>
                  <span className="text-xs font-medium">{connections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Strategy Valid:</span>
                  <span className={`text-xs font-medium ${validateStrategy() ? 'text-green-500' : 'text-red-500'}`}>
                    {validateStrategy() ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Flow Complete:</span>
                  <span className={`text-xs font-medium ${
                    strategyBlocks.some(b => b.type === 'token-data') &&
                    strategyBlocks.some(b => b.type === 'strategy-logic') &&
                    strategyBlocks.some(b => b.type === 'action-logic') &&
                    connections.length >= 2 ? 'text-green-500' : 'text-yellow-500'
                  }`}>
                    {strategyBlocks.some(b => b.type === 'token-data') &&
                     strategyBlocks.some(b => b.type === 'strategy-logic') &&
                     strategyBlocks.some(b => b.type === 'action-logic') &&
                     connections.length >= 2 ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Strategy Results */}
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">Strategy Results</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              {simulationResults ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expected Yield:</span>
                    <span className="text-sm font-medium text-green-500">{simulationResults.expectedYield}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Token Allocation:</span>
                    <span className="text-sm font-medium">{simulationResults.tokenAllocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Selected Vaults:</span>
                    <span className="text-sm font-medium">{simulationResults.selectedVaults.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Yield Over Time:</span>
                    <span className="text-sm font-medium">{simulationResults.yieldOverTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Success Prediction:</span>
                    <span className="text-sm font-medium text-blue-500">{simulationResults.successPrediction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Gas Estimate:</span>
                    <span className="text-sm font-medium">{simulationResults.gasEstimate}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click 'Simulate Strategy' to see results
                </p>
              )}
            </CardContent>
          </Card>
          

          
          {/* Wallet Connection & Balances */}
          <Card>
            <CardContent className="pt-4">
              {!isWalletConnected ? (
                <div className="text-center">
                  <Wallet className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Connect your wallet to view balances and execute strategies.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsWalletConnected(!isWalletConnected)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Wallet Connected</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsWalletConnected(false)}
                      className="h-6 w-6 p-0"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* Wallet Balances */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Balances
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>$INJ</span>
                        </div>
                        <span className="font-medium">2,450.75</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>$SOL</span>
                        </div>
                        <span className="font-medium">125.50</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>$USDC</span>
                        </div>
                        <span className="font-medium">15,750.00</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Portfolio Value */}
                  <div className="pt-2 border-t border-border/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Total Value</span>
                      <span className="text-sm font-bold text-green-500">$18,326.25</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      

    </section>
  );
}
