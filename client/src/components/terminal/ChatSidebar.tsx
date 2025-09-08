import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useChatStore } from "@/ai/useChatStore";
import { IntroCard } from "../chat/IntroCard";
import { ChatHeaderMenu } from "../chat/ChatHeaderMenu";
import { MicroCTAs } from "../chat/MicroCTAs";
import { resetChatForUser } from "@/ai/store";
import { Bot, User, Send, Loader2, Zap, BarChart3, AlertCircle, ArrowRight, Shield } from "lucide-react";

export function ChatSidebar() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    messages, 
    isLoading, 
    isTyping, 
    isStreaming, 
    sendMessage,
    resetChat
  } = useChatStore();

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} submit:preventDefault`);
    }
    
    if (!message.trim() || isSending) return;
    
    const messageToSend = message.trim();
    setMessage(""); // Clear immediately to show responsiveness
    setIsSending(true);
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      // Restore message on error
      setMessage(messageToSend);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} submit:preventDefault`);
      handleSubmit();
    }
  };

  const handleWorkflowAction = async (action: string) => {
    let messageText = "";
    switch (action) {
      case "deploy_highest_yield":
        messageText = "Find me the highest APY opportunities for USDC deployment";
        break;
      case "auto_rebalance":
        messageText = "Help me rebalance my portfolio across top protocols by TVL";
        break;
      case "yield_alerts":
        messageText = "Set up alerts for when my USDC APR drops below 7%";
        break;
      case "find_yields":
        messageText = "List the largest yield sources on Solana by TVL for my holdings";
        break;
      case "risk_assessment":
        messageText = "Analyze the risk vs reward for my current DeFi positions";
        break;
      default:
        messageText = "Help me optimize my DeFi strategy";
    }
    
    setMessage(messageText);
    setIsSending(true);
    try {
      await sendMessage(messageText);
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };



  // Quick actions removed - now handled by IntroCard

  const formatTime = (dateString: string | Date | null) => {
    if (!dateString) return '';
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Mount/unmount logging
  useEffect(() => {
    console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} panel:mount`);
    return () => {
      console.log(`[DEBUG_CHAT] ${new Date().toISOString().slice(-12, -1)} panel:unmount`);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Greeting is now handled automatically by the store

  return (
    <aside className="terminal-panel row-span-2 flex flex-col border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-chart-2/5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Blossom</h3>
            <p className="text-xs text-muted-foreground">DeFi Strategy Assistant</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
            <ChatHeaderMenu onResetChat={resetChat} />
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
              <div key={msg.id} className={`chat-message ${msg.role === 'assistant' ? '' : 'ml-8'}`}>
                <div className={`rounded-lg p-3 ${
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-r from-muted/80 to-muted/60 border border-border/50' 
                    : 'bg-pink-500 text-white ml-auto max-w-[85%] dark:bg-pink-500'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Bot className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">Blossom</span>
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.kind === 'welcome' && msg.role === 'assistant' ? (
                      <IntroCard onSendMessage={sendMessage} />
                    ) : (
                      <span dangerouslySetInnerHTML={{ 
                        __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      }} />
                    )}
                  </div>
                  {msg.role === 'assistant' && msg.metadata?.microCTAs && (
                    <MicroCTAs 
                      ctas={msg.metadata.microCTAs} 
                      onAction={async (action, data) => {
                        // Handle CTA actions
                        if (action === 'navigate') {
                          // This would be handled by the parent component
                          console.log('Navigate to:', data);
                        } else if (action === 'toast') {
                          toast(data);
                        } else if (action === 'execute') {
                          // Execute the plan
                          await sendMessage("yes, let's deploy");
                        } else if (action === 'adjust') {
                          // Adjust the plan
                          await sendMessage("let's adjust the amount");
                        } else if (action === 'cancel') {
                          // Cancel the plan
                          await sendMessage("cancel");
                        }
                      }}
                    />
                  )}
                  {msg.role === 'user' && (
                    <div className="text-xs opacity-70 mt-2 text-right">
                      {formatTime(new Date(msg.createdAt))}
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
                    <span className="text-xs font-medium text-primary">Blossom</span>
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
        <form onSubmit={handleSubmit} className="flex space-x-2 mb-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about DeFi strategies..."
            className="flex-1 bg-background/80"
            disabled={isSending || isTyping}
            data-testid="input-chat-message"
          />
          <Button
            type="submit"
            disabled={!message.trim() || isSending || isTyping}
            size="icon"
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
            data-testid="button-send-message"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

      </div>
    </aside>
  );
}
