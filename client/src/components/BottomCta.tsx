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
          className="space-y-8 relative"
        >
          {/* Content overlay for light mode */}
          <div className="light:content-overlay light:absolute light:inset-0 light:rounded-2xl light:-m-4 light:z-0"></div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-white light:text-primary relative z-10">
            Ready to deploy with Blossom?
          </h2>
          <p className="text-xl text-gray-400 dark:text-gray-400 light:text-muted max-w-2xl mx-auto relative z-10">
            Join institutional investors using AI-driven aggregation and unified risk.
          </p>
          <motion.div
            variants={ctaButton}
            initial="rest"
            whileHover="hover"
            className="cta-aura inline-block"
          >
            <Button
              size="lg"
              onClick={() => setLocation('/terminal')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white light:text-inverse px-12 py-5 text-lg font-semibold transition-all duration-300 focus:ring-4 focus:ring-pink-200 light:focus:ring-pink-200 relative z-10"
            >
              Access Terminal Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
