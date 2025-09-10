import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, glassCardHover, counterAnimation } from "@/lib/motion";
import { AnimatedNumber } from "./AnimatedNumber";

const metrics = [
  {
    value: 2.4,
    prefix: "$",
    suffix: "B+",
    label: "Total Value Locked",
    change: "+12.3%",
  },
  {
    value: 1247,
    label: "Active Strategies",
    change: "+8.9%",
  },
  {
    value: 14.7,
    suffix: "%",
    label: "Average APY",
    change: "+2.1%",
  },
  {
    value: 7.8,
    suffix: "/10",
    label: "Risk Score",
    change: "+0.3%",
  },
];

export function Metrics() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white dark:text-white light:text-gray-900 light:pink-outline-strong mb-4">
            Institutional Metrics
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-gray-400 dark:text-gray-400 light:text-gray-600 text-lg">
            Real-time performance highlights.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {metrics.map((metric, index) => (
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
                className="glass-card p-8 rounded-2xl text-center relative overflow-hidden"
              >
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <motion.div
                  variants={counterAnimation}
                  className="relative z-10"
                >
                  <div className="text-4xl md:text-5xl font-bold gradient-text mb-3">
                    <AnimatedNumber
                      value={metric.value}
                      prefix={metric.prefix}
                      suffix={metric.suffix}
                      duration={2}
                    />
                  </div>
                  <div className="text-sm text-gray-400 mb-2 tracking-wide">{metric.label}</div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.2, duration: 0.5 }}
                    className="text-xs text-green-400 font-medium"
                  >
                    {metric.change}
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
