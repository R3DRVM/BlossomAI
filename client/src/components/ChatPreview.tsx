import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Play, Pause } from "lucide-react";

// Timing configuration
const CHAT_TIMING = {
  userTypeMsPerChar: 15,   // min 10, max 25
  aiTypeMsPerChar: 18,
  minGapMs: 300,           // gap between bubbles
  holdAfterAiMs: 2400,     // dwell time after AI finishes
  maxCycleMs: 12000        // safety stop per scenario
};

// Institutional scenarios
const scriptedScenarios = [
  {
    id: 'market-maker',
    user: "Deploy $50M with institutional controls.",
    ai: "Route to short-duration MM pools, satellite RWA treasuries (KYC custody), hedge via vol-controlled vaults. Blended APY 9.8–12.4%, 95% daily liquidity."
  },
  {
    id: 'treasury',
    user: "Target 6–8% APY; T+0 liquidity.",
    ai: "30% USDC staking, 40% LST/LRT ladder, 30% short-duration lending. Real-time risk checks; auto-rebalance on drawdown >1.5%."
  },
  {
    id: 'quant-desk',
    user: "Cross-chain execution with VaR <2%.",
    ai: "ETH/SOL/INJ split; basis capture + funding arb; cap pool concentration 20%. Live VaR 1.7%; expected slippage <7 bps."
  },
  {
    id: 'exchanges',
    user: "Idle float $25M—minimize exposure.",
    ai: "Staggered maturities (7/14/30d), insured vault whitelist, automatic unwind on liquidity stress signal."
  }
];

type ChatState = 'idle' | 'typingUser' | 'typingAI' | 'showingAI' | 'hold';

interface ChatPreviewController {
  state: ChatState;
  currentScenario: number;
  cycleCount: number;
  isVisible: boolean;
  isPaused: boolean;
  abortController: AbortController | null;
}

export function ChatPreview() {
  const [, setLocation] = useLocation();
  const [controller, setController] = useState<ChatPreviewController>({
    state: 'idle',
    currentScenario: 0,
    cycleCount: 0,
    isVisible: true,
    isPaused: false,
    abortController: null
  });
  
  const [displayedUserText, setDisplayedUserText] = useState('');
  const [displayedAiText, setDisplayedAiText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timerRefs = useRef<Set<NodeJS.Timeout>>(new Set());
  const prefersReducedMotion = useRef(false);

  // Check for reduced motion preference and start demo
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion.current) {
      // Show instant messages for reduced motion
      const scenario = scriptedScenarios[0];
      setDisplayedUserText(scenario.user);
      setDisplayedAiText(scenario.ai);
      setShowResponse(true);
      setController(prev => ({ ...prev, state: 'showingAI' }));
    } else {
      // Start the demo after a short delay
      const timer = setTimeout(() => {
        runScenario();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [runScenario]);

  // Setup intersection observer for visibility
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visibility = entry.intersectionRatio;
        const isVisible = visibility >= 0.35;
        
        setController(prev => {
          if (prev.isVisible !== isVisible) {
            if (isVisible && prev.state === 'idle' && prev.cycleCount < 3) {
              // Resume or start when visible
              addTimer(() => runScenario(), 500);
            }
            return { ...prev, isVisible, isPaused: !isVisible };
          }
          return prev;
        });
      },
      { threshold: [0, 0.35, 1] }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Handle document visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setController(prev => ({ ...prev, isPaused: isHidden }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current.clear();
      if (controller.abortController) {
        controller.abortController.abort();
      }
    };
  }, [controller.abortController]);

  const addTimer = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timerRefs.current.delete(timer);
      if (!controller.isPaused) {
        callback();
      }
    }, delay);
    timerRefs.current.add(timer);
    return timer;
  }, [controller.isPaused]);

  const clearAllTimers = useCallback(() => {
    timerRefs.current.forEach(timer => clearTimeout(timer));
    timerRefs.current.clear();
  }, []);

  const runScenario = useCallback(async () => {
    setController(prev => {
      if (prev.state !== 'idle' || prev.cycleCount >= 3) return prev;
      
      // Cancel any existing scenario
      if (prev.abortController) {
        prev.abortController.abort();
      }

      const abortController = new AbortController();
      const scenario = scriptedScenarios[prev.currentScenario];
      
      if (prefersReducedMotion.current) {
        // Instant display for reduced motion
        setDisplayedUserText(scenario.user);
        setDisplayedAiText(scenario.ai);
        setShowResponse(true);
        return { 
          ...prev, 
          abortController,
          state: 'showingAI',
          currentScenario: (prev.currentScenario + 1) % scriptedScenarios.length,
          cycleCount: prev.cycleCount + 1
        };
      }

      // Type user message
      setDisplayedUserText('');
      setDisplayedAiText('');
      setShowResponse(false);
      setIsTyping(false);

      let userIndex = 0;
      const typeUser = () => {
        if (abortController.signal.aborted) return;
        if (userIndex < scenario.user.length) {
          setDisplayedUserText(scenario.user.slice(0, userIndex + 1));
          userIndex++;
          addTimer(typeUser, CHAT_TIMING.userTypeMsPerChar);
        } else {
          // Start typing AI after gap
          addTimer(() => {
            if (abortController.signal.aborted) return;
            setController(prev => ({ ...prev, state: 'typingAI' }));
            setIsTyping(true);
            typeAI();
          }, CHAT_TIMING.minGapMs);
        }
      };

      const typeAI = () => {
        if (abortController.signal.aborted) return;
        let aiIndex = 0;
        const typeAiChar = () => {
          if (abortController.signal.aborted) return;
          if (aiIndex < scenario.ai.length) {
            setDisplayedAiText(scenario.ai.slice(0, aiIndex + 1));
            aiIndex++;
            addTimer(typeAiChar, CHAT_TIMING.aiTypeMsPerChar);
          } else {
            // AI finished typing
            setIsTyping(false);
            setShowResponse(true);
            setController(prev => ({ ...prev, state: 'showingAI' }));
            
            // Hold for a bit, then move to next scenario
            addTimer(() => {
              if (abortController.signal.aborted) return;
              nextScenario();
            }, CHAT_TIMING.holdAfterAiMs);
          }
        };
        typeAiChar();
      };

      typeUser();
      return { ...prev, abortController, state: 'typingUser' };
    });
  }, [addTimer]);

  const nextScenario = useCallback(() => {
    setController(prev => {
      const newCycleCount = prev.cycleCount + 1;
      const newState = {
        ...prev,
        state: 'idle' as ChatState,
        currentScenario: (prev.currentScenario + 1) % scriptedScenarios.length,
        cycleCount: newCycleCount
      };
      
      // Start next scenario if not at max cycles
      if (newCycleCount < 3) {
        addTimer(() => runScenario(), 2000);
      }
      
      return newState;
    });
  }, [addTimer, runScenario]);

  const togglePlayPause = () => {
    if (controller.state === 'idle' && controller.cycleCount < 3) {
      runScenario();
    } else {
      clearAllTimers();
      setController(prev => ({ ...prev, state: 'idle', isPaused: !prev.isPaused }));
    }
  };


  return (
    <motion.div
      ref={containerRef}
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
                {controller.isPaused && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
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
            {controller.state === 'idle' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{controller.state === 'idle' ? 'Start Demo' : 'Pause'}</span>
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