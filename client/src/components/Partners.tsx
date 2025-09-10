import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";

const partners = [
  { name: "Solana Foundation", logo: "SF" },
  { name: "Injective Foundation", logo: "IF" },
  { name: "Leading DeFi Builders", logo: "LDB" },
];

export function Partners() {
  return (
    <section className="py-20 px-6 md:px-10 bg-brand-card/20 backdrop-blur-md border-t border-brand-border">
      <div className="max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
            Trusted by Leading Organizations
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-text-muted text-lg">
            Backed by industry leaders and foundation support
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="flex flex-wrap items-center justify-center gap-12"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group cursor-pointer"
            >
              <div className="flex items-center space-x-4 p-6 rounded-2xl transition-all duration-300 group-hover:bg-brand-card/50 group-hover:scale-105">
                <div className="w-12 h-12 bg-text-muted/20 rounded-xl flex items-center justify-center text-text-muted group-hover:bg-brand-pink/20 group-hover:text-brand-pink transition-all duration-300 font-bold text-lg">
                  {partner.logo}
                </div>
                <span className="text-text-muted group-hover:text-text-primary transition-colors duration-300 font-semibold text-lg">
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
