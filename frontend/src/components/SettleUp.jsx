import { useMemo, useState } from 'react';
import { useStellarStore } from '../hooks/useStellar';
import { sendPayment } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { Loader2, ArrowRightLeft, Check, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';
import { track } from '../services/analytics';
import { staggerContainer, fadeUpItem } from '../services/animations';

function shorten(pubkey) {
  return `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`;
}

function computeSmartSettlement(expenses) {
  const byPayer = {};
  for (const exp of expenses) {
    const p = exp.payer;
    if (!byPayer[p]) byPayer[p] = 0;
    byPayer[p] += exp.amount;
  }

  const payers = Object.keys(byPayer);
  if (payers.length < 2) return null;

  const totalXlm = expenses.reduce((s, e) => s + e.amount, 0) / 1e7;
  const shareXlm = totalXlm / payers.length;

  const rows = payers.map((payer) => {
    const paidXlm = byPayer[payer] / 1e7;
    const balance = paidXlm - shareXlm;
    return { payer, paidXlm, shareXlm, balance };
  });

  const debtors = rows.filter((r) => r.balance < 0).map((r) => ({ ...r, owes: Math.abs(r.balance) }));
  const creditors = rows.filter((r) => r.balance > 0).map((r) => ({ ...r, owed: r.balance }));

  debtors.sort((a, b) => b.owes - a.owes);
  creditors.sort((a, b) => b.owed - a.owed);

  const transfers = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const amount = Math.min(debtors[di].owes, creditors[ci].owed);
    if (amount > 0.0001) {
      transfers.push({
        from: debtors[di].payer,
        to: creditors[ci].payer,
        amount,
      });
    }
    debtors[di].owes -= amount;
    creditors[ci].owed -= amount;
    if (debtors[di].owes < 0.0001) di += 1;
    if (creditors[ci].owed < 0.0001) ci += 1;
  }

  const totalSettled = transfers.reduce((s, t) => s + t.amount, 0);
  const naiveTxCount = rows.filter((r) => r.balance > 0).length;

  return { rows, totalXlm, shareXlm, totalSettled, transfers, naiveTxCount };
}

export default function SettleUp({ expenses }) {
  const { address, kit } = useStellarStore();
  const [paying, setPaying] = useState(null);
  const [settled, setSettled] = useState(new Set());
  const [showOptimized, setShowOptimized] = useState(false);

  const breakdown = useMemo(() => {
    if (!expenses?.length) return null;
    return computeSmartSettlement(expenses);
  }, [expenses]);

  const handlePay = async (destination, amountXlm) => {
    if (!kit || !address) return;
    setPaying(destination);
    try {
      const txHash = await sendPayment(address, kit, destination, amountXlm);
      track('settle_payment', { destination, amount: amountXlm, wallet_address: address });
      triggerToast(`Settled ${amountXlm.toFixed(2)} XLM — tx: ${txHash.slice(0, 12)}...`, 'success');
      setSettled(prev => new Set([...prev, `${destination}`]));
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Payment failed', 'error');
    } finally {
      setPaying(null);
    }
  };

  if (!breakdown || breakdown.rows.length < 2) return null;

  const optimizationSaved = breakdown.naiveTxCount - breakdown.transfers.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mt-12 border border-[#E5E5E5] dark:border-[#333] p-6 bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500"
    >
      <div className="flex flex-wrap gap-2 items-center justify-between mb-6">
        <motion.h3
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-serif italic text-xl"
        >
          Settle Up
        </motion.h3>
        <div className="flex items-center gap-2">
          {optimizationSaved > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center gap-1 px-2 py-0.5 border border-emerald-500/30 rounded-full"
            >
              <GitBranch className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-emerald-500">
                {optimizationSaved} fewer txs
              </span>
            </motion.span>
          )}
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 rounded-full"
          >
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ArrowRightLeft className="w-3 h-3 text-amber-500" />
            </motion.div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500">Split</span>
          </motion.span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-center mb-6 font-mono text-sm text-[#666] dark:text-[#888]"
      >
        {breakdown.rows.length} participants · {breakdown.totalXlm.toFixed(2)} XLM total ·{' '}
        {breakdown.shareXlm.toFixed(2)} XLM each
      </motion.div>

      {breakdown.transfers.length > 1 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowOptimized(!showOptimized)}
          className="w-full mb-4 p-2 border border-dashed border-[#E5E5E5] dark:border-[#333] font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors"
        >
          {showOptimized ? 'Hide Optimized Settlements' : `Show Optimized Settlements (${breakdown.transfers.length} txs instead of ${breakdown.naiveTxCount})`}
        </motion.button>
      )}

      {showOptimized ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3 mb-6"
        >
          <div className="flex items-center justify-between p-3 font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] border-b border-[#E5E5E5] dark:border-[#222]">
            <span>Payer</span>
            <span>Amount</span>
            <span>Receiver</span>
          </div>
          {breakdown.transfers.map((t, i) => {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-3 bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222]"
              >
                <div className="font-mono text-xs">
                  {t.from === address ? 'You' : shorten(t.from)}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#666] dark:text-[#888]">
                  <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                  {t.amount.toFixed(2)} XLM
                </div>
                <div className="font-mono text-xs">
                  {t.to === address ? 'You' : shorten(t.to)}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {breakdown.rows.map((row, index) => (
            <motion.div
              key={row.payer}
              variants={fadeUpItem}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222] transition-colors duration-300 ${settled.has(row.payer) ? 'border-emerald-500/50 dark:border-emerald-500/30' : ''}`}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs ${row.balance > 0 ? 'bg-emerald-500/10 text-emerald-500' : row.balance < 0 ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-[#222] text-[#666] dark:text-[#888]'}`}
                >
                  {row.payer === address ? 'Y' : row.payer.substring(0, 2).toUpperCase()}
                </motion.div>
                <div>
                  <div className="font-mono text-xs">
                    {row.payer === address ? 'You' : shorten(row.payer)}
                  </div>
                  <div className="font-mono text-[10px] text-[#666] dark:text-[#888] mt-0.5">
                    Paid {row.paidXlm.toFixed(2)} XLM · Share {row.shareXlm.toFixed(2)} XLM
                  </div>
                </div>
              </div>
              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3 flex-wrap">
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                  className={`font-mono text-sm ${
                    row.balance > 0
                      ? 'text-emerald-500'
                      : row.balance < 0
                        ? 'text-red-500'
                        : 'text-[#666] dark:text-[#888]'
                  }`}
                >
                  {row.balance > 0 ? '+' : ''}{row.balance.toFixed(2)} XLM
                  {row.balance > 0 ? ' due' : row.balance < 0 ? ' owes' : ''}
                </motion.span>
                {row.balance > 0 && row.payer !== address && !settled.has(row.payer) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePay(row.payer, Math.abs(row.balance))}
                    disabled={paying === row.payer}
                    className="btn-primary text-xs px-3 py-2 flex items-center gap-2"
                  >
                    {paying === row.payer ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      `Pay ${Math.abs(row.balance).toFixed(2)} XLM`
                    )}
                  </motion.button>
                )}
                {settled.has(row.payer) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-emerald-500"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-xs font-mono">Settled</span>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-4 font-mono text-[9px] text-[#666] dark:text-[#888] text-center"
      >
        Settlement powered by Stellar — instant, borderless, near-zero fees.
      </motion.p>
    </motion.div>
  );
}
