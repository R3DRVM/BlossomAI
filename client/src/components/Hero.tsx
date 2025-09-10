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
          className="space-y-10"
        >
          {/* Badge */}
          <motion.div variants={heroTextItem}>
            <Badge variant="secondary" className="mb-6 text-sm font-medium tracking-wide">
              Institutional DeFi Platform
            </Badge>
          </motion.div>

          {/* Main headline - Option A */}
          <motion.h1
            variants={heroTextItem}
            className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.9] tracking-tight"
          >
            <span className="text-white dark:text-white light:text-white pink-outline-strong light:bg-black/20 light:px-6 light:py-3 light:rounded-xl">Deploy millions, intelligently.</span>
          </motion.h1>

          {/* Subline - one concise sentence */}
          <motion.p
            variants={heroTextItem}
            className="text-xl md:text-2xl text-gray-300 dark:text-gray-300 light:text-gray-700 light:bg-black/10 light:px-4 light:py-2 light:rounded-lg max-w-3xl mx-auto leading-relaxed font-light"
          >
            AI insights, unified execution, and institutional risk for DeFi yield.
          </motion.p>

          {/* Social proof */}
          <motion.div
            variants={heroTextItem}
            className="pt-6"
          >
            <p className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4 tracking-wide">Backed by</p>
            <div className="flex items-center justify-center space-x-8 text-gray-400/70 dark:text-gray-400/70 light:text-gray-600">
              <div className="text-lg font-semibold tracking-wide">Solana Foundation</div>
              <div className="w-px h-6 bg-gray-600 dark:bg-gray-600 light:bg-gray-300"></div>
              <div className="text-lg font-semibold tracking-wide">Injective Foundation</div>
              <div className="w-px h-6 bg-gray-600 dark:bg-gray-600 light:bg-gray-300"></div>
              <div className="text-lg font-semibold tracking-wide">ElizaOS</div>
              <div className="w-px h-6 bg-gray-600 dark:bg-gray-600 light:bg-gray-300"></div>
              <div className="text-lg font-semibold tracking-wide">Leading DeFi Builders</div>
            </div>
          </motion.div>

          {/* Single centered CTA */}
          <motion.div
            variants={heroTextItem}
            className="pt-10"
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
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12 py-5 text-lg font-semibold transition-all duration-300"
              >
                Access Terminal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
