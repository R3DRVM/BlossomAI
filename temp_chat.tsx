import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessage } from "@shared/schema";
import { Bot, User, Send, Loader2, Zap, BarChart3, AlertCircle, ArrowRight, Shield } from "lucide-react";

export function ChatSidebar() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    // Temporarily disabled polling to fix refresh issues
    // refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chat/messages", { content, isBot: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      
      setIsTyping(true);
      setTimeout(() => {
        generateIntelligentResponse(message);
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const aiResponseMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chat/messages", { content, isBot: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setIsTyping(false);
    },
  });

  const generateIntelligentResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Intent-based response generation
    if (lowerMessage.includes('yield') || lowerMessage.includes('apy') || lowerMessage.includes('return')) {
      const response = `🎯 **Yield Analysis Complete**\n\nBased on current market conditions:\n\n**🔥 Top Opportunities Right Now:**\n• **Aave V3 USDC**: 12.5% APY (Low Risk)\n• **Compound USDT**: 11.2% APY (Low Risk)\n• **Morpho ETH**: 18.5% APY (Medium Risk)\n• **Spark DAI**: 15.8% APY (Medium Risk)\n\n**My Recommendation:**\nDiversify across 2-3 protocols for optimal risk/reward. Consider your risk tolerance and time horizon.\n\nWould you like me to help you deploy to any of these protocols?`;
      aiResponseMutation.mutate(response);
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('safe') || lowerMessage.includes('secure')) {
      const response = `🛡️ **Risk Assessment Analysis**\n\n**Current Market Risk Levels:**\n• **Low Risk**: Aave, Compound, Lido (8-12% APY)\n• **Medium Risk**: Morpho, Spark, Yearn (12-18% APY)\n• **High Risk**: New protocols, leverage strategies (18%+ APY)\n\n**Risk Mitigation Strategies:**\n• Diversify across multiple protocols\n• Use established protocols with high TVL\n• Set stop-losses and position limits\n• Regular portfolio rebalancing\n\nWhat's your risk tolerance level?`;
      aiResponseMutation.mutate(response);
    } else if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance') || lowerMessage.includes('rebalance')) {
      const response = `⚖️ **Portfolio Optimization**\n\n**Current Market Conditions:**\n• **Stablecoins**: 8-12% APY (Conservative)\n• **ETH/BTC**: 15-20% APY (Moderate)\n• **DeFi Tokens**: 20-30% APY (Aggressive)\n\n**Rebalancing Recommendations:**\n• **Conservative**: 70% Stablecoins, 20% ETH, 10% DeFi\n• **Moderate**: 50% Stablecoins, 30% ETH, 20% DeFi\n• **Aggressive**: 30% Stablecoins, 40% ETH, 30% DeFi\n\nWould you like me to help you rebalance your portfolio?`;
      aiResponseMutation.mutate(response);
    } else if (lowerMessage.includes('strategy') || lowerMessage.includes('build') || lowerMessage.includes('create')) {
      const response = `🏗️ **Strategy Builder**\n\nI can help you build custom DeFi strategies:\n\n**Strategy Types:**\n• **Yield Farming**: Optimize for maximum APY\n• **Liquidity Provision**: Earn fees + rewards\n• **Arbitrage**: Capture price differences\n• **Portfolio Rebalancing**: Maintain optimal allocations\n\n**Let's Build Together:**\nWhat's your investment goal? (High yield, low risk, or balanced?)`;
      aiResponseMutation.mutate(response);
    } else {
      // Default intelligent response
      const responses = [
        "I'm analyzing your request and will provide detailed DeFi insights shortly. What specific aspect would you like me to focus on?",
        "Great question! Let me gather current market data and provide you with actionable DeFi strategies.",
        "I can help you optimize yields, manage risk, and build strategies. What's your primary goal today?",
        "Let me break down the current DeFi landscape and find the best opportunities for you.",
        "I'm processing market conditions to give you the most relevant DeFi advice."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      aiResponseMutation.mutate(randomResponse);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleWorkflowAction = (action: string) => {
    let message = "";
    switch (action) {
      case "deploy_highest_yield":
        message = "Find me the highest APY opportunities for USDC deployment";
        break;
      case "auto_rebalance":
        message = "Help me rebalance my portfolio across top protocols by TVL";
        break;
      case "yield_alerts":
        message = "Set up alerts for when my USDC APR drops below 7%";
        break;
      case "find_yields":
        message = "List the largest yield sources on Solana by TVL for my holdings";
        break;
      case "risk_assessment":
        message = "Analyze the risk vs reward for my current DeFi positions";
        break;
      default:
        message = "Help me optimize my DeFi strategy";
    }
    
    setMessage(message);
    sendMessageMutation.mutate(message);
  };



  const quickActions = [
    "Deploy USDC for highest yield",
    "Auto-rebalance portfolio", 
    "Set yield alerts",
    "Find yield sources",
    "Risk analysis"
  ];

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      aiResponseMutation.mutate(
        `Hello! I'm **BlossomAI**, your DeFi Strategy Assistant! 🚀\n\nI can help you with:\n\n• **Deploy USDC for highest APY** - Find and deploy to the best yielding protocols\n• **Auto-rebalance portfolios** - Intelligently rebalance across top protocols by TVL\n• **Set yield alerts** - Get notified when APY drops below your threshold\n• **Find yield sources** - Discover new opportunities for your holdings\n• **Assess risk** - Analyze risk vs reward for your strategies\n\nWhat would you like to accomplish today?`
      );
    }
  }, [messages.length, isLoading]);

  return (
    <aside className="terminal-panel row-span-2 flex flex-col border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-chart-2/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">BlossomAI</h3>
            <p className="text-xs text-muted-foreground">DeFi Strategy Assistant</p>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>
      


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100vh - 200px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.isBot ? '' : 'ml-8'}`}>
                <div className={`rounded-lg p-3 ${
                  msg.isBot 
                    ? 'bg-gradient-to-r from-muted/80 to-muted/60 border border-border/50' 
                    : 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto max-w-[85%]'
                }`}>
                  {msg.isBot && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">BlossomAI</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.isBot && msg.content.includes('Deploy USDC for highest APY') ? (
                      <div>
                        <div className="mb-3">
                          Hello! I'm <strong>BlossomAI</strong>, your DeFi Strategy Assistant! 🚀
                        </div>
                        <div className="mb-3">
                          I can help you with:
                        </div>
                        <div className="space-y-2">
                          <button 
                            onClick={() => handleWorkflowAction('deploy_highest_yield')}
                            className="block w-full text-left p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
                          >
                            🚀 <strong>Deploy USDC for highest APY</strong> - Find and deploy to the best yielding protocols
                          </button>
                          <button 
                            onClick={() => handleWorkflowAction('auto_rebalance')}
                            className="block w-full text-left p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 transition-colors cursor-pointer"
                          >
                            ⚖️ <strong>Auto-rebalance portfolios</strong> - Intelligently rebalance across top protocols by TVL
                          </button>
                          <button 
                            onClick={() => handleWorkflowAction('yield_alerts')}
                            className="block w-full text-left p-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-colors cursor-pointer"
                          >
                            🔔 <strong>Set yield alerts</strong> - Get notified when APY drops below your threshold
                          </button>
                          <button 
                            onClick={() => handleWorkflowAction('find_yields')}
                            className="block w-full text-left p-2 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/20 transition-colors cursor-pointer"
                          >
                            📊 <strong>Find yield sources</strong> - Discover new opportunities for your holdings
                          </button>
                          <button 
                            onClick={() => handleWorkflowAction('risk_assessment')}
                            className="block w-full text-left p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors cursor-pointer"
                          >
                            🛡️ <strong>Assess risk</strong> - Analyze risk vs reward for your strategies
                          </button>
                        </div>
                        <div className="mt-3 text-muted-foreground">
                          What would you like to accomplish today?
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {!msg.isBot && (
                    <div className="text-xs opacity-70 mt-2 text-right">
                      {formatTime(msg.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="chat-message">
                <div className="bg-gradient-to-r from-muted/80 to-muted/60 border border-border/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">BlossomAI</span>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-border bg-gradient-to-r from-background to-muted/20">
        <div className="flex space-x-2 mb-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about DeFi strategies..."
            className="flex-1 bg-background/80"
            disabled={sendMessageMutation.isPending || isTyping}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending || isTyping}
            size="icon"
            className="bg-gradient-to-r from-primary to-chart-2 hover:from-primary/90 hover:to-chart-2/90"
            data-testid="button-send-message"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              className="text-xs h-7 px-3 bg-background/60 hover:bg-primary/10 border-border/50"
              onClick={() => setMessage(action)}
              disabled={sendMessageMutation.isPending || isTyping}
              data-testid={`button-quick-action-${action.replace(' ', '-')}`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {action}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
