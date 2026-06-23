import { useState, useEffect, useCallback } from 'react';
import { useStellarStore } from '../hooks/useStellar';
import { simulateCall, buildAndSubmit } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { db } from '../services/db';
import { Loader2, Activity, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import SettleUp from './SettleUp';

export default function ExpenseLogger({ poolId }) {
  const { address, kit } = useStellarStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!poolId) return;
    try {
      const data = await simulateCall(address, 'get_pool_expenses', {
        poolId,
      });
      setExpenses(data || []);
    } catch {
      /* poll failures are silent */
    }
  }, [poolId, address]);

  useEffect(() => {
    if (!poolId) return;
    const initialLoad = async () => {
      setLoadingExpenses(true);
      await fetchExpenses();
      setLoadingExpenses(false);
    };
    const id = setInterval(() => fetchExpenses(), 8000);
    setTimeout(initialLoad, 0);
    return () => clearInterval(id);
  }, [poolId, fetchExpenses]);

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description || !address || !kit) return;

    setIsSubmitting(true);
    triggerToast('Submitting to Soroban contract...', 'info');

    try {
      const newExpense = await buildAndSubmit(address, kit, 'log_expense', {
        poolId: Number(poolId),
        description,
        amount: Math.round(parseFloat(amount) * 1e7),
        payer: address,
      });

      setExpenses((prev) => [newExpense, ...prev]);
      setAmount('');
      setDescription('');
      db.logActivity(address, 'log_expense', {
        pool_id: Number(poolId),
        description,
        amount: Math.round(parseFloat(amount) * 1e7),
        tx_hash: newExpense.txHash,
      });
      triggerToast(`Expense logged — tx: ${newExpense.txHash?.slice(0, 12)}...`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(
        err.message || 'Transaction rejected by network',
        'error',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleLogExpense}
        className="mb-12 border border-[#E5E5E5] dark:border-[#333] p-6 bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500"
      >
        <h3 className="font-serif italic text-xl mb-6">Log New Expense</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
              placeholder="e.g. Server hosting"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#888] mb-2">
              Amount (stroops)
            </label>
            <input
              type="number"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
              placeholder="10000000 = 1 XLM"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !kit}
          className="w-full btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Submitting to
              Network...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Submit to Network <Send className="w-3.5 h-3.5" />
            </span>
          )}
        </button>
      </form>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif italic text-xl">Immutable Ledger</h3>
          <div className="flex items-center gap-2 px-3 py-1 border border-[#E5E5E5] dark:border-[#333] rounded-full transition-colors duration-500">
            <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">
              Live
            </span>
          </div>
        </div>

        {loadingExpenses ? (
          <div className="flex justify-center p-12 border border-[#E5E5E5] dark:border-[#222]">
            <Loader2 className="w-6 h-6 animate-spin text-[#888]" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 border border-[#E5E5E5] dark:border-[#222] text-center bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500">
            <p className="font-mono text-xs text-[#888]">
              No cryptographic records found in this partition.
            </p>
          </div>
        ) : (
          <div className="border border-[#E5E5E5] dark:border-[#222] transition-colors duration-500">
            {expenses.map((exp, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={exp.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 ${index !== expenses.length - 1 ? 'border-b border-[#E5E5E5] dark:border-[#222]' : ''} hover:bg-[#F7F7F7] dark:hover:bg-[#111] transition-colors duration-300`}
              >
                <div>
                  <div className="font-mono text-sm mb-1">
                    {exp.description}
                  </div>
                  <div className="flex items-center gap-4 font-mono text-[10px] text-[#888]">
                    <span>
                      {exp.payer
                        ? `${exp.payer.substring(0, 8)}...`
                        : 'Unknown'}
                    </span>
                    {exp.txHash && (
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${exp.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400"
                      >
                        tx
                      </a>
                    )}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 font-mono text-lg">
                  {(exp.amount / 1e7).toFixed(2)} XLM
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <SettleUp expenses={expenses} />
    </div>
  );
}
