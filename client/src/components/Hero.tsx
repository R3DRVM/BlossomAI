import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { heroText, heroTextItem } from "@/lib/motion";
import { useLocation } from "wouter";

export function Hero() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient and orbs */}
      <div className="absolute inset-0 bg-blossom bg-orb" />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 text-center">
        <motion.div
          variants={heroText}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Badge */}
          <motion.div variants={heroTextItem}>
            <Badge variant="secondary" className="mb-6 text-sm font-medium">
              Institutional DeFi Platform
            </Badge>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={heroTextItem}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
          >
            <span className="text-text-primary">Blossom is the </span>
            <span className="text-brand-pink">institutional aggregator</span>
            <span className="text-text-primary"> — built for large-scale capital deployment, </span>
            <span className="text-brand-pink">powered by AI insights</span>
            <span className="text-text-primary">, trusted by foundations.</span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            variants={heroTextItem}
            className="text-xl md:text-2xl text-text-muted max-w-4xl mx-auto leading-relaxed font-light"
          >
            From treasuries to quant funds to end-users, Blossom unifies the entire yield lifecycle — 
            discover, execute, and manage DeFi strategies at institutional scale.
          </motion.p>

          {/* Social proof */}
          <motion.div
            variants={heroTextItem}
            className="pt-4"
          >
            <p className="text-sm text-text-muted mb-4">Backed by</p>
            <div className="flex items-center justify-center space-x-8 text-text-muted/60">
              <div className="text-lg font-semibold">Solana Foundation</div>
              <div className="w-px h-6 bg-brand-border"></div>
              <div className="text-lg font-semibold">Injective Foundation</div>
              <div className="w-px h-6 bg-brand-border"></div>
              <div className="text-lg font-semibold">Leading DeFi Builders</div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={heroTextItem}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8"
          >
            <Button
              size="lg"
              onClick={() => setLocation('/terminal')}
              className="bg-brand-pink hover:bg-brand-pink/90 text-white px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-200 hover:shadow-glow"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-brand-border text-text-primary hover:bg-brand-card hover:border-brand-pink/50 px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-200"
            >
              View Demo
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
