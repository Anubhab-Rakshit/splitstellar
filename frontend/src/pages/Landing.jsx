import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Landing() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, -50]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  
  return (
    <div className="min-h-screen bg-black overflow-hidden relative selection:bg-white selection:text-black">
      
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 pt-20 sm:pt-32 pb-20 sm:pb-32">
        
        {/* HERO SECTION */}
        <section className="min-h-[85vh] flex flex-col justify-center border-b border-[#222222] pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            
            {/* Left: Massive Typography */}
            <div className="lg:col-span-7 z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              >
                <div className="mb-4"></div>
                
                <h1 className="text-4xl sm:text-[5.5rem] lg:text-[7rem] font-serif italic leading-[1] sm:leading-[0.9] text-white mb-6 sm:mb-10">
                  The standard <br/>
                  <span className="not-italic opacity-50">for settlement.</span>
                </h1>
                
                <p className="text-sm sm:text-lg font-mono text-text-secondary max-w-lg mb-10 sm:mb-16 leading-relaxed">
                  Engineered for cryptographic certainty. SplitStellar utilizes the Stellar network to resolve cross-border shared expenses with sub-second finality.
                </p>
                
                <div className="flex flex-wrap items-center gap-8">
                  <Link to="/dashboard" className="btn-primary">
                    Initialize App
                  </Link>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="font-mono text-xs uppercase tracking-widest text-text-secondary hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
                    Read Manifesto
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right: Architectural Ledger Grid */}
            <div className="lg:col-span-5 hidden lg:block relative">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="border border-[#222222] bg-[#050505] p-8 relative"
              >
                {/* Decoration marks */}
                <div className="absolute top-0 left-0 w-2 h-[1px] bg-white -translate-x-full" />
                <div className="absolute top-0 left-0 w-[1px] h-2 bg-white -translate-y-full" />
                <div className="absolute bottom-0 right-0 w-2 h-[1px] bg-white translate-x-full" />
                <div className="absolute bottom-0 right-0 w-[1px] h-2 bg-white translate-y-full" />

                <div className="flex justify-between items-end border-b border-[#333333] pb-4 mb-8">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-text-secondary">Network State</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="font-mono text-[10px] uppercase text-white">Synced</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between border-b border-[#111111] pb-2 font-mono text-xs">
                    <span className="text-text-tertiary">Ledger</span>
                    <span className="text-white">52,194,002</span>
                  </div>
                  <div className="flex justify-between border-b border-[#111111] pb-2 font-mono text-xs">
                    <span className="text-text-tertiary">Latency</span>
                    <span className="text-white">1.2s</span>
                  </div>
                  <div className="flex justify-between border-b border-[#111111] pb-2 font-mono text-xs">
                    <span className="text-text-tertiary">Protocol</span>
                    <span className="text-white">Soroban VM</span>
                  </div>
                  <div className="flex justify-between border-b border-[#111111] pb-2 font-mono text-xs">
                    <span className="text-text-tertiary">Hash</span>
                    <span className="text-text-secondary">0x8F9...2A1B</span>
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-[#333333]">
                  <div className="font-mono text-[10px] text-text-secondary leading-loose">
                    {`fn execute_settlement(
  env: Env,
  pool_id: BytesN<32>,
  payer: Address,
) -> Result<(), Error>`}
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </section>

        {/* PRECISION GRID SECTION */}
        <section className="py-24">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-16 max-w-3xl"
          >
            <h2 className="text-4xl md:text-5xl font-serif text-white mb-6">
              Architectural purity.
            </h2>
            <p className="text-sm font-mono text-text-secondary max-w-lg leading-relaxed">
              We stripped away the noise. What remains is a high-performance settlement engine built natively on Soroban smart contracts. No intermediaries, no friction.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cell 1 */}
            <motion.div 
              style={{ y: y1 }}
              className="border-t border-[#333333] pt-6"
            >
              <div className="font-mono text-xs text-text-secondary mb-4">01</div>
              <h3 className="text-2xl font-serif italic text-white mb-4">Immutable State</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Cryptographic certainty for every logged expense. The ledger acts as the ultimate arbiter of truth for group settlements.
              </p>
            </motion.div>

            {/* Cell 2 */}
            <motion.div 
              style={{ y: y2 }}
              className="border-t border-[#333333] pt-6"
            >
              <div className="font-mono text-xs text-text-secondary mb-4">02</div>
              <h3 className="text-2xl font-serif italic text-white mb-4">Soroban Native</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Complex routing and debt-simplification algorithms run directly on the network via Rust-based smart contracts.
              </p>
            </motion.div>

            {/* Cell 3 */}
            <motion.div 
              className="border-t border-[#333333] pt-6"
            >
              <div className="font-mono text-xs text-text-secondary mb-4">03</div>
              <h3 className="text-2xl font-serif italic text-white mb-4">Global Liquidity</h3>
              <p className="text-xs font-mono text-text-secondary leading-relaxed">
                Path payments allow Alice to pay in USDC while Bob receives XLM, handled atomically in a single transaction.
              </p>
            </motion.div>
          </div>
        </section>

      </div>
    </div>
  );
}
