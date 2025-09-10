import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { fadeInUp } from "@/lib/motion";

export function BottomCta() {
  const [, setLocation] = useLocation();

  return (
    <section className="py-28 md:py-36 px-6 md:px-10 bg-gradient-to-r from-brand-pink/10 to-brand-purple/10 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-pink/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-brand-purple/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "6s" }}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary">
            Ready to deploy capital with Blossom?
          </h2>
          <p className="text-xl text-text-muted max-w-2xl mx-auto">
            Join institutional investors who trust Blossom for professional-grade 
            DeFi yield aggregation and risk management.
          </p>
          <Button
            size="lg"
            onClick={() => setLocation('/terminal')}
            className="bg-brand-pink hover:bg-brand-pink/90 text-white px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-200 hover:shadow-glow"
          >
            Access Terminal Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
