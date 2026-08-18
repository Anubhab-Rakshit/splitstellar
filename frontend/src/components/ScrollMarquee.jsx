import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion';

export default function ScrollMarquee({ text, velocity = 5, className = '' }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  
  // We extract velocity from the scroll to make the marquee speed up when scrolling
  const scrollVelocity = useSpring(useTransform(scrollY, (v) => v * 10), {
    damping: 50,
    stiffness: 400,
  });

  const velocityFactor = useTransform(scrollVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  // Calculate the wrapping using modulus
  const x = useTransform(baseX, (v) => `${wrap(-100, 0, v)}%`);

  const directionFactor = useRef(1);

  // Animate the marquee every frame
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * velocity * (delta / 1000);

    // If scrolling, add the scroll velocity to the natural movement
    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className={`overflow-hidden flex flex-nowrap whitespace-nowrap ${className}`}>
      <motion.div className="flex whitespace-nowrap gap-16 flex-nowrap" style={{ x }}>
        {/* Render the text multiple times to ensure it wraps perfectly without gaps */}
        {[...Array(6)].map((_, i) => (
          <span key={i} className="block">
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// Utility to wrap a number between min and max
function wrap(min, max, v) {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
}
