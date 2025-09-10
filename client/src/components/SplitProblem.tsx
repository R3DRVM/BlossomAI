import { motion } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/motion";

export function SplitProblem() {
  return (
    <section className="py-28 md:py-36 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Fragmented DeFi */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-8">
              Fragmented DeFi
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-text-muted text-lg">
                  <strong className="text-text-primary">Current State:</strong> Scattered protocols, 
                  manual research, complex risk assessment, and compliance headaches.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right side - Blossom Solution */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-8">
              <span className="text-brand-pink">Blossom Unified AI</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-3 h-3 bg-brand-pink rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-text-muted text-lg">
                  <strong className="text-text-primary">Blossom Solution:</strong> Unified AI aggregator 
                  that discovers, executes, and manages strategies at institutional scale.
                </p>
              </div>
            </div>
            
            {/* Revenue model callout */}
            <div className="glass-card p-8 rounded-2xl mt-8">
              <h3 className="text-2xl font-bold text-text-primary mb-4">
                $40M+ Annual Fees
              </h3>
              <p className="text-text-muted mb-4">
                Captured by competitors through fragmented DeFi access
              </p>
              <div className="text-3xl font-bold bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent">
                Blossom = The Institutional Upgrade
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
