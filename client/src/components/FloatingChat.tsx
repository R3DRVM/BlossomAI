import { motion } from "framer-motion";
import { floatingChat } from "@/lib/motion";
import { Zap } from "lucide-react";

export function FloatingChat() {
  return (
    <motion.div
      variants={floatingChat}
      initial="rest"
      animate="pulse"
      whileHover="hover"
      className="fixed bottom-8 right-8 z-50"
    >
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-5 rounded-2xl shadow-glow cursor-pointer group backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">Ask Blossom</p>
            <p className="text-xs opacity-90">how to optimize $10M in USDC</p>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/30 rounded-full animate-ping"></div>
      </div>
    </motion.div>
  );
}
