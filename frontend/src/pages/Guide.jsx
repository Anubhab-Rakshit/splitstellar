import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Wallet, Users, Receipt, ArrowRightLeft, Shield, Globe, Zap, Lock,
  ChevronRight, ChevronDown, ExternalLink, FileCode, Database, Layers,
} from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Link your Stellar wallet (Freighter, Albedo, xBull, or WalletConnect) to access the settlement engine.',
    step: '01',
  },
  {
    icon: Users,
    title: 'Create or Join a Pool',
    description: 'Start a new expense pool or join an existing one using an 8-character invite code.',
    step: '02',
  },
  {
    icon: Receipt,
    title: 'Log Expenses',
    description: 'Record expenses directly on the Stellar blockchain. Each entry is immutable and timestamped.',
    step: '03',
  },
  {
    icon: ArrowRightLeft,
    title: 'Settle Up',
    description: 'Calculate net balances and settle debts instantly via on-chain XLM payments.',
    step: '04',
  },
];

const securityFeatures = [
  { icon: Lock, title: 'Invite-Only Access', description: 'Pools are private by default. Only users with valid invite codes can request to join.' },
  { icon: Shield, title: 'Owner Approval', description: 'Pool creators approve or reject join requests, maintaining full control over membership.' },
  { icon: Globe, title: 'On-Chain Verification', description: 'All expenses are verified against the Soroban smart contract before being recorded.' },
  { icon: Zap, title: 'Instant Settlement', description: 'Payments settle in ~5 seconds with near-zero fees on the Stellar network.' },
];

const keyConcepts = [
  {
    title: 'Expense Pools',
    content: 'A shared workspace for tracking group expenses. Each pool has a unique on-chain ID, an invite code for access control, and an immutable ledger of all recorded expenses. Pools support up to 200 members and 1,000 expenses.',
  },
  {
    title: 'Invite Codes',
    content: '8-character alphanumeric codes (e.g., A3B7K9M2) that grant access to pools. Share these codes with trusted members only. Join requests require explicit creator approval.',
  },
  {
    title: 'Stroops',
    content: 'The smallest unit of XLM (1 XLM = 10,000,000 stroops). Expenses are recorded in stroops for precision. When entering amounts, the app converts automatically.',
  },
  {
    title: 'Immutable Ledger',
    content: 'Every expense logged is permanently recorded on the Stellar blockchain via the Soroban smart contract. This provides cryptographic proof of all transactions and prevents tampering.',
  },
  {
    title: 'Settlement Tracking',
    content: 'All settlements between pool members are recorded on-chain with a SettlementRecord containing sender, receiver, amount, and timestamp. This creates a complete audit trail of debt resolution.',
  },
  {
    title: 'Pool Lifecycle',
    content: 'Pools have an active/archived status. Archived pools reject new expenses, members, and settlements but preserve historical data. Pool creators can rename active pools at any time.',
  },
];

const smartContractFunctions = [
  { name: 'create_pool', desc: 'Create a new expense pool. Creator is auto-enrolled as first member.', icon: FileCode },
  { name: 'add_pool_member', desc: 'Add a member to a pool (creator only). Emits MemberAddedEvent.', icon: Users },
  { name: 'log_expense', desc: 'Record an expense. Validates member status, amount > 0, and pool capacity.', icon: Receipt },
  { name: 'record_settlement', desc: 'Record a settlement between two members. Both must be pool members.', icon: ArrowRightLeft },
  { name: 'archive_pool', desc: 'Archive a pool (creator only). Blocks all new writes while preserving data.', icon: Layers },
  { name: 'update_pool_name', desc: 'Rename a pool (creator only). Pool must be active.', icon: Database },
];

const faqItems = [
  {
    q: 'Do I need Stellar tokens to use SplitStellar?',
    a: 'SplitStellar runs on the Stellar testnet for demonstration. Get free testnet XLM from the Stellar Laboratory or other testnet faucets to try it out.',
  },
  {
    q: 'How do I share a pool with others?',
    a: 'Copy the invite link from your pool dashboard and share it with trusted members. They will request access, which you can approve or reject as the pool creator.',
  },
  {
    q: 'Is my data private?',
    a: 'Pool membership is managed via Supabase. Expense data is recorded on the Stellar blockchain but pseudonymous — only wallet addresses are visible, not personal identities.',
  },
  {
    q: 'What wallets are supported?',
    a: 'SplitStellar supports Freighter, Albedo, xBull, and WalletConnect-compatible wallets. On mobile, connect with Albedo (works in your browser) or WalletConnect.',
  },
  {
    q: 'How are expenses split?',
    a: 'The smart contract records who paid and how much. Split calculations (equal, percentage, exact amounts) are computed off-chain for flexibility, then settled via on-chain payments.',
  },
  {
    q: 'What happens if the network is down?',
    a: 'Stellar has 99.99%+ uptime. In the unlikely event of network issues, expenses are cached locally and synced when connectivity is restored.',
  },
];

function AccordionItem({ title, content, index, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black transition-colors duration-500"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left group"
        aria-expanded={isOpen}
      >
        <h3 className="font-serif italic text-base sm:text-lg text-black dark:text-white pr-4">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-[#666] dark:text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                {content}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQItem({ q, a, index, isOpen, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black transition-colors duration-500"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left group"
        aria-expanded={isOpen}
      >
        <h3 className="font-serif italic text-base sm:text-lg text-black dark:text-white pr-4">
          {q}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-[#666] dark:text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6">
              <p className="font-mono text-xs text-[#666] dark:text-[#888] leading-relaxed">
                {a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Guide() {
  const [openConcept, setOpenConcept] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

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
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
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
                viewport={{ once: true, margin: '-50px' }}
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

        {/* SMART CONTRACT */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Smart contract
            </h2>
            <p className="text-sm font-mono text-[#666] dark:text-[#888] max-w-lg">
              On-chain functions powering the settlement engine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartContractFunctions.map((fn, index) => (
              <motion.div
                key={fn.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="border border-[#E5E5E5] dark:border-[#222] bg-[#F7F7F7] dark:bg-[#050505] p-5 transition-colors duration-500 group hover:border-black dark:hover:border-white"
              >
                <div className="flex items-center gap-2 mb-2">
                  <fn.icon className="w-3.5 h-3.5 text-[#666] dark:text-[#888] group-hover:text-black dark:group-hover:text-white transition-colors" />
                  <code className="font-mono text-xs text-black dark:text-white font-medium">
                    {fn.name}
                  </code>
                </div>
                <p className="font-mono text-[10px] text-[#666] dark:text-[#888] leading-relaxed">
                  {fn.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECURITY FEATURES */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
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
                viewport={{ once: true, margin: '-50px' }}
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

        {/* KEY CONCEPTS (Accordion) */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Key concepts
            </h2>
            <p className="text-sm font-mono text-[#666] dark:text-[#888] max-w-lg">
              Core terminology and architecture.
            </p>
          </motion.div>

          <div className="space-y-3">
            {keyConcepts.map((concept, index) => (
              <AccordionItem
                key={concept.title}
                title={concept.title}
                content={concept.content}
                index={index}
                isOpen={openConcept === index}
                onToggle={() => setOpenConcept(openConcept === index ? null : index)}
              />
            ))}
          </div>
        </section>

        {/* FAQ (Accordion) */}
        <section className="mb-16 sm:mb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-serif italic text-black dark:text-white mb-4">
              Frequently asked
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <FAQItem
                key={index}
                q={item.q}
                a={item.a}
                index={index}
                isOpen={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
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
