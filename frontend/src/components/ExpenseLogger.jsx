import { useState, useEffect, useCallback, useRef } from 'react';
import { useStellarStore } from '../hooks/useStellar';
import { simulateCall, buildAndSubmit } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { db } from '../services/db';
import { Loader2, Activity, Send, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import SettleUp from './SettleUp';
import { track } from '../services/analytics';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export default function ExpenseLogger({ poolId, poolCreator }) {
  const { address, kit } = useStellarStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const memberChecked = useRef(false);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (!address || memberChecked.current) return;
    memberChecked.current = true;
    db.isPoolMember(poolId, address).then(setIsMember).catch(() => {});
  }, [poolId, address]);

  const fetchExpenses = useCallback(async (isRetry = false) => {
    if (!poolId || !isMember) return;
    
    // Cancel any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    try {
      const data = await simulateCall(address, 'get_pool_expenses', {
        poolId,
      });
      setExpenses(data || []);
      setLoadError(null);
      setRetryCount(0);
    } catch (err) {
      if (err.name === 'AbortError') return; // Request was cancelled, ignore
      
      if (isRetry && retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        // Exponential backoff
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (retryCount + 1)));
        return fetchExpenses(true);
      }
      
      setLoadError(err.message || 'Failed to load expenses');
      // Only show toast on initial load failure, not on poll failures
      if (!isRetry) {
        triggerToast('Failed to load expenses from ledger', 'error');
      }
    }
  }, [poolId, address, isMember, retryCount]);

  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setLoadError(null);
    setLoadingExpenses(true);
    fetchExpenses(true).finally(() => setLoadingExpenses(false));
  }, [fetchExpenses]);

  useEffect(() => {
    if (!poolId || !isMember) return;
    let cancelled = false;
    
    const initialLoad = async () => {
      setLoadingExpenses(true);
      await fetchExpenses();
      if (!cancelled) setLoadingExpenses(false);
    };
    
    // Poll with longer interval to reduce load
    const id = setInterval(() => fetchExpenses(), 12000);
    setTimeout(initialLoad, 0);
    
    return () => {
      cancelled = true;
      clearInterval(id);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [poolId, fetchExpenses, isMember]);

  const sanitizeInput = (input) => {
    return input.replace(/[<>]/g, '').trim();
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    if (!amount || !description || !address || !kit) return;

    const sanitizedDescription = sanitizeInput(description);
    if (sanitizedDescription.length < 1 || sanitizedDescription.length > 128) {
      triggerToast('Description must be 1-128 characters', 'error');
      return;
    }

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0 || !Number.isFinite(parsed)) {
      triggerToast('Enter a valid positive amount', 'error');
      return;
    }

    if (parsed > 1000000000) {
      triggerToast('Amount too large (max 1 billion XLM)', 'error');
      return;
    }

    setIsSubmitting(true);
    triggerToast('Submitting to Soroban contract...', 'info');

    try {
      const newExpense = await buildAndSubmit(address, kit, 'log_expense', {
        poolId: Number(poolId),
        description: sanitizedDescription,
        amount: Math.round(parsed * 1e7),
        payer: address,
      });

      setExpenses((prev) => [newExpense, ...prev]);
      setAmount('');
      setDescription('');
      track('log_expense', { pool_id: Number(poolId), amount: parsed, description: sanitizedDescription, wallet_address: address });
      db.logActivity(address, 'log_expense', {
        pool_id: Number(poolId),
        description: sanitizedDescription,
        amount: Math.round(parsed * 1e7),
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

  const canView = isMember || poolCreator === address;

  return (
    <div>
      {!canView ? (
        <div className="mb-12 p-6 border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 text-center">
          <p className="font-mono text-xs text-amber-700 dark:text-amber-400">
            You are not a member of this pool. Join via the pool link or enter the pool ID to log expenses.
          </p>
        </div>
      ) : (
        <>
      <form
        onSubmit={handleLogExpense}
        className="mb-12 border border-[#E5E5E5] dark:border-[#333] p-6 bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500"
      >
        <h3 className="font-serif italic text-xl mb-6">Log New Expense</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
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
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
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
          <div className="flex flex-col items-center justify-center p-12 border border-[#E5E5E5] dark:border-[#222]">
            <Loader2 className="w-6 h-6 animate-spin text-[#666] dark:text-[#888] mb-4" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888]">
              Syncing with ledger...
            </p>
          </div>
        ) : loadError ? (
          <div className="p-8 border border-red-500/20 bg-red-50 dark:bg-red-950/10 text-center">
            <p className="font-mono text-xs text-red-500 mb-4">{loadError}</p>
            <button
              onClick={handleManualRetry}
              className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 border border-[#E5E5E5] dark:border-[#222] text-center bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500">
            <p className="font-mono text-xs text-[#666] dark:text-[#888]">
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
                  <div className="flex items-center gap-4 font-mono text-[10px] text-[#666] dark:text-[#888]">
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
        </>
      )}
    </div>
  );
}
