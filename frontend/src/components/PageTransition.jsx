import { motion, useMotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

export default function PageTransition({ children, routeKey }) {
  const displacementRef = useRef(null);
  const scaleValue = useMotionValue(100);

  useEffect(() => {
    // Unsubscribe from motion value
    const unsubscribe = scaleValue.on("change", (latest) => {
      if (displacementRef.current) {
        displacementRef.current.setAttribute('scale', latest);
      }
    });

    return () => unsubscribe();
  }, [scaleValue]);

  return (
    <>
      <svg className="absolute w-0 h-0 pointer-events-none" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={`liquid-transition-${routeKey}`} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.05" numOctaves="3" result="noise" />
            <feDisplacementMap 
              ref={displacementRef}
              in="SourceGraphic" 
              in2="noise" 
              scale="0" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
          </filter>
        </defs>
      </svg>

      <motion.div
        key={routeKey}
        initial={{ opacity: 0, filter: `url(#liquid-transition-${routeKey})` }}
        animate={{ opacity: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, filter: `url(#liquid-transition-${routeKey})` }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        onAnimationStart={(definition) => {
          if (definition.opacity === 1) {
            // Animating in: scale from 100 to 0
            scaleValue.set(100);
            import('framer-motion').then(({ animate }) => {
              animate(scaleValue, 0, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
            });
          } else {
            // Animating out: scale from 0 to 100
            scaleValue.set(0);
            import('framer-motion').then(({ animate }) => {
              animate(scaleValue, 100, { duration: 0.8, ease: [0.22, 1, 0.36, 1] });
            });
          }
        }}
        className="w-full h-full origin-top"
      >
        {children}
      </motion.div>
    </>
  );
}
