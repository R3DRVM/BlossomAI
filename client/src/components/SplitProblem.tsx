import { motion } from "framer-motion";
import { slideInLeft, slideInRight } from "@/lib/motion";

export function SplitProblem() {
  return (
    <section className="py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left side - Fragmented DeFi with scattered dots */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              Fragmented DeFi
            </h2>
            <div className="scattered-dots p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-white">Current State:</strong> Scattered protocols, 
                    manual research, complex risk assessment, and compliance headaches.
                  </p>
                </div>
                <div className="text-sm text-gray-400 italic">
                  Chaos, inefficiency, and missed opportunities
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Blossom Solution with glass stack */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
              <span className="gradient-text">Blossom Unified AI</span>
            </h2>
            <div className="glass-stack p-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-white">Blossom Solution:</strong> Unified AI aggregator 
                    that discovers, executes, and manages strategies at institutional scale.
                  </p>
                </div>
                <div className="text-sm text-gray-400 italic">
                  Order, efficiency, and institutional-grade execution
                </div>
              </div>
            </div>
            
            {/* Revenue model callout */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                $40M+ Annual Fees
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Captured by competitors through fragmented DeFi access
              </p>
              <div className="text-3xl font-bold gradient-text">
                Blossom = The Institutional Upgrade
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
