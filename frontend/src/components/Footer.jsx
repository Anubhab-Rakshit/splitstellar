import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function Footer() {
  const containerRef = useRef(null);
  
  // Parallax reveal effect
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // Scale down the text as you scroll up, scale up as you scroll down
  const y = useTransform(scrollYProgress, [0, 1], [-100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 1]);

  return (
    <footer 
      ref={containerRef} 
      className="relative min-h-[60vh] pt-32 flex flex-col justify-end bg-black dark:bg-[#050505] overflow-hidden"
    >
      {/* Background grain or texture can go here */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }} 
      />

      <div className="container mx-auto px-6 pb-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/20 pb-12 mb-12">
          
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif italic text-white text-3xl mb-4">SplitStellar</h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 max-w-xs">
              The cryptographic standard for multi-party settlement on the Stellar network.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">Protocol</span>
            <a href="#" className="font-mono text-sm text-white hover:text-white/50 transition-colors">Manifesto</a>
            <a href="#" className="font-mono text-sm text-white hover:text-white/50 transition-colors">Whitepaper</a>
            <a href="#" className="font-mono text-sm text-white hover:text-white/50 transition-colors">Github</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">Network</span>
            <span className="font-mono text-sm flex items-center gap-2 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Soroban Mainnet
            </span>
            <span className="font-mono text-sm flex items-center gap-2 text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Stellar RPC
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center font-mono text-[10px] uppercase tracking-widest text-white/30">
          <span>© 2026 SPLITSTELLAR</span>
          <span>INITIATED BY ANUBHAB</span>
        </div>
      </div>

      {/* Massive Typography at the very bottom */}
      <motion.div 
        style={{ y, opacity }}
        className="absolute bottom-0 left-0 w-full flex justify-center translate-y-[20%] pointer-events-none"
      >
        <span className="text-[20vw] font-serif italic font-bold tracking-tighter leading-none text-white opacity-10 select-none">
          STELLAR
        </span>
      </motion.div>
    </footer>
  );
}
