import { Variants } from "framer-motion";

// Consistent easing for all animations
const easeInOut = [0.4, 0, 0.2, 1];

// Container variants for staggered animations
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08,
      ease: easeInOut,
    },
  },
};

// Refined fade in up animation
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeInOut,
    },
  },
};

// Slide in from left
export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -32,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: easeInOut,
    },
  },
};

// Slide in from right
export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 32,
  },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: easeInOut,
    },
  },
};

// Hero text animation with refined stagger
export const heroText: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.12,
      ease: easeInOut,
    },
  },
};

export const heroTextItem: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easeInOut,
    },
  },
};

// Glass card hover animation
export const glassCardHover: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: "0 0 0 rgba(255,79,160,0)",
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 8px 40px rgba(255,79,160,0.15)",
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
};

// Metrics counter animation
export const counterAnimation: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9,
  },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: easeInOut,
    },
  },
};

// Feature card entrance
export const featureCard: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeInOut,
    },
  },
};

// Floating chat animation
export const floatingChat: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.05,
    y: -2,
    transition: {
      duration: 0.2,
      ease: easeInOut,
    },
  },
  pulse: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// CTA button animation
export const ctaButton: Variants = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 rgba(255,79,160,0)",
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 8px 40px rgba(255,79,160,0.3)",
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
};

// Logo colorize animation
export const logoColorize: Variants = {
  rest: {
    filter: "grayscale(100%)",
    scale: 1,
  },
  hover: {
    filter: "grayscale(0%)",
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: easeInOut,
    },
  },
};
