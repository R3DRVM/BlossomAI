import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, logoColorize } from "@/lib/motion";

const partners = [
  { name: "Solana Foundation", logo: "SF", color: "from-purple-500 to-pink-500" },
  { name: "Injective Foundation", logo: "IF", color: "from-blue-500 to-purple-500" },
  { name: "ElizaOS", logo: "EOS", color: "from-green-500 to-teal-500" },
  { name: "Leading DeFi Builders", logo: "LDB", color: "from-pink-500 to-orange-500" },
];

export function Partners() {
  return (
    <section className="py-24 md:py-32 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 relative"
        >
          {/* Content overlay for light mode */}
          <div className="light:content-overlay light:absolute light:inset-0 light:rounded-2xl light:-m-4 light:z-0"></div>
          
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white dark:text-white light:text-primary mb-4 relative z-10">
            Trusted by Leading Organizations
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-gray-400 dark:text-gray-400 light:text-muted text-lg relative z-10">
            Backed by industry leaders and foundation support
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap items-center justify-center gap-16"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              whileHover="hover"
              initial="rest"
              animate="rest"
              className="group cursor-pointer"
            >
              <div className="flex items-center space-x-4 p-8 rounded-2xl transition-all duration-300 group-hover:bg-white/5 group-hover:scale-105">
                <motion.div
                  variants={logoColorize}
                  className={`w-16 h-16 bg-gray-600/20 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-gradient-to-br ${partner.color} group-hover:text-white transition-all duration-300 font-bold text-xl`}
                >
                  {partner.logo}
                </motion.div>
                <span className="text-gray-400 group-hover:text-white transition-colors duration-300 font-semibold text-lg tracking-wide">
                  {partner.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
