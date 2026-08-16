import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAll, getStats, clearAnalytics, syncAnalytics } from '../services/analytics';
import { Activity, Users, BarChart3, Trash2 } from 'lucide-react';
import { useStellarStore } from '../hooks/useStellar';

export default function Analytics() {
  const { address } = useStellarStore();
  const [events, setEvents] = useState(() => getAll());
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (address) syncAnalytics().then(() => setEvents(getAll()));
  }, [address]);

  const stats = getStats();

  const handleClear = () => {
    clearAnalytics();
    setEvents([]);
  };

  const filtered = filter
    ? events.filter((e) => e.event.includes(filter) || e.properties?.wallet_address?.includes(filter))
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif italic tracking-tight mb-4">Analytics</h1>
            <p className="font-mono text-sm text-[#666] dark:text-[#888]">Event tracking and usage metrics.</p>
          </div>
          <button onClick={handleClear} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full" title="Clear data">
            <Trash2 className="w-4 h-4 text-[#666] dark:text-[#888]" />
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            <div className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-3">
                <Activity className="w-4 h-4 text-[#666] dark:text-[#888]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">Total Events</span>
              </div>
              <span className="font-mono text-4xl">{stats.total}</span>
            </div>
            <div className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-4 h-4 text-[#666] dark:text-[#888]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">Unique Wallets</span>
              </div>
              <span className="font-mono text-4xl">{stats.uniqueWallets}</span>
            </div>
            <div className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-white dark:bg-black">
              <div className="flex items-center gap-3 mb-3">
                <BarChart3 className="w-4 h-4 text-[#666] dark:text-[#888]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">Event Types</span>
              </div>
              <span className="font-mono text-4xl">{Object.keys(stats.byEvent).length}</span>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event or wallet..."
            className="w-full bg-transparent border border-[#E5E5E5] dark:border-[#333] p-4 font-mono text-xs text-black dark:text-white outline-none focus:border-black dark:focus:border-white"
          />
        </div>

        <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black divide-y divide-[#E5E5E5] dark:divide-[#222]">
          {filtered.length === 0 ? (
            <div className="p-6 text-center font-mono text-xs text-[#666] dark:text-[#888]">
              No events recorded yet. Interact with the app to generate data.
            </div>
          ) : (
            filtered.slice().reverse().slice(0, 100).map((e, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-wider">{e.event}</span>
                <div className="font-mono text-[10px] text-[#666] dark:text-[#888] truncate max-w-[300px]">
                  {e.properties?.wallet_address
                    ? `${e.properties.wallet_address.slice(0, 5)}...`
                    : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
