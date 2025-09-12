import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { fadeInUp, ctaButton } from "@/lib/motion";

export function BottomCta() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-32 md:py-40 px-6 md:px-10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0">
        <div className="floating-glow pink" />
        <div className="floating-glow purple" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white dark:text-white light:text-[#0E1116] mb-6">
            Ready to deploy with Blossom?
          </h2>
          
          <div className="space-y-6">
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
            
            <div>
              <button 
                onClick={() => setLocation('/strategies')}
                className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors duration-200 underline decoration-dotted underline-offset-4"
              >
                Read the Institutional Brief
              </button>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 dark:border-white/10 light:border-black/10">
            <p className="text-sm text-gray-500 dark:text-gray-500 light:text-gray-500">
              Built on ElizaOS v2. Incubated by Eliza Foundation.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
