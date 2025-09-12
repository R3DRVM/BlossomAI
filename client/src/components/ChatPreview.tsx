import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Play } from "lucide-react";

const scriptedConversation = {
  user: "Deploy $50M with institutional controls. Minimize exposure, maintain liquidity.",
  blossom: "Allocating across Solana, Ethereum, and Injective.\n• Base: short-duration MM pools (T+0 exit)\n• Satellite: RWA treasuries (KYC custody)\n• Hedge: volatility vaults with max VaR 2.5%\nProjected blended APY: 9.8–12.4%, 95% daily liquidity."
};

export function ChatPreview() {
  const [, setLocation] = useLocation();
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        // Instant reveal for reduced motion
        setIsTyping(false);
        setDisplayedText(scriptedConversation.blossom);
        setShowResponse(true);
      } else {
        // Start the conversation with animations
        setIsTyping(true);
        setDisplayedText("");
        setShowResponse(false);

        // Show user message immediately
        setTimeout(() => {
          setIsTyping(false);
          
          // Start typing response after 350ms thinking delay
          setTimeout(() => {
            setIsTyping(true);
            typeResponse();
          }, 350);
        }, 1000);
      }
    }
  }, [isPlaying]);

  const typeResponse = () => {
    const text = scriptedConversation.blossom;
    let index = 0;
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        setShowResponse(true);
      }
    }, 30); // 30ms per character for smooth typing
  };

  const startDemo = () => {
    setIsPlaying(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="max-w-2xl mx-auto mb-16"
    >
      <div className="glass-card rounded-xl shadow-elev p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white dark:text-white light:text-[#0E1116]">
                Blossom AI Preview
              </h3>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
                  simulation
                </span>
              </div>
            </div>
          </div>
          
          {!isPlaying && (
            <button
              onClick={startDemo}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              <Play className="w-4 h-4" />
              <span>Start Demo</span>
            </button>
          )}
        </div>

        {/* Chat Messages */}
        <div className="space-y-4">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl rounded-br-md p-4 max-w-xs">
              <p className="text-sm text-white dark:text-white light:text-[#0E1116]">
                {scriptedConversation.user}
              </p>
            </div>
          </div>

          {/* Blossom Response */}
          <div className="flex justify-start">
            <div className="bg-white/5 dark:bg-white/5 light:bg-black/5 rounded-2xl rounded-bl-md p-4 max-w-md">
              {isTyping ? (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-gray-400">Blossom is thinking...</span>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-white dark:text-white light:text-[#0E1116] whitespace-pre-line">
                    {displayedText}
                  </p>
                  {showResponse && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        Generated strategy (sample)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10 light:border-black/10">
          <button
            onClick={() => setLocation('/terminal')}
            className="text-sm text-pink-500 hover:text-pink-400 transition-colors duration-200 underline decoration-dotted underline-offset-4"
          >
            View a full demo →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
