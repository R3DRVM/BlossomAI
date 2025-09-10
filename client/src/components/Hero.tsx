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
      {/* Floating glow elements */}
      <div className="floating-glow pink" />
      <div className="floating-glow purple" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
        <motion.div
          variants={heroText}
          initial="hidden"
          animate="show"
          className="space-y-12"
        >
          {/* Badge */}
          <motion.div variants={heroTextItem}>
            <Badge variant="secondary" className="mb-8 text-sm font-medium tracking-wide">
              Institutional DeFi Platform
            </Badge>
          </motion.div>

          {/* Main headline with refined typography */}
          <motion.h1
            variants={heroTextItem}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight"
          >
            <span className="text-white">Blossom is the </span>
            <span className="gradient-text">institutional aggregator</span>
            <span className="text-white"> — built for large-scale capital deployment, </span>
            <span className="gradient-text">powered by AI insights</span>
            <span className="text-white">, trusted by foundations.</span>
          </motion.h1>

          {/* Subline with tighter spacing */}
          <motion.p
            variants={heroTextItem}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light"
          >
            From treasuries to quant funds to end-users, Blossom unifies the entire yield lifecycle — 
            discover, execute, and manage DeFi strategies at institutional scale.
          </motion.p>

          {/* Social proof */}
          <motion.div
            variants={heroTextItem}
            className="pt-6"
          >
            <p className="text-sm text-gray-400 mb-4 tracking-wide">Backed by</p>
            <div className="flex items-center justify-center space-x-8 text-gray-400/70">
              <div className="text-lg font-semibold tracking-wide">Solana Foundation</div>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="text-lg font-semibold tracking-wide">Injective Foundation</div>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="text-lg font-semibold tracking-wide">Leading DeFi Builders</div>
            </div>
          </motion.div>

          {/* CTAs with aura effect */}
          <motion.div
            variants={heroTextItem}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12"
          >
            <motion.div
              variants={ctaButton}
              initial="rest"
              whileHover="hover"
              className="cta-aura"
            >
              <Button
                size="lg"
                onClick={() => setLocation('/terminal')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-10 py-4 text-lg font-semibold transition-all duration-300"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-600 text-white hover:bg-white/5 hover:border-pink-500/50 px-10 py-4 text-lg font-semibold transition-all duration-300 backdrop-blur-sm"
            >
              View Demo
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
