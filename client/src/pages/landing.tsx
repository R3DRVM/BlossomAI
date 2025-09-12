import { Logo } from "@/components/ui/logo";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Hero } from "@/components/Hero";
import { ChatPreview } from "@/components/ChatPreview";
import { SplitProblem } from "@/components/SplitProblem";
import { Metrics } from "@/components/Metrics";
import { CapitalBand } from "@/components/CapitalBand";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Partners } from "@/components/Partners";
import { BottomCta } from "@/components/BottomCta";
import { FloatingChat } from "@/components/FloatingChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import "@/styles/gradients.css";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-unified">
      {/* Unified background layers */}
      <div className="bg-grain" />
      
      {/* Sticky Navigation */}
      <header className="sticky-nav">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size={48} className="flex-shrink-0" />
              <span className="text-xl font-bold gradient-text">
                Blossom
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button 
                onClick={() => setLocation('/terminal')} 
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-glow"
                data-testid="button-login"
              >
                Access Terminal
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <ChatPreview />
        <SplitProblem />
        <Metrics />
        <CapitalBand />
        <FeatureGrid />
        <Partners />
        <BottomCta />
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 dark:border-white/10 light:border-gray-200 py-12 px-6 md:px-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-purple-600 rounded">
                <div className="h-4 w-4 text-white m-1 flex items-center justify-center text-xs font-bold">B</div>
              </div>
              <span className="font-medium text-white dark:text-white gradient-text">Blossom</span>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600">
              © 2025 Blossom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Chat */}
      <FloatingChat />
    </div>
  );
}
