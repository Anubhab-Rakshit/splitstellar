import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStellarStore } from '../hooks/useStellar';
import ExpenseLogger from '../components/ExpenseLogger';
import { createExpensePool } from '../services/db';
import { triggerToast } from '../services/toast';
import { Loader2, Plus, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { address } = useStellarStore();
  const [pools, setPools] = useState([]);
  const [newPoolName, setNewPoolName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!newPoolName.trim() || !address) return;

    try {
      setIsCreating(true);
      const pool = await createExpensePool(newPoolName, address);
      setPools([pool, ...pools]);
      setNewPoolName('');
      triggerToast("Ledger partition initialized", "success");
    } catch {
      triggerToast("Failed to initialize partition", "error");
    } finally {
      setIsCreating(false);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen pt-40 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-serif italic mb-4">Awaiting Connection</h1>
        <p className="text-sm font-mono text-[#888]">Please connect your wallet to access the settlement engine.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-40 pb-32 px-6 lg:px-12 max-w-[1200px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight mb-4">
            Command Center
          </h1>
          <p className="font-mono text-sm text-[#888]">Manage cryptographic expense partitions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Pools List */}
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-serif italic mb-6">Active Partitions</h2>
            
            <form onSubmit={handleCreatePool} className="mb-8">
              <div className="flex items-center border border-[#E5E5E5] dark:border-[#333] transition-colors duration-500 bg-white dark:bg-black group">
                <input
                  type="text"
                  placeholder="NEW PARTITION NAME"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none p-4 font-mono text-xs text-black dark:text-white uppercase placeholder:text-[#888]"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="p-4 border-l border-[#E5E5E5] dark:border-[#333] hover:bg-[#F7F7F7] dark:hover:bg-[#111] transition-colors text-black dark:text-white disabled:opacity-50"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {pools.length === 0 ? (
                <div className="p-6 border border-[#E5E5E5] dark:border-[#222] text-center transition-colors duration-500">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#888]">No Partitions Found</p>
                </div>
              ) : (
                pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => setSelectedPool(pool)}
                    className={`w-full text-left p-6 border transition-all duration-300 ${
                      selectedPool?.id === pool.id 
                        ? 'border-black dark:border-white bg-[#F7F7F7] dark:bg-[#111]' 
                        : 'border-[#E5E5E5] dark:border-[#222] hover:border-[#CCC] dark:hover:border-[#444] bg-white dark:bg-black'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-serif italic text-xl">{pool.name}</span>
                      <ArrowRight className={`w-4 h-4 transition-transform duration-300 ${selectedPool?.id === pool.id ? 'translate-x-1' : ''}`} />
                    </div>
                    <div className="font-mono text-[10px] text-[#888] break-all">ID: {pool.id}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Active Pool Details */}
          <div className="lg:col-span-8">
            {selectedPool ? (
              <div className="border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-[#030303] p-8 transition-colors duration-500">
                <div className="border-b border-[#E5E5E5] dark:border-[#222] pb-6 mb-8 transition-colors duration-500">
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-[#888] mb-2">Partition View</span>
                  <h2 className="text-4xl font-serif italic">{selectedPool.name}</h2>
                </div>
                
                {/* The Expense Logger Component will be placed here */}
                <ExpenseLogger poolId={selectedPool.id} poolName={selectedPool.name} />
              </div>
            ) : (
              <div className="h-full min-h-[400px] border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black flex flex-col items-center justify-center p-8 text-center transition-colors duration-500">
                <div className="w-16 h-[1px] bg-black dark:bg-white mb-6" />
                <h3 className="font-serif italic text-2xl mb-2">Select a Partition</h3>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[#888]">Initialize a new ledger partition or select an existing one to begin cryptographic settlement.</p>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
