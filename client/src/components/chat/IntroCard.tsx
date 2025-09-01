import { useState } from 'react';
import { ArrowRight, Sparkles, Bell, TrendingUp, Shield, ChevronDown, ChevronUp } from 'lucide-react';

interface IntroCardProps {
  onSendMessage: (message: string) => void;
}

const defaultChips = [
  { text: "Deploy USDC for highest APY", icon: TrendingUp },
  { text: "Auto-rebalance 50% SOL across top 3 TVL", icon: Sparkles },
  { text: "Notify me if USDC APR < 7%", icon: Bell },
  { text: "Largest yield sources on Solana by TVL", icon: TrendingUp },
  { text: "Yield sources for WETH & SOL", icon: Shield },
];

export function IntroCard({ onSendMessage }: IntroCardProps) {
  const [showMore, setShowMore] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleChipClick = async (chipText: string) => {
    setHasInteracted(true);
    if (showMore) setShowMore(false); // Collapse detail after interaction
    
    try {
      // Use the same sendMessage function that's passed down from ChatSidebar
      await onSendMessage(chipText);
    } catch (error) {
      console.error('Failed to send chip message:', error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, chipText: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleChipClick(chipText);
    }
  };

  const compactWelcomeEnabled = import.meta.env.VITE_CHAT_COMPACT_WELCOME !== '0';
  
  if (!compactWelcomeEnabled) {
    // Fallback to old welcome text
    return (
      <div className="text-sm text-muted-foreground">
        Hello! I'm Blossom, your DeFi Strategy Assistant. I can help you:
        <br /><br />
        • Deploy USDC for highest APY<br />
        • Auto rebalance portfolios<br />
        • Set yield alerts<br />
        • Find yield sources<br />
        • Assess risk<br /><br />
        What would you like to explore today?
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Hello! I'm Blossom, your DeFi Strategy Assistant.</span>
      </div>

      {/* Capabilities line */}
      <p className="text-sm text-muted-foreground">
        I can help you find yields, manage risk, and optimize your DeFi strategy.
      </p>

      {/* Clickable chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {defaultChips.map((chip, index) => {
          const IconComponent = chip.icon;
          return (
            <button
              key={index}
              onClick={() => handleChipClick(chip.text)}
              onKeyDown={(e) => handleKeyDown(e, chip.text)}
              role="button"
              tabIndex={0}
              className="flex items-center gap-2 p-2 text-xs rounded-md bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 hover:dark:bg-zinc-700 transition-all duration-150 text-left group"
            >
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <IconComponent className="h-3 w-3 text-muted-foreground" />
              <span className="text-foreground/80 group-hover:text-foreground">{chip.text}</span>
            </button>
          );
        })}
      </div>

      {/* Show more section */}
      {!hasInteracted && (
        <div className="border-t border-border/50 pt-2">
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Show {showMore ? 'less' : 'more'}
          </button>
          
          {showMore && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              I analyze live data from DeFiLlama, CoinGecko, and other sources to provide real-time yield opportunities, 
              risk assessments, and portfolio optimization strategies across multiple chains including Ethereum, Solana, 
              Polygon, and more.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
