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
      <div className="bg-brand-pink text-white p-4 rounded-2xl shadow-glow cursor-pointer group">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Ask Blossom</p>
            <p className="text-xs opacity-80">how to optimize $10M in USDC</p>
          </div>
        </div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full animate-ping"></div>
      </div>
    </motion.div>
  );
}
