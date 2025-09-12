import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Play, Pause } from "lucide-react";

// Institutional scenarios
const scenarios = [
  {
    user: "Deploy $50M with institutional controls.",
    ai: "Route to short-duration MM pools, satellite RWA treasuries (KYC custody), hedge via vol-controlled vaults. Blended APY 9.8–12.4%, 95% daily liquidity."
  },
  {
    user: "Target 6–8% APY; T+0 liquidity.",
    ai: "30% USDC staking, 40% LST/LRT ladder, 30% short-duration lending. Real-time risk checks; auto-rebalance on drawdown >1.5%."
  },
  {
    user: "Cross-chain execution with VaR <2%.",
    ai: "ETH/SOL/INJ split; basis capture + funding arb; cap pool concentration 20%. Live VaR 1.7%; expected slippage <7 bps."
  },
  {
    user: "Idle float $25M—minimize exposure.",
    ai: "Staggered maturities (7/14/30d), insured vault whitelist, automatic unwind on liquidity stress signal."
  }
];

export function ChatPreview() {
  const [, setLocation] = useLocation();
  const [currentScenario, setCurrentScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedUserText, setDisplayedUserText] = useState('');
  const [displayedAiText, setDisplayedAiText] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef(true);

  // Clear all timeouts
  const clearTimeouts = () => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  };

  // Add timeout with tracking
  const addTimeout = (callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        callback();
      }
    }, delay);
    timeoutRefs.current.push(timeout);
    return timeout;
  };

  // Type text character by character
  const typeText = (text: string, setter: (text: string) => void, speed: number = 20) => {
    let index = 0;
    const typeChar = () => {
      if (index < text.length && isMountedRef.current) {
        setter(text.slice(0, index + 1));
        index++;
        addTimeout(typeChar, speed);
      }
    };
    typeChar();
  };

  // Run a single scenario
  const runScenario = () => {
    if (!isMountedRef.current || cycleCount >= 3) return;
    
    const scenario = scenarios[currentScenario];
    
    // Clear previous state
    setDisplayedUserText('');
    setDisplayedAiText('');
    setShowResponse(false);
    setIsTyping(false);

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Instant display for reduced motion
      setDisplayedUserText(scenario.user);
      setDisplayedAiText(scenario.ai);
      setShowResponse(true);
      
      // Auto-advance after 3 seconds
      addTimeout(() => {
        nextScenario();
      }, 3000);
      return;
    }

    // Type user message
    addTimeout(() => {
      typeText(scenario.user, setDisplayedUserText, 15);
      
      // Start typing AI after user message is done
      addTimeout(() => {
        setIsTyping(true);
        typeText(scenario.ai, (text) => {
          setDisplayedAiText(text);
          if (text === scenario.ai) {
            setIsTyping(false);
            setShowResponse(true);
            
            // Move to next scenario after hold
            addTimeout(() => {
              nextScenario();
            }, 2400);
          }
        }, 18);
      }, scenario.user.length * 15 + 300);
    }, 500);
  };

  // Move to next scenario
  const nextScenario = () => {
    if (!isMountedRef.current) return;
    
    setCurrentScenario(prev => (prev + 1) % scenarios.length);
    setCycleCount(prev => prev + 1);
    
    // Start next scenario if not at max cycles
    if (cycleCount < 2) {
      addTimeout(() => {
        runScenario();
      }, 2000);
    }
  };

  // Start the demo
  const startDemo = () => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    setCycleCount(0);
    setCurrentScenario(0);
    runScenario();
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearTimeouts();
    } else {
      startDemo();
    }
  };

  // Auto-start on mount
  useEffect(() => {
    addTimeout(() => {
      if (isMountedRef.current) {
        startDemo();
      }
    }, 1500);

    return () => {
      isMountedRef.current = false;
      clearTimeouts();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearTimeouts();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="max-w-2xl mx-auto mb-16"
    >
      <div className="glass rounded-xl p-6 relative overflow-hidden">
        <div className="shimmer-overlay" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black gradient-text">
                Blossom AI Preview
              </h3>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
                  simulation
                </span>
                {!isPlaying && cycleCount > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                    paused
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={togglePlayPause}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Start Demo'}</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="space-y-4">
          {/* User Message */}
          {displayedUserText && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex justify-end"
            >
              <div className="bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl rounded-br-md p-4 max-w-xs hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
                <p className="text-sm gradient-text">
                  {displayedUserText}
                </p>
              </div>
            </motion.div>
          )}

          {/* Blossom Response */}
          <motion.div 
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex justify-start"
          >
            <div className="bg-white/5 dark:bg-white/5 light:bg-black/5 rounded-2xl rounded-bl-md p-4 max-w-md hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300">
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
                  <p className="text-sm gradient-text whitespace-pre-line">
                    {displayedAiText}
                  </p>
                  {showResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="mt-3"
                    >
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                        Generated strategy (sample)
                      </span>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 dark:border-white/10 light:border-black/10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLocation('/terminal')}
              className="text-sm text-pink-500 hover:text-pink-400 transition-colors duration-200 underline decoration-dotted underline-offset-4"
            >
              View a full demo →
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-500 light:text-gray-500">
              Simulation • Not investment advice
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}