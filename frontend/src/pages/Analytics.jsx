import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAll, getStats, clearAnalytics, syncAnalytics } from '../services/analytics';
import { Activity, Users, BarChart3, Trash2 } from 'lucide-react';

function toIST(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function Analytics() {
  const [events, setEvents] = useState(() => getAll());
  const [filter, setFilter] = useState('');

  useEffect(() => {
    syncAnalytics().then(() => setEvents(getAll()));
  }, []);

  const stats = getStats();

  const handleClear = () => {
    clearAnalytics();
    setEvents([]);
  };

  const filtered = filter
    ? events.filter((e) => e.event.includes(filter) || e.properties?.wallet_address?.includes(filter))
    : events;

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {stats && (
            <div className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-white dark:bg-black">
              <h3 className="font-serif italic text-lg mb-4">Events Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(stats.byEvent)
                  .sort(([, a], [, b]) => b - a)
                  .map(([event, count]) => (
                    <div key={event} className="flex items-center justify-between font-mono text-xs">
                      <span className="text-[#666] dark:text-[#888]">{event}</span>
                      <span>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
          {stats && (
            <div className="border border-[#E5E5E5] dark:border-[#222] p-6 bg-white dark:bg-black">
              <h3 className="font-serif italic text-lg mb-4">Daily Activity</h3>
              <div className="space-y-2">
                {Object.entries(stats.byDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-14)
                  .map(([day, count]) => (
                    <div key={day} className="flex items-center justify-between font-mono text-xs">
                      <span className="text-[#666] dark:text-[#888]">{day}</span>
                      <span>{count} events</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

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
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#666] dark:text-[#888] w-16 shrink-0">
                    {toIST(e.timestamp)}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider">{e.event}</span>
                </div>
                <div className="font-mono text-[10px] text-[#666] dark:text-[#888] truncate max-w-[300px]">
                  {e.properties?.wallet_address
                    ? `${e.properties.wallet_address.slice(0, 8)}...`
                    : e.url?.slice(0, 40)}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
