import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, glassCardHover } from "@/lib/motion";
import { TrendingUp, Brain, Shield } from "lucide-react";

const capitalSegments = [
  {
    icon: TrendingUp,
    title: "Market Makers",
    description: "Maximize idle liquidity across chains.",
    cta: "See workflows →"
  },
  {
    icon: Brain,
    title: "Quant Desks", 
    description: "AI-assisted strategy discovery.",
    cta: "See workflows →"
  },
  {
    icon: Shield,
    title: "Treasuries",
    description: "Controls, custody, and reporting.",
    cta: "See workflows →"
  }
];

export function CapitalBand() {
  return (
    <section className="py-16 md:py-20 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-black gradient-text mb-4">
            Built for Capital
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {capitalSegments.map((segment, index) => {
            const Icon = segment.icon;
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
                animate="rest"
                className="group cursor-pointer"
              >
                <motion.div
                  variants={glassCardHover}
                  className="glass p-8 text-center relative overflow-hidden card-hover"
                >
                  {/* Gradient border effect on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-pink-500" />
                    </div>
                    
                    <h3 className="text-xl font-bold gradient-text mb-3 glass-text">
                      {segment.title}
                    </h3>
                    
                    <p className="text-gray-400 dark:text-gray-400 light:text-gray-600 mb-4 text-sm leading-relaxed">
                      {segment.description}
                    </p>
                    
                    <button className="text-pink-500 hover:text-pink-400 text-sm font-medium transition-colors duration-200">
                      {segment.cta}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
