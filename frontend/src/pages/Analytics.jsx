import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAll, getStats, clearAnalytics, syncAnalytics } from '../services/analytics';
import { Activity, Users, BarChart3, Trash2, TrendingUp, X, AlertTriangle } from 'lucide-react';
import { useStellarStore } from '../hooks/useStellar';
import InteractionGraph from '../components/InteractionGraph';
import StaggeredText from '../components/StaggeredText';

const EVENT_COLORS = {
  wallet_connect: '#22c55e',
  create_pool: '#3b82f6',
  join_request: '#a855f7',
  log_expense: '#f59e0b',
  settle_payment: '#ef4444',
  update_profile: '#06b6d4',
};

function formatTimestamp(isoStr) {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoStr;
  }
}

export default function Analytics() {
  const { address } = useStellarStore();
  const [events, setEvents] = useState(() => getAll());
  const [filter, setFilter] = useState('');
  const [showGraph, setShowGraph] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    if (address) syncAnalytics().then(() => setEvents(getAll()));
  }, [address]);

  const anyModalOpen = showGraph || showConfirmClear;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

  const stats = getStats();

  const confirmClear = () => {
    clearAnalytics();
    setEvents([]);
    setShowConfirmClear(false);
  };

  const filtered = filter
    ? events.filter((e) => e.event?.includes(filter) || e.properties?.wallet_address?.includes(filter))
    : events;

  if (!address) {
    return (
      <div className="min-h-screen pt-24 sm:pt-40 px-4 sm:px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl sm:text-4xl font-serif italic mb-4">Connect Wallet</h1>
        <p className="text-xs sm:text-sm font-mono text-[#666] dark:text-[#888] max-w-md">Please connect your wallet to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-20 sm:pb-32 px-6 lg:px-12 max-w-[1000px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4">
          <div>
            <StaggeredText text="Global Analytics" className="text-4xl sm:text-5xl md:text-7xl font-serif italic tracking-tight mb-4" />
            <p className="font-mono text-sm text-[#666] dark:text-[#888]">Event tracking and usage metrics.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGraph(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#E5E5E5] dark:border-[#222] hover:border-black dark:hover:border-white font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">User Interaction Graph</span>
            </button>
            <button 
              onClick={() => setShowConfirmClear(true)} 
              aria-label="Clear analytics data"
              className="p-2 border border-[#E5E5E5] dark:border-[#222] hover:border-red-500 hover:text-red-500 transition-colors" 
              title="Clear data"
            >
              <Trash2 className="w-4 h-4 text-[#666] dark:text-[#888] hover:text-red-500" />
            </button>
          </div>
        </div>

        {stats && (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
              }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              {[
                { title: 'Total Events', value: stats.total, icon: Activity },
                { title: 'Unique Wallets', value: stats.uniqueWallets, icon: Users },
                { title: 'Event Types', value: Object.keys(stats.byEvent).length, icon: BarChart3 }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100 } }
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="glass-card p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <stat.icon className="w-4 h-4 text-[#666] dark:text-[#888]" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">{stat.title}</span>
                  </div>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + (idx * 0.1) }}
                    className="font-mono text-4xl block"
                  >
                    {stat.value}
                  </motion.span>
                </motion.div>
              ))}
            </motion.div>

            {/* Event Type Breakdown */}
            <div className="glass-card p-6 mb-12">
              <h2 className="font-serif italic text-xl mb-4">Event Type Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {Object.entries(stats.byEvent).map(([eventName, count], idx) => {
                  const color = EVENT_COLORS[eventName] || '#888888';
                  return (
                    <motion.div 
                      key={eventName} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      className="p-3 hairline-card"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        <span className="font-mono text-[10px] uppercase tracking-wider truncate text-[#666] dark:text-[#888]">
                          {eventName.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="font-mono text-xl font-bold">{count}</div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event or wallet..."
            className="w-full bg-transparent border border-[#E5E5E5] dark:border-[#222] p-4 font-mono text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="glass-card p-0 divide-y divide-black/5 dark:divide-white/5 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-[#666] dark:text-[#888]">
              No events recorded yet. Interact with the app to generate data.
            </div>
          ) : (
            filtered.slice(0, 100).map((e, i) => {
              const dotColor = EVENT_COLORS[e.event] || '#888888';
              return (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.02 }}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: dotColor }} />
                    <span className="font-mono text-xs uppercase tracking-wider">{e.event}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {e.properties?.wallet_address && (
                      <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                        {`${e.properties.wallet_address.slice(0, 6)}...${e.properties.wallet_address.slice(-4)}`}
                      </span>
                    )}
                    {e.timestamp && (
                      <span className="font-mono text-[10px] text-[#888] dark:text-[#666]">
                        {formatTimestamp(e.timestamp)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Confirmation Modal before clearing */}
      <AnimatePresence>
        {showConfirmClear && (
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="confirm-clear-title"
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowConfirmClear(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222] p-6 sm:p-8"
            >
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h2 id="confirm-clear-title" className="text-2xl font-serif italic mb-2">Clear Analytics Logs?</h2>
              <p className="font-mono text-xs text-[#666] dark:text-[#888] mb-6">
                This action will wipe all stored event entries locally and remotely. This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="btn-secondary flex-1 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmClear}
                  className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase tracking-widest flex-1 py-3 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interaction Graph Modal */}
      <AnimatePresence>
        {showGraph && (
          <div 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="graph-modal-title"
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowGraph(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-3xl bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222] p-6 sm:p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 id="graph-modal-title" className="text-2xl sm:text-3xl font-serif italic tracking-tight">User Interaction</h2>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] mt-1">Last 14 days</p>
                </div>
                <button
                  onClick={() => setShowGraph(false)}
                  aria-label="Close interaction graph"
                  className="p-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <InteractionGraph />

              <div className="mt-6 flex flex-wrap gap-4">
                {[
                  { color: '#22c55e', label: 'Wallet Connect' },
                  { color: '#3b82f6', label: 'Create Pool' },
                  { color: '#a855f7', label: 'Join Request' },
                  { color: '#f59e0b', label: 'Log Expense' },
                  { color: '#ef4444', label: 'Settle Payment' },
                  { color: '#06b6d4', label: 'Update Profile' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: item.color }} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#666] dark:text-[#888]">{item.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="w-4 border-t-2 border-dashed border-[#06b6d4]" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#666] dark:text-[#888]">Unique Wallets</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
