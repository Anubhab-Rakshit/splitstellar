import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';

function NumberColumn({ digit }) {
  const value = parseInt(digit, 10);

  // Use MotionValue instead of useState + useEffect
  const motionValue = useMotionValue(isNaN(value) ? 0 : value);

  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 200,
    mass: 0.8,
  });

  useEffect(() => {
    motionValue.set(isNaN(value) ? 0 : value);
  }, [value, motionValue]);

  const y = useTransform(springValue, (val) => `-${val}em`);

  if (isNaN(value)) {
    return <span className="inline-block opacity-70">{digit}</span>;
  }

  return (
    <div className="relative inline-block overflow-hidden" style={{ height: '1em' }}>
      <motion.div
        className="flex flex-col"
        style={{ y }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <span key={num} className="inline-flex items-center justify-center" style={{ height: '1em' }}>
            {num}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function Odometer({ value, prefix = '', suffix = '', className = '' }) {
  const formattedValue = typeof value === 'number'
    ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
    : value.toString();

  const digits = formattedValue.split('');

  return (
    <div className={`inline-flex items-center font-mono font-medium overflow-hidden ${className}`}>
      {prefix && <span className="opacity-50 mr-1">{prefix}</span>}
      <div className="flex items-center leading-none">
        {digits.map((char, index) => (
          <NumberColumn key={`${index}-${char === '.' ? 'dot' : 'num'}`} digit={char} />
        ))}
      </div>
      {suffix && <span className="opacity-50 ml-1">{suffix}</span>}
    </div>
  );
}
