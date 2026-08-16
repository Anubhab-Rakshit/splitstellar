import { useState, useEffect, useCallback, useRef } from 'react';
import { useStellarStore } from '../hooks/useStellar';
import { simulateCall, buildAndSubmit } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { db } from '../services/db';
import { Loader2, Activity, Send, RefreshCw, Undo2, MessageSquare, ChevronDown, Download, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SettleUp from './SettleUp';
import { track } from '../services/analytics';
import { downloadCSV, downloadPDF } from '../services/export';
import { getCurrencies, toStroops, getRateNote } from '../services/currency';
import {
  EXPENSE_CATEGORIES,
  SPLIT_TYPES,
  getCategoryById,
} from '../services/categories';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export default function ExpenseLogger({ poolId, poolCreator, members = [] }) {
  const { address, kit } = useStellarStore();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('food');
  const [splitType, setSplitType] = useState('equal');
  const [currency, setCurrency] = useState('XLM');
  const [customSplitData, setCustomSplitData] = useState({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSplitDropdown, setShowSplitDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const memberChecked = useRef(false);
  const abortControllerRef = useRef(null);
  const categoryDropdownRef = useRef(null);
  const splitDropdownRef = useRef(null);
  const localMetaRef = useRef({});

  // Undo/Redo history
  const [expenseHistory, setExpenseHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
      if (splitDropdownRef.current && !splitDropdownRef.current.contains(e.target)) {
        setShowSplitDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!address || memberChecked.current) return;
    memberChecked.current = true;
    db.isPoolMember(poolId, address).then(setIsMember).catch(() => {});
  }, [poolId, address]);

  useEffect(() => {
    const cached = db.getCachedExpenses();
    const meta = {};
    for (const exp of cached) {
      if (String(exp.poolId) === String(poolId) && exp.id) {
        meta[exp.id] = {
          txHash: exp.txHash,
          category: exp.category,
          notes: exp.notes,
          splitType: exp.splitType,
          splitData: exp.splitData,
        };
      }
    }
    localMetaRef.current = meta;
  }, [poolId]);

  const fetchExpensesWithRetry = useCallback(async (isRetry = false) => {
    if (!poolId || !isMember) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    let currentRetryCount = isRetry ? 0 : 0;
    
    const attemptFetch = async () => {
      try {
        const data = await simulateCall(address, 'get_pool_expenses', {
          poolId,
        });
        const merged = (data || []).map((e) => ({
          ...e,
          ...(localMetaRef.current[e.id] || {}),
        }));
        setExpenses(merged);
        setLoadError(null);
        db.cacheExpenses(poolId, merged);
      } catch (err) {
        if (err.name === 'AbortError') return;
        
        if (currentRetryCount < MAX_RETRIES) {
          currentRetryCount += 1;
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS * currentRetryCount));
          return attemptFetch();
        }
        
        setLoadError(err.message || 'Failed to load expenses');
        if (!isRetry) {
          triggerToast('Failed to load expenses from ledger', 'error');
        }
      }
    };
    
    await attemptFetch();
  }, [poolId, address, isMember]);

  const fetchExpenses = fetchExpensesWithRetry;

  const handleManualRetry = useCallback(() => {
    setLoadError(null);
    setLoadingExpenses(true);
    fetchExpensesWithRetry(true).finally(() => setLoadingExpenses(false));
  }, [fetchExpensesWithRetry]);

  useEffect(() => {
    if (!poolId || !isMember) return;
    let cancelled = false;
    let intervalId = null;

    const startPolling = (delayMs) => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => fetchExpenses(), delayMs);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchExpenses();
        startPolling(6000);
      } else {
        startPolling(30000);
      }
    };

    const initialLoad = async () => {
      setLoadingExpenses(true);
      await fetchExpenses();
      if (!cancelled) setLoadingExpenses(false);
    };

    // Poll at 6s when tab is visible (real-time feel), 30s when hidden
    startPolling(6000);
    setTimeout(initialLoad, 0);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
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

    // Convert entered amount (in selected currency) to XLM stroops for on-chain storage
    const amountStroops = toStroops(amount, currency);
    if (amountStroops <= 0) {
      triggerToast('Enter a valid positive amount', 'error');
      return;
    }

    const parsedXlm = amountStroops / 1e7;
    if (parsedXlm > 1000000000) {
      triggerToast('Amount too large (max 1 billion XLM)', 'error');
      return;
    }

    // Validate custom split data
    if (splitType === 'percentage' && customSplitData.percentages) {
      const totalPct = Object.values(customSplitData.percentages).reduce((sum, p) => sum + p, 0);
      if (Math.abs(totalPct - 100) > 1) {
        triggerToast('Percentages must total 100%', 'error');
        return;
      }
    }

    if (splitType === 'exact' && customSplitData.amounts) {
      const totalAmt = Object.values(customSplitData.amounts).reduce((sum, a) => sum + a, 0);
      if (Math.abs(totalAmt - amountStroops) > 1) {
        triggerToast(`Exact amounts must total ${amount} ${currency}`, 'error');
        return;
      }
    }

    setIsSubmitting(true);
    triggerToast('Submitting to Soroban contract...', 'info');

    try {
      const newExpense = await buildAndSubmit(address, kit, 'log_expense', {
        poolId: Number(poolId),
        description: sanitizedDescription,
        amount: amountStroops,
        payer: address,
        category,
        notes: sanitizeInput(notes) || undefined,
        splitType,
        splitData: splitType !== 'equal' ? customSplitData : undefined,
      });

      const expenseWithMeta = {
        ...newExpense,
        category,
        notes: notes ? sanitizeInput(notes) : undefined,
        splitType,
        splitData: splitType !== 'equal' ? customSplitData : undefined,
      };

      if (expenseWithMeta.id) {
        localMetaRef.current[expenseWithMeta.id] = {
          txHash: newExpense.txHash,
          category,
          notes: notes ? sanitizeInput(notes) : undefined,
          splitType,
          splitData: splitType !== 'equal' ? customSplitData : undefined,
        };
      }

      setExpenses((prev) => [expenseWithMeta, ...prev]);
      db.cacheExpenses(poolId, [expenseWithMeta, ...expenses]);
      
      // Add to undo history
      setExpenseHistory((prev) => {
        const newHistory = [...prev.slice(0, historyIndex + 1), expenseWithMeta];
        return newHistory.slice(-5); // Keep last 5 expenses for undo
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 4));

      setAmount('');
      setDescription('');
      setNotes('');
      setCategory('food');
      setSplitType('equal');
      setCustomSplitData({});
      track('log_expense', { pool_id: Number(poolId), amount: parsedXlm, description: sanitizedDescription, category, wallet_address: address });
      db.logActivity(address, 'log_expense', {
        pool_id: Number(poolId),
        description: sanitizedDescription,
        amount: amountStroops,
        category,
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

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    
    const lastExpense = expenseHistory[historyIndex];
    if (lastExpense) {
      setExpenses((prev) => prev.filter(exp => exp.id !== lastExpense.id));
      setHistoryIndex((prev) => prev - 1);
      triggerToast('Expense undone', 'info');
    }
  }, [historyIndex, expenseHistory]);

  const canUndo = historyIndex >= 0 && expenseHistory.length > 0;

  const handleSplitTypeChange = (type) => {
    setSplitType(type);
    setCustomSplitData({});
    setShowSplitDropdown(false);
  };

  const handleCustomSplitDataChange = (field, member, value) => {
    setCustomSplitData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [member]: value,
      },
    }));
  };

  const selectedCategory = getCategoryById(category);
  const selectedSplitType = SPLIT_TYPES.find((s) => s.id === splitType);

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
        <div className="flex flex-wrap gap-2 items-center justify-between mb-6">
          <h3 className="font-serif italic text-xl">Log New Expense</h3>
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="flex items-center gap-2 text-xs font-mono text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Undo last
            </button>
          )}
        </div>

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
              Amount ({currency})
            </label>
            <div className="flex items-center gap-2 border-b border-[#CCC] dark:border-[#333] focus-within:border-black dark:focus-within:border-white transition-colors">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
                placeholder={currency === 'XLM' ? 'e.g. 1.5' : `≈ ${currency === 'USDC' ? '0.12' : '0.11'} XLM each`}
                required
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent border-none outline-none font-mono text-xs text-[#666] dark:text-[#888] cursor-pointer py-2"
              >
                {getCurrencies().map(c => (
                  <option key={c.id} value={c.id}>{c.symbol}</option>
                ))}
              </select>
            </div>
            {amount && getRateNote(currency) && (
              <p className="mt-1 font-mono text-[9px] text-[#666] dark:text-[#888]">
                {getRateNote(currency)}
              </p>
            )}
          </div>
        </div>

        {/* Category & Split Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full flex items-center justify-between bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                {selectedCategory && (
                  <selectedCategory.icon className="w-4 h-4" style={{ color: selectedCategory.color }} />
                )}
                {selectedCategory?.name}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showCategoryDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] shadow-lg max-h-64 overflow-y-auto"
                  data-lenis-prevent
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => { setCategory(cat.id); setShowCategoryDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#F7F7F7] dark:hover:bg-[#222] transition-colors ${category === cat.id ? 'bg-[#F7F7F7] dark:bg-[#222]' : ''}`}
                    >
                      <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                      <span className="font-mono text-sm">{cat.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Split Type Dropdown */}
          <div className="relative" ref={splitDropdownRef}>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
              Split Type
            </label>
            <button
              type="button"
              onClick={() => setShowSplitDropdown(!showSplitDropdown)}
              className="w-full flex items-center justify-between bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
            >
              <span>{selectedSplitType?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSplitDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showSplitDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-[#111] border border-[#E5E5E5] dark:border-[#333] shadow-lg max-h-64 overflow-y-auto"
                  data-lenis-prevent
                >
                  {SPLIT_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleSplitTypeChange(type.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F7F7F7] dark:hover:bg-[#222] transition-colors ${splitType === type.id ? 'bg-[#F7F7F7] dark:bg-[#222]' : ''}`}
                    >
                      <div className="font-mono text-sm">{type.name}</div>
                      <div className="font-mono text-[10px] text-[#666] dark:text-[#888]">{type.description}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Notes (optional)
            </span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-2 font-mono text-sm text-black dark:text-white transition-colors"
            placeholder="Add a note about this expense..."
            maxLength={256}
          />
        </div>

        {/* Custom Split Input (for non-equal splits) */}
        <AnimatePresence>
          {splitType !== 'equal' && members.length > 0 && amount && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="border border-[#E5E5E5] dark:border-[#333] p-4 bg-white dark:bg-black">
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] mb-4">
                  {splitType === 'percentage' && 'Set percentages for each member'}
                  {splitType === 'exact' && 'Set exact amounts for each member'}
                  {splitType === 'shares' && 'Set shares for each member'}
                </h4>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member} className="flex items-center justify-between">
                      <span className="font-mono text-sm truncate flex-1 mr-4">
                        {member.substring(0, 12)}...
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={splitType === 'percentage' ? '1' : '0.01'}
                          min="0"
                          value={customSplitData[splitType === 'percentage' ? 'percentages' : splitType === 'shares' ? 'shares' : 'amounts']?.[member] || ''}
                          onChange={(e) => {
                            const field = splitType === 'percentage' ? 'percentages' : splitType === 'shares' ? 'shares' : 'amounts';
                            handleCustomSplitDataChange(field, member, parseFloat(e.target.value) || 0);
                          }}
                          className="w-20 bg-transparent border-b border-[#CCC] dark:border-[#333] focus:border-black dark:focus:border-white outline-none py-1 font-mono text-sm text-right text-black dark:text-white transition-colors"
                          placeholder={splitType === 'percentage' ? '%' : splitType === 'shares' ? '1' : '0'}
                        />
                        <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                          {splitType === 'percentage' && '%'}
                          {splitType === 'exact' && 'XLM'}
                          {splitType === 'shares' && 'x'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        <div className="flex flex-wrap gap-2 items-center justify-between mb-6">
          <h3 className="font-serif italic text-xl">Immutable Ledger</h3>
          <div className="flex items-center gap-2">
            {expenses.length > 0 && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  type="button"
                  onClick={() => downloadCSV(expenses, `Pool ${poolId}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-[#E5E5E5] dark:border-[#333] text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-3 h-3" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadPDF(expenses, `Pool ${poolId}`)}
                  className="flex items-center gap-1.5 px-2.5 py-1 border border-[#E5E5E5] dark:border-[#333] text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
                  title="Export Report"
                >
                  <FileText className="w-3 h-3" />
                  Report
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1 border border-[#E5E5E5] dark:border-[#333] rounded-full transition-colors duration-500">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">
                Live
              </span>
            </div>
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
            {expenses.map((exp, index) => {
              const expCategory = exp.category ? getCategoryById(exp.category) : null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={exp.id || index}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 ${index !== expenses.length - 1 ? 'border-b border-[#E5E5E5] dark:border-[#222]' : ''} hover:bg-[#F7F7F7] dark:hover:bg-[#111] transition-colors duration-300`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {expCategory && (
                        <expCategory.icon className="w-4 h-4" style={{ color: expCategory.color }} />
                      )}
                      <div className="font-mono text-sm">
                        {exp.description}
                      </div>
                    </div>
                    {exp.notes && (
                      <div className="font-mono text-[10px] text-[#666] dark:text-[#888] mb-1 ml-7">
                        {exp.notes}
                      </div>
                    )}
                    <div className="flex items-center gap-4 font-mono text-[10px] text-[#666] dark:text-[#888] ml-7">
                      <span>
                        {exp.payer
                          ? `${exp.payer.substring(0, 8)}...`
                          : 'Unknown'}
                      </span>
                      {exp.splitType && exp.splitType !== 'equal' && (
                        <span className="px-2 py-0.5 border border-[#E5E5E5] dark:border-[#333] rounded">
                          {exp.splitType}
                        </span>
                      )}
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
              );
            })}
          </div>
        )}
      </div>

      <SettleUp expenses={expenses} />
        </>
      )}
    </div>
  );
}
