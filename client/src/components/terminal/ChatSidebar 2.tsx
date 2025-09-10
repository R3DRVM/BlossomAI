import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ChatMessage } from "@shared/schema";
import { Bot, User, Send, Loader2 } from "lucide-react";

export function ChatSidebar() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat/messages"],
    refetchInterval: 5000, // Poll for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chat/messages", { content, isBot: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      
      // Simulate AI response
      setIsTyping(true);
      setTimeout(() => {
        generateAIResponse();
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

  const generateAIResponse = () => {
    const responses = [
      "I've analyzed the current yield opportunities. Aave USDC offers the best risk-adjusted returns at 12.34% APY with a strong safety score.",
      "Based on your risk profile, I recommend diversifying across 3-4 protocols. Current top picks: Aave (low risk), Compound (medium), and Yearn (higher yield).",
      "Market conditions show increased volatility. Consider reducing exposure to newer protocols and focusing on blue-chip DeFi platforms.",
      "Your portfolio shows good diversification. The current yield-to-risk ratio is optimal for institutional requirements.",
      "I've identified a new arbitrage opportunity between Curve and Uniswap. Expected yield: 15.8% with medium risk exposure.",
      "Risk assessment complete. Smart contract risk is low across your current positions. Liquidity risk has increased 5% due to market conditions."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    aiResponseMutation.mutate(randomResponse);
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    "Best yields",
    "Risk analysis", 
    "Build strategy",
    "Market update",
    "Portfolio review"
  ];

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize with welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      aiResponseMutation.mutate(
        "Welcome to Blossom! I can help you optimize yields, analyze risks, and build custom strategies. What would you like to explore?"
      );
    }
  }, [messages.length, isLoading]);

  return (
    <aside className="terminal-panel row-span-2 flex flex-col border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">BlossomBot</h3>
            <p className="text-xs text-muted-foreground">AI Strategy Assistant</p>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.isBot ? '' : 'ml-8'}`}
                data-testid={`message-${msg.id}`}
              >
                <div className={`rounded-lg p-3 ${
                  msg.isBot 
                    ? 'bg-muted' 
                    : 'bg-primary text-primary-foreground ml-auto max-w-[80%]'
                }`}>
                  {msg.isBot && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium">BlossomBot</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {!msg.isBot && (
                    <div className="text-xs opacity-80 mt-1 text-right">
                      {formatTime(msg.createdAt)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-message">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">BlossomBot</span>
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
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2 mb-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about yields, strategies, or risks..."
            className="flex-1"
            disabled={sendMessageMutation.isPending || isTyping}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending || isTyping}
            size="icon"
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
        <div className="flex flex-wrap gap-1">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setMessage(action)}
              disabled={sendMessageMutation.isPending || isTyping}
              data-testid={`button-quick-action-${action.replace(' ', '-')}`}
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
