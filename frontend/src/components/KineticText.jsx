import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

function KineticLetter({ char, globalMouseX, globalMouseY }) {
  const ref = useRef(null);
  
  // Motion values to hold the target offsets
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const targetRotate = useMotionValue(0);
  
  // Springs to smoothly interpolate to the targets
  const x = useSpring(targetX, { stiffness: 500, damping: 25, mass: 0.5 });
  const y = useSpring(targetY, { stiffness: 500, damping: 25, mass: 0.5 });
  const rotate = useSpring(targetRotate, { stiffness: 400, damping: 30, mass: 0.5 });

  useEffect(() => {
    if (!ref.current) return;
    
    // Calculate physics without triggering React renders
    const updatePhysics = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;
      
      const mx = globalMouseX.get();
      const my = globalMouseY.get();
      
      const dx = mx - charCenterX;
      const dy = my - charCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Radius of the cursor's magnetic repel force
      const maxDist = 120; 
      
      if (dist < maxDist) {
        // Non-linear force curve for a snappy feel
        const force = Math.pow((maxDist - dist) / maxDist, 2);
        // Push the letter away from the mouse
        targetX.set(-(dx / dist) * force * 40);
        targetY.set(-(dy / dist) * force * 40);
        // Add a chaotic tilt
        targetRotate.set((dx / dist) * force * 15);
      } else {
        // Rest
        if (targetX.get() !== 0) targetX.set(0);
        if (targetY.get() !== 0) targetY.set(0);
        if (targetRotate.get() !== 0) targetRotate.set(0);
      }
    };

    // Only hook into the mouse position changes
    const unsubX = globalMouseX.on("change", updatePhysics);
    const unsubY = globalMouseY.on("change", updatePhysics);
    
    return () => {
      unsubX();
      unsubY();
    };
  }, [globalMouseX, globalMouseY, targetX, targetY, targetRotate]);

  return (
    <motion.span
      ref={ref}
      style={{ 
        x, 
        y, 
        rotate, 
        display: 'inline-block', 
        whiteSpace: char === ' ' ? 'pre' : 'normal',
        originX: 0.5,
        originY: 0.5
      }}
    >
      {char}
    </motion.span>
  );
}

export default function KineticText({ text, className }) {
  const globalMouseX = useMotionValue(-1000);
  const globalMouseY = useMotionValue(-1000);

  useEffect(() => {
    const handleMouseMove = (e) => {
      globalMouseX.set(e.clientX);
      globalMouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [globalMouseX, globalMouseY]);

  return (
    <span className={`inline-flex flex-wrap pointer-events-auto ${className}`}>
      {text.split('').map((char, i) => (
        <KineticLetter 
          key={i} 
          char={char} 
          globalMouseX={globalMouseX} 
          globalMouseY={globalMouseY} 
        />
      ))}
    </span>
  );
}
