import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
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
    <section className="py-20 px-6 md:px-10 bg-brand-card/30 backdrop-blur-md border-t border-brand-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Institutional Metrics
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-text-muted text-lg">
            Real-time performance data from our platform
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
              className="glass-card p-8 rounded-2xl text-center hover:shadow-glow transition-all duration-300"
            >
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-brand-pink to-brand-purple bg-clip-text text-transparent mb-2">
                <AnimatedNumber
                  value={metric.value}
                  prefix={metric.prefix}
                  suffix={metric.suffix}
                  duration={2}
                />
              </div>
              <div className="text-sm text-text-muted mb-2">{metric.label}</div>
              <div className="text-xs text-green-400 font-medium">{metric.change}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
