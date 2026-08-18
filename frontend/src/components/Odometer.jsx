import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

function NumberColumn({ digit, delta }) {
  const [position, setPosition] = useState(0);

  // Smoothly spring to the new digit
  const springValue = useSpring(position, {
    damping: 30,
    stiffness: 200,
    mass: 0.8,
  });

  useEffect(() => {
    // If delta is positive (going up), we animate up.
    // If it's a completely new number, we just set the target digit.
    setPosition(parseInt(digit, 10) || 0);
  }, [digit]);

  // Each digit in the column is 1em high.
  // We move the column up by (value * 1em).
  const y = useTransform(springValue, (val) => `-${val}em`);

  if (isNaN(parseInt(digit, 10))) {
    // It's a comma or period
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
  // Format the value into a string, e.g., "1,234.56"
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
