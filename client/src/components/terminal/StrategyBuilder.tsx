import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  ArrowRightLeft, 
  Sprout, 
  Shield, 
  Plus,
  Save,
  FileText,
  Trash2,
  Play
} from "lucide-react";

interface StrategyNode {
  id: string;
  type: 'deposit' | 'swap' | 'farm' | 'risk-check';
  config?: Record<string, any>;
}

const componentTypes = [
  {
    type: 'deposit' as const,
    icon: <Coins className="h-4 w-4" />,
    label: 'Deposit',
    color: 'text-primary',
    description: 'Initial capital deposit'
  },
  {
    type: 'swap' as const,
    icon: <ArrowRightLeft className="h-4 w-4" />,
    label: 'Swap',
    color: 'text-blue-500',
    description: 'Token exchange'
  },
  {
    type: 'farm' as const,
    icon: <Sprout className="h-4 w-4" />,
    label: 'Farm',
    color: 'text-green-500',
    description: 'Yield farming'
  },
  {
    type: 'risk-check' as const,
    icon: <Shield className="h-4 w-4" />,
    label: 'Risk Check',
    color: 'text-yellow-500',
    description: 'Risk assessment'
  }
];

export function StrategyBuilder() {
  const [strategyNodes, setStrategyNodes] = useState<StrategyNode[]>([]);
  const [strategyName, setStrategyName] = useState("");
  const [draggedType, setDraggedType] = useState<string | null>(null);
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
      setStrategyNodes([]);
      setStrategyName("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setDraggedType(type);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedType) {
      const newNode: StrategyNode = {
        id: Math.random().toString(36).substr(2, 9),
        type: draggedType as StrategyNode['type'],
        config: {}
      };
      setStrategyNodes([...strategyNodes, newNode]);
      setDraggedType(null);
    }
  };

  const removeNode = (nodeId: string) => {
    setStrategyNodes(strategyNodes.filter(node => node.id !== nodeId));
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

    if (strategyNodes.length === 0) {
      toast({
        title: "Empty Strategy",
        description: "Please add at least one component to your strategy.",
        variant: "destructive",
      });
      return;
    }

    const strategyData = {
      name: strategyName,
      description: `Custom strategy with ${strategyNodes.length} components`,
      configuration: {
        nodes: strategyNodes,
        flow: strategyNodes.map(node => node.id)
      },
      riskLevel: 'medium',
      targetApy: "12.5"
    };

    saveStrategyMutation.mutate(strategyData);
  };

  const simulateStrategy = () => {
    if (strategyNodes.length === 0) {
      toast({
        title: "No Strategy to Simulate",
        description: "Please build a strategy first.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Simulation Started",
      description: "Your strategy simulation is running...",
    });
  };

  const getNodeConfig = (node: StrategyNode) => {
    switch (node.type) {
      case 'deposit':
        return { amount: '$100,000', asset: 'USDC' };
      case 'swap':
        return { slippage: '0.5%', to: 'ETH' };
      case 'farm':
        return { protocol: 'Aave', apy: '12.34%' };
      case 'risk-check':
        return { threshold: 'Medium', score: '7.5/10' };
      default:
        return {};
    }
  };

  return (
    <section className="terminal-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Strategy Builder</h2>
          <input
            type="text"
            placeholder="Strategy name..."
            value={strategyName}
            onChange={(e) => setStrategyName(e.target.value)}
            className="px-3 py-1 bg-input border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-strategy-name"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateStrategy}
            disabled={strategyNodes.length === 0}
            data-testid="button-simulate-strategy"
          >
            <Play className="h-4 w-4 mr-2" />
            Simulate
          </Button>
          <Button
            variant="outline"
            size="sm"
            data-testid="button-load-template"
          >
            <FileText className="h-4 w-4 mr-2" />
            Load Template
          </Button>
          <Button
            size="sm"
            onClick={saveStrategy}
            disabled={saveStrategyMutation.isPending || !strategyName.trim()}
            data-testid="button-save-strategy"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveStrategyMutation.isPending ? "Saving..." : "Save Strategy"}
          </Button>
        </div>
      </div>
      
      <div className="flex space-x-6 h-96">
        {/* Components Panel */}
        <div className="w-48 bg-muted/20 rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Components</h3>
          <div className="space-y-2">
            {componentTypes.map((component) => (
              <Card
                key={component.type}
                className="cursor-move hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => handleDragStart(e, component.type)}
                data-testid={`component-${component.type}`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2">
                    <div className={component.color}>
                      {component.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{component.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {component.description}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Strategy Canvas */}
        <div
          className="flex-1 bg-muted/10 rounded-lg p-6 relative border-2 border-dashed border-border"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-testid="strategy-canvas"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-20 pointer-events-none"></div>
          <div className="relative h-full">
            {strategyNodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <div>
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <p>Drag components here to build your strategy</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 items-start">
                {strategyNodes.map((node, index) => {
                  const component = componentTypes.find(c => c.type === node.type);
                  const config = getNodeConfig(node);
                  
                  return (
                    <div key={node.id} className="flex items-center">
                      <Card
                        className="w-32 bg-background border-2 hover:shadow-lg transition-all group"
                        data-testid={`strategy-node-${node.id}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-between mb-2">
                            <div className={`${component?.color} flex-1 flex justify-center`}>
                              {component?.icon}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeNode(node.id)}
                              data-testid={`button-remove-node-${node.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-sm font-medium mb-1">{component?.label}</div>
                          <div className="space-y-1">
                            {Object.entries(config).map(([key, value]) => (
                              <div key={key} className="text-xs text-muted-foreground">
                                {value}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      {index < strategyNodes.length - 1 && (
                        <div className="w-8 h-px bg-border mx-2"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
