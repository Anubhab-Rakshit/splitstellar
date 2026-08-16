// Premium animation variants for SplitStellar
// Inspired by Linear, Vercel, and Raycast

// Spring configuration for smooth, premium feel
export const springConfig = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  mass: 0.8,
};

export const gentleSpring = {
  type: 'spring',
  stiffness: 60,
  damping: 15,
  mass: 1,
};

// Page transition variants
export const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: { duration: 0.3 }
  }
};

// Staggered children container
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

// Individual item fade up
export const fadeUpItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Card hover effects
export const cardHover = {
  rest: { 
    scale: 1,
    y: 0,
  },
  hover: { 
    scale: 1.02,
    y: -4,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1,
    }
  },
};

// Button press effect
export const buttonPress = {
  rest: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.97 },
};

// Smooth reveal from bottom
export const slideUp = {
  initial: { opacity: 0, y: 30 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Smooth reveal from left
export const slideFromLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Smooth reveal from right
export const slideFromRight = {
  initial: { opacity: 0, x: 30 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Scale reveal
export const scaleReveal = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Blur reveal
export const blurReveal = {
  initial: { opacity: 0, filter: 'blur(10px)' },
  animate: { 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Floating animation for decorative elements
export const floating = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  }
};

// Pulse animation for live indicators
export const pulse = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }
  }
};

// Shimmer effect for loading states
export const shimmer = {
  initial: { opacity: 0.3 },
  animate: { 
    opacity: 0.7,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    }
  }
};

// Number counter animation helper
export const counterAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Toast notification animations
export const toastAnimation = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    }
  }
};

// Modal backdrop
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Modal content
export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    }
  }
};

// List item animations
export const listItem = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    }
  },
  exit: { 
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.2,
    }
  }
};

// Tab indicator animation
export const tabIndicator = {
  layoutId: 'tabIndicator',
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  }
};

// Progress bar animation
export const progressBar = {
  initial: { scaleX: 0 },
  animate: { 
    scaleX: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Icon spin animation
export const iconSpin = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    }
  }
};

// Smooth border transition
export const borderTransition = {
  transition: {
    duration: 0.3,
    ease: 'easeInOut',
  }
};

// Opacity fade
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// Scale up on hover
export const scaleOnHover = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.95 },
};

// Magnetic button effect
export const magneticButton = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98, y: 0 },
  transition: {
    type: 'spring',
    stiffness: 400,
    damping: 17,
  }
};
