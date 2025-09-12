import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { heroText, heroTextItem, ctaButton } from "@/lib/motion";
import { useLocation } from "wouter";

export function Hero() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Parallax gradient background */}
      <div 
        className="absolute inset-0 opacity-20 dark:opacity-30 light:opacity-8"
        style={{
          background: 'var(--grad-soft)',
          '--x': '80%',
          '--y': '20%'
        }}
      />
      
      {/* Floating glow elements */}
      <div className="floating-glow pink" />
      <div className="floating-glow purple" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
        <motion.div
          variants={heroText}
          initial="hidden"
          animate="show"
          className="space-y-10"
        >
          {/* Badge */}
          <motion.div variants={heroTextItem}>
            <Badge variant="secondary" className="mb-6 text-sm font-medium tracking-wide">
              Institutional DeFi Platform
            </Badge>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={heroTextItem}
            className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight"
          >
            <span className="text-white dark:text-white gradient-text">Deploy millions, intelligently.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            variants={heroTextItem}
            className="text-xl md:text-2xl text-gray-300 dark:text-gray-300 light:text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            AI insights. Unified risk. Maximum execution.
          </motion.p>

          {/* Tiny line */}
          <motion.p
            variants={heroTextItem}
            className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 tracking-wide"
          >
            Built on ElizaOS v2 • Incubated by Eliza Foundation
          </motion.p>

          {/* Social proof */}
          <motion.div
            variants={heroTextItem}
            className="pt-6"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="px-4 py-2 bg-white/5 dark:bg-white/5 light:bg-black/5 rounded-full border border-white/10 dark:border-white/10 light:border-black/10">
                <span className="text-sm font-semibold tracking-wide text-white dark:text-white light:text-black">Eliza Foundation</span>
              </div>
              <div className="px-4 py-2 bg-white/5 dark:bg-white/5 light:bg-black/5 rounded-full border border-white/10 dark:border-white/10 light:border-black/10">
                <span className="text-sm font-semibold tracking-wide text-white dark:text-white light:text-black">ElizaOS v2</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            variants={heroTextItem}
            className="pt-10 space-y-4"
          >
            <motion.div
              variants={ctaButton}
              initial="rest"
              whileHover="hover"
              className="cta-aura inline-block"
            >
              <Button
                size="lg"
                onClick={() => setLocation('/terminal')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-5 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                style={{
                  background: 'var(--grad)',
                  boxShadow: '0 0 20px rgba(255, 90, 175, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                }}
              >
                Access Terminal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            
            <div className="pt-2">
              <button 
                onClick={() => setLocation('/strategies')}
                className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors duration-200 underline decoration-dotted underline-offset-4"
              >
                View Institutional Brief
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
