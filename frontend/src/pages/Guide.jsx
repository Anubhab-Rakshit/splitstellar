import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Users, 
  Receipt, 
  ArrowRightLeft, 
  Shield, 
  Globe, 
  Zap, 
  Lock,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Link your Stellar wallet (Freighter, Albedo, xBull, or WalletConnect) to access the settlement engine.',
    step: '01'
  },
  {
    icon: Users,
    title: 'Create or Join a Pool',
    description: 'Start a new expense pool or join an existing one using an 8-character invite code.',
    step: '02'
  },
  {
    icon: Receipt,
    title: 'Log Expenses',
    description: 'Record expenses directly on the Stellar blockchain. Each entry is immutable and timestamped.',
    step: '03'
  },
  {
    icon: ArrowRightLeft,
    title: 'Settle Up',
    description: 'Calculate net balances and settle debts instantly via on-chain XLM payments.',
    step: '04'
  }
];

const securityFeatures = [
  {
    icon: Lock,
    title: 'Invite-Only Access',
    description: 'Pools are private by default. Only users with valid invite codes can request to join.'
  },
  {
    icon: Shield,
    title: 'Owner Approval',
    description: 'Pool creators approve or reject join requests, maintaining full control over membership.'
  },
  {
    icon: Globe,
    title: 'On-Chain Verification',
    description: 'All expenses are verified against the Soroban smart contract before being recorded.'
  },
  {
    icon: Zap,
    title: 'Instant Settlement',
    description: 'Payments settle in ~5 seconds with near-zero fees on the Stellar network.'
  }
];

export default function Guide() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-black overflow-hidden relative selection:bg-black dark:selection:bg-white selection:text-white dark:selection:text-black">
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10 pt-24 sm:pt-32 pb-20 sm:pb-32">
        
        {/* HERO SECTION */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
                User Guide
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif italic tracking-tight mb-6 sm:mb-8">
              Split expenses.<br />
              <span className="opacity-50">Settle instantly.</span>
            </h1>
            
            <p className="text-sm sm:text-lg font-mono text-[#666] dark:text-[#888] max-w-2xl mb-8 sm:mb-12 leading-relaxed">
              SplitStellar enables cryptographic certainty for group expenses. 
              Built natively on the Stellar network, it resolves cross-border shared expenses 
              with sub-second finality and near-zero fees.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link to="/dashboard" className="btn-primary">
                Get Started
              </Link>
              <a 
                href="https://github.com/Anubhab-Rakshit/splitstellar" 
                target="_blank" 
                rel="noreferrer" 
                className="btn-secondary"
              >
                View Source
                <ExternalLink className="w-3 h-3 ml-2" />
              </a>
            </div>
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-sm font-mono text-[#666] dark:text-[#888] max-w-lg">
              Four simple steps to cryptographic settlement.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-[#050505] p-6 sm:p-8 transition-colors duration-500"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                      {feature.step}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <feature.icon className="w-5 h-5 text-black dark:text-white" />
                      <h3 className="font-serif italic text-xl text-black dark:text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECURITY FEATURES */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Security by design
            </h2>
            <p className="text-sm font-mono text-[#666] dark:text-[#888] max-w-lg">
              Every layer is hardened against unauthorized access.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500"
              >
                <div className="flex items-center gap-3 mb-3">
                  <feature.icon className="w-4 h-4 text-black dark:text-white" />
                  <h3 className="font-serif italic text-lg text-black dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="font-mono text-[11px] text-[#666] dark:text-[#888] leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* KEY CONCEPTS */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Key concepts
            </h2>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Expense Pools
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                A shared workspace for tracking group expenses. Each pool has a unique ID, 
                an invite code for access control, and an immutable ledger of all recorded expenses.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Invite Codes
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                8-character alphanumeric codes (e.g., <code className="px-1.5 py-0.5 bg-[#F7F7F7] dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333]">A3B7K9M2</code>) 
                that grant access to pools. Share these codes with trusted members only.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Stroops
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                The smallest unit of XLM (1 XLM = 10,000,000 stroops). Expenses are recorded in stroops 
                for precision. When entering amounts, the app converts: 10000000 stroops = 1 XLM.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Immutable Ledger
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                Every expense logged is permanently recorded on the Stellar blockchain. 
                This provides cryptographic proof of all transactions and prevents tampering.
              </p>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Frequently asked
            </h2>
          </motion.div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Do I need Stellar tokens to use SplitStellar?
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                SplitStellar runs on the Stellar testnet for demonstration purposes. 
                You can get free testnet XLM from the 
                <a href="https://laboratory.stellar.org/#account/create" target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400 mx-1">
                  Stellar Laboratory
                </a>
                or other testnet faucets.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                How do I share a pool with others?
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                Copy the invite link from your pool dashboard. Share it with trusted members. 
                They'll need to request access, which you can approve or reject.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                Is my data private?
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                Pool membership is stored in Supabase (or localStorage in demo mode). 
                Expense data is public on the Stellar blockchain but pseudonymous — 
                only wallet addresses are visible, not personal identities.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black p-6 transition-colors duration-500"
            >
              <h3 className="font-serif italic text-lg text-black dark:text-white mb-2">
                What wallets are supported?
              </h3>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                SplitStellar supports Freighter, Albedo, xBull, and WalletConnect-compatible wallets. 
                Mobile users can connect via WalletConnect QR code.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-[#050505] p-8 sm:p-12 text-center transition-colors duration-500"
          >
            <div className="w-16 h-[1px] bg-black dark:bg-white mb-6 mx-auto" />
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Ready to settle?
            </h2>
            <p className="font-mono text-sm text-[#666] dark:text-[#888] mb-8 max-w-md mx-auto">
              Connect your wallet and experience cryptographic expense settlement.
            </p>
            <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
              Initialize App
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
