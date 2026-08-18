import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { 
  pageVariants, 
  staggerContainer, 
  fadeUpItem, 
} from '../services/animations';
import { Zap, Shield, Globe, ChevronRight } from 'lucide-react';
import CornerAnchors from '../components/CornerAnchors';
import StaggeredText from '../components/StaggeredText';
import Magnetic from '../components/Magnetic';
import ScrollMarquee from '../components/ScrollMarquee';
import Odometer from '../components/Odometer';

function AnimatedCounter({ value, label, delay = 0, isNumber = false }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col gap-2"
    >
      <span className="font-serif italic text-4xl sm:text-5xl lg:text-6xl text-black dark:text-white flex">
        {isNumber && isInView ? (
          <Odometer value={value.replace(/[^0-9.]/g, '')} prefix={value.replace(/[0-9.]/g, '')} />
        ) : (
          value
        )}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
        {label}
      </span>
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, index }) {
  return (
    <Magnetic strength={0.05} className="h-full">
      <motion.div
        variants={fadeUpItem}
        whileHover={{ y: -8, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
        className="relative group glass-card p-8 h-full"
      >
        <CornerAnchors />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="w-12 h-12 mb-6 flex items-center justify-center border border-[#E5E5E5] dark:border-[#222] group-hover:border-black dark:group-hover:border-white transition-colors duration-300 rounded-none"
          >
            <Icon className="w-5 h-5 text-black dark:text-white" />
          </motion.div>
          <h3 className="text-xl font-serif italic text-black dark:text-white mb-3">{title}</h3>
          <p className="text-xs font-mono text-[#666] dark:text-[#888] leading-relaxed">
            {description}
          </p>
        </div>
      </motion.div>
    </Magnetic>
  );
}

export default function Landing() {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  
  const features = [
    { icon: Zap, title: 'Instant Settlement', description: 'Sub-second finality on the Stellar network. No waiting, no confirmations.' },
    { icon: Shield, title: 'Cryptographic Security', description: 'Every expense is cryptographically verified on the immutable ledger.' },
    { icon: Globe, title: 'Borderless Payments', description: 'Pay in any currency, receive in any currency. Atomic swaps included.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-transparent overflow-hidden relative selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 pt-20 sm:pt-32 pb-20 sm:pb-32">
        
        {/* HERO SECTION */}
        <section ref={heroRef} className="min-h-[85vh] flex flex-col justify-center border-b border-[#E5E5E5] dark:border-[#222222] pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left: Massive Typography */}
            <div className="lg:col-span-7 z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '3rem' }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="h-[1px] bg-black dark:bg-white mb-8"
                />
                <StaggeredText 
                  text="SplitStellar." 
                  className="text-xl sm:text-2xl font-mono uppercase tracking-widest text-black/50 dark:text-white/50 mb-6" 
                  delay={0.1} 
                />
                
                {/* Mask-Revealed Kinetic Typography */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="relative mb-8 sm:mb-12 group cursor-default"
                >
                  <h1 className="text-6xl sm:text-7xl lg:text-9xl font-serif italic tracking-tighter leading-[0.9] text-black dark:text-white transition-opacity duration-500 group-hover:opacity-0 relative z-10">
                    The standard for settlement.
                  </h1>
                  
                  {/* The revealed layer */}
                  <div className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none flex items-center">
                    <h1 className="text-6xl sm:text-7xl lg:text-9xl font-serif italic tracking-tighter leading-[0.9] bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500 bg-[length:200%_auto] animate-[gradient-shift_8s_ease_infinite]">
                      The standard for settlement.
                    </h1>
                  </div>
                </motion.div>

                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="text-sm sm:text-lg font-mono text-[#666] dark:text-text-secondary max-w-lg mb-10 sm:mb-16 leading-relaxed"
                >
                  Engineered for cryptographic certainty. SplitStellar utilizes the Stellar network to resolve cross-border shared expenses with sub-second finality.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="flex flex-wrap items-center gap-8"
                >
                  <Link to="/dashboard" className="btn-primary group">
                    <span className="flex items-center gap-2">
                      Initialize App
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        →
                      </motion.span>
                    </span>
                  </Link>
                  <Link to="/guide" className="font-mono text-xs uppercase tracking-widest text-[#666] dark:text-text-secondary hover:text-black dark:hover:text-white transition-colors border-b border-transparent hover:border-black dark:hover:border-white pb-1">
                    Read Manifesto
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Right: Architectural Ledger Grid */}
            <div className="lg:col-span-5 hidden lg:block relative">
              <motion.div 
                initial={{ opacity: 0, x: 30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
                className="glass-card p-8 relative overflow-hidden"
              >
                {/* Animated gradient background */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 2, delay: 1 }}
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#E5E5E5] dark:to-[#111]"
                />
                
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-2 h-[1px] bg-black dark:bg-white -translate-x-full" />
                <div className="absolute top-0 left-0 w-[1px] h-2 bg-black dark:bg-white -translate-y-full" />
                <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-black dark:bg-white translate-x-full" />
                <div className="absolute bottom-0 right-0 w-[1px] h-2 bg-black dark:bg-white translate-y-full" />

                <div className="relative z-10">
                  <div className="flex justify-between items-end border-b border-[#CCC] dark:border-[#333333] pb-4 mb-8">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-text-secondary">Network State</span>
                    <div className="flex items-center gap-2">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full" 
                      />
                      <span className="font-mono text-[10px] uppercase text-emerald-500">Synced</span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {[
                      { label: 'Ledger', value: '52,194,002', delay: 0.8 },
                      { label: 'Latency', value: '1.2s', delay: 0.9 },
                      { label: 'Protocol', value: 'Soroban VM', delay: 1.0 },
                      { label: 'Hash', value: '0x8F9...2A1B', delay: 1.1 },
                    ].map((item) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: item.delay }}
                        className="flex justify-between border-b border-[#E5E5E5] dark:border-[#111111] pb-2 font-mono text-xs"
                      >
                        <span className="text-[#999] dark:text-text-tertiary">{item.label}</span>
                        <span className="text-black dark:text-white">{item.value}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="mt-12 pt-6 border-t border-[#CCC] dark:border-[#333333]"
                  >
                    <div className="font-mono text-[10px] text-[#666] dark:text-text-secondary leading-loose">
                      {`fn execute_settlement(
  env: Env,
  pool_id: BytesN<32>,
  payer: Address,
) -> Result<(), Error>`}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>
        
        {/* SCROLL MARQUEE */}
        <section className="py-12 border-b border-[#E5E5E5] dark:border-[#222222] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-12">
          <ScrollMarquee 
            text="CRYPTOGRAPHIC CERTAINTY • SUB-SECOND FINALITY • BORDERLESS • " 
            velocity={-2} 
            className="text-[12vw] font-serif italic tracking-tighter text-black/5 dark:text-white/5 uppercase select-none" 
          />
        </section>

        {/* STATS SECTION */}
        <section ref={statsRef} className="py-24 border-b border-[#E5E5E5] dark:border-[#222222]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedCounter value="< 1s" label="Settlement Time" delay={0} />
            <AnimatedCounter value="$0" label="Platform Fees" delay={0.1} isNumber={true} />
            <AnimatedCounter value="24/7" label="Network Uptime" delay={0.2} />
            <AnimatedCounter value="∞" label="Scalability" delay={0.3} />
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section ref={featuresRef} className="py-24">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16 max-w-3xl"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-5xl font-serif text-black dark:text-white mb-6"
            >
              Architectural purity.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm font-mono text-[#666] dark:text-text-secondary max-w-lg leading-relaxed"
            >
              We stripped away the noise. What remains is a high-performance settlement engine built natively on Soroban smart contracts. No intermediaries, no friction.
            </motion.p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </motion.div>
        </section>

        {/* CTA SECTION */}
        <section className="py-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-serif italic text-black dark:text-white mb-6">
              Ready to settle?
            </h2>
            <p className="font-mono text-sm text-[#666] dark:text-[#888] mb-8 max-w-md mx-auto">
              Join the future of expense settlement. Cryptographic, instant, global.
            </p>
            <Magnetic strength={0.1}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
                  Get Started
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </Magnetic>
          </motion.div>
        </section>

      </div>
    </motion.div>
  );
}
