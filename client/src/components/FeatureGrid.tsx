import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, glassCardHover, featureCard } from "@/lib/motion";
import { BarChart3, Zap, Shield, TrendingUp, Users, Globe } from "lucide-react";

const features = [
  {
    icon: <BarChart3 className="h-8 w-8" />,
    badge: "AI",
    title: "Deploy Capital at Scale",
    description: "Execute millions with institutional controls.",
  },
  {
    icon: <Zap className="h-8 w-8" />,
    badge: "Risk",
    title: "AI-Powered Yield Discovery",
    description: "Conversational strategy building that fits your risk.",
  },
  {
    icon: <Shield className="h-8 w-8" />,
    badge: "Rails",
    title: "Compliance-Ready by Design",
    description: "AML/KYC, custody, and reporting integrations.",
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    badge: "AI",
    title: "Cross-Chain Liquidity Rails",
    description: "Unified execution across Solana, Ethereum, and more.",
  },
  {
    icon: <Users className="h-8 w-8" />,
    badge: "Risk",
    title: "Foundation Support",
    description: "Backed by Solana & Injective; ongoing technical support.",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    badge: "Rails",
    title: "Institutional Infrastructure",
    description: "Enterprise-grade security, monitoring, and reporting.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-32 md:py-40 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-black text-white dark:text-white light:text-[#0E1116] mb-6">
            Institutional controls, retail-simple UX.
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-xl text-gray-400 dark:text-gray-400 light:text-gray-600 max-w-3xl mx-auto">
            Professional tools with AI and unified risk.
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
              variants={featureCard}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="group cursor-pointer"
            >
              <motion.div
                variants={glassCardHover}
                className="glass-card p-8 rounded-2xl h-full relative overflow-hidden card-hover"
              >
                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-2 py-1 text-xs font-medium bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/30">
                    {feature.badge}
                  </span>
                </div>
                
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 pt-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 group-hover:from-pink-500/30 group-hover:to-purple-600/30 transition-all duration-300">
                    {feature.icon}
                  </div>
                   <h3 className="text-xl font-bold text-white dark:text-white light:text-[#0E1116] mb-4 group-hover:text-pink-400 transition-colors duration-300">
                     {feature.title}
                   </h3>
                  <p className="text-gray-400 dark:text-gray-400 light:text-gray-700 group-hover:text-gray-300 dark:group-hover:text-gray-300 light:group-hover:text-gray-800 transition-colors duration-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
