import { useMemo, useState } from 'react';
import { useStellarStore } from '../hooks/useStellar';
import { sendPayment } from '../services/soroban';
import { triggerToast } from '../services/toast';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { track } from '../services/analytics';

function shorten(pubkey) {
  return `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`;
}

export default function SettleUp({ expenses }) {
  const { address, kit } = useStellarStore();
  const [paying, setPaying] = useState(null);

  const breakdown = useMemo(() => {
    if (!expenses?.length) return null;

    const byPayer = {};
    for (const exp of expenses) {
      const p = exp.payer;
      if (!byPayer[p]) byPayer[p] = 0;
      byPayer[p] += exp.amount;
    }

    const payers = Object.keys(byPayer);
    const totalXlm = expenses.reduce((s, e) => s + e.amount, 0) / 1e7;
    const shareXlm = totalXlm / payers.length;

    const rows = payers.map((payer) => {
      const paidXlm = byPayer[payer] / 1e7;
      const balance = paidXlm - shareXlm;
      return { payer, paidXlm, shareXlm, balance };
    });

    const totalSettled = rows
      .filter((r) => r.balance > 0)
      .reduce((s, r) => s + r.balance, 0);

    return { rows, totalXlm, shareXlm, totalSettled };
  }, [expenses]);

  const handlePay = async (destination, amountXlm) => {
    if (!kit || !address) return;
    setPaying(destination);
    try {
      const txHash = await sendPayment(address, kit, destination, amountXlm);
      track('settle_payment', { destination, amount: amountXlm, wallet_address: address });
      triggerToast(`Settled ${amountXlm.toFixed(2)} XLM — tx: ${txHash.slice(0, 12)}...`, 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Payment failed', 'error');
    } finally {
      setPaying(null);
    }
  };

  if (!breakdown || breakdown.rows.length < 2) return null;

  return (
    <div className="mt-12 border border-[#E5E5E5] dark:border-[#333] p-6 bg-[#F7F7F7] dark:bg-[#050505] transition-colors duration-500">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-serif italic text-xl">Settle Up</h3>
        <span className="flex items-center gap-1 px-2 py-0.5 border border-amber-500/30 rounded-full">
          <ArrowRightLeft className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500">Split</span>
        </span>
      </div>

      <div className="text-center mb-6 font-mono text-sm text-[#888]">
        {breakdown.rows.length} participants · {breakdown.totalXlm.toFixed(2)} XLM total ·{' '}
        {breakdown.shareXlm.toFixed(2)} XLM each
      </div>

      <div className="space-y-3">
        {breakdown.rows.map((row) => (
          <div
            key={row.payer}
            className="flex items-center justify-between p-4 bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222]"
          >
            <div>
              <div className="font-mono text-xs">
                {row.payer === address ? 'You' : shorten(row.payer)}
              </div>
              <div className="font-mono text-[10px] text-[#888] mt-0.5">
                Paid {row.paidXlm.toFixed(2)} XLM · Share {row.shareXlm.toFixed(2)} XLM
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-sm ${
                  row.balance > 0
                    ? 'text-emerald-500'
                    : row.balance < 0
                      ? 'text-red-500'
                      : 'text-[#888]'
                }`}
              >
                {row.balance > 0 ? '+' : ''}{row.balance.toFixed(2)} XLM
                {row.balance > 0 ? ' due' : row.balance < 0 ? ' owes' : ''}
              </span>
              {row.balance < 0 && row.payer !== address && (
                <button
                  onClick={() => handlePay(row.payer, Math.abs(row.balance))}
                  disabled={paying === row.payer}
                  className="btn-primary text-xs px-3 py-2"
                >
                  {paying === row.payer ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    `Pay ${Math.abs(row.balance).toFixed(2)} XLM`
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 font-mono text-[9px] text-[#888] text-center">
        Settlement powered by Stellar — instant, borderless, near-zero fees.
      </p>
    </div>
  );
}
