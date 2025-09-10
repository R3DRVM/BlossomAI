import { Logo } from "@/components/ui/logo";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Hero } from "@/components/Hero";
import { SplitProblem } from "@/components/SplitProblem";
import { Metrics } from "@/components/Metrics";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Partners } from "@/components/Partners";
import { BottomCta } from "@/components/BottomCta";
import { FloatingChat } from "@/components/FloatingChat";
import "@/styles/gradients.css";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-brand-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size={48} className="flex-shrink-0" />
              <span className="text-xl font-bold bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">
                Blossom
              </span>
            </div>
            <button 
              onClick={() => setLocation('/terminal')} 
              className="px-6 py-2 bg-brand-pink hover:bg-brand-pink/90 text-white rounded-lg font-semibold transition-all duration-200 hover:scale-105 hover:shadow-glow"
              data-testid="button-login"
            >
              Access Terminal
              <ArrowRight className="ml-2 h-4 w-4 inline" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Hero />
        <SplitProblem />
        <Metrics />
        <FeatureGrid />
        <Partners />
        <BottomCta />
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-border py-12 px-6 md:px-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-brand-pink to-brand-purple rounded">
                <div className="h-4 w-4 text-white m-1 flex items-center justify-center text-xs font-bold">B</div>
              </div>
              <span className="font-medium text-text-primary">Blossom</span>
            </div>
            <p className="text-sm text-text-muted">
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
