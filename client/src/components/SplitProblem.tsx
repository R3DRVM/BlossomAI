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
            <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-white light:text-gray-900 light:pink-outline-strong light:bg-black/20 light:px-6 light:py-3 light:rounded-xl mb-8">
              Fragmented DeFi
            </h2>
            <div className="scattered-dots p-8 rounded-2xl bg-red-500/5 dark:bg-red-500/5 light:bg-red-50 border border-red-500/20 dark:border-red-500/20 light:border-red-200">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-lg leading-relaxed">
                    <strong className="text-white dark:text-white light:text-gray-900 light:pink-outline">Fragmented DeFi:</strong> Scattered protocols, manual research, and compliance drag.
                  </p>
                </div>
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
            <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-white light:text-gray-900 light:pink-outline-strong light:bg-black/20 light:px-6 light:py-3 light:rounded-xl mb-8">
              <span className="gradient-text">Blossom Unified AI</span>
            </h2>
            <div className="glass-stack p-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-3 h-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 dark:text-gray-300 light:text-gray-700 text-lg leading-relaxed">
                    <strong className="text-white dark:text-white light:text-gray-900 light:pink-outline">Blossom Unified AI:</strong> One aggregator to discover, execute, and manage with institutional control.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Emphasis line below */}
            <div className="glass-card p-6 rounded-2xl text-center">
              <div className="text-xl font-bold gradient-text">
                Blossom = The Institutional Upgrade
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-400 light:text-gray-600 mt-2">
                &gt;$40M annual fees are captured today by fragmented access
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
