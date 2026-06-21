import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitialLoader({ onComplete }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Elegant quick loader
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete(); // Instant snap to the app, no slow crossfade
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loader"
          exit={{ display: "none" }} // Snaps instantly away
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-6xl font-serif text-black italic tracking-tight"
            >
              SplitStellar.
            </motion.h1>
          </div>
          
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-[1px] bg-black mt-6 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
