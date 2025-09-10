import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, cardHover } from "@/lib/motion";
import { BarChart3, Zap, Shield, TrendingUp, Users, Globe } from "lucide-react";

const features = [
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: "Deploy Capital at Scale",
    description: "DAOs, quant desks, and family offices execute millions with institutional controls.",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "AI-Powered Yield Discovery",
    description: "Conversational strategy building that understands your risk profile.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Compliance-Ready by Design",
    description: "AML/KYC, custody, and regulatory reporting integrations.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    title: "Cross-Chain Liquidity Rails",
    description: "Unified execution across Solana, Ethereum, Injective, and more.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: "Foundation Support",
    description: "Backed by Solana & Injective Foundations; ongoing technical support.",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: "Institutional Infrastructure",
    description: "Enterprise-grade security, monitoring, and reporting.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-28 md:py-36 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Built for Institutional Excellence
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-text-muted max-w-3xl mx-auto">
            Professional-grade tools that combine the best of traditional finance terminals 
            with cutting-edge DeFi innovation.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="group cursor-pointer"
            >
              <motion.div
                variants={cardHover}
                className="glass-card p-8 rounded-2xl h-full border-2 border-transparent group-hover:border-brand-pink/20 transition-all duration-300"
              >
                <div className="w-16 h-16 bg-brand-pink/10 rounded-2xl flex items-center justify-center text-brand-pink mb-6 group-hover:bg-brand-pink/20 group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-4 group-hover:text-brand-pink transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-text-muted group-hover:text-text-primary/80 transition-colors duration-300">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
