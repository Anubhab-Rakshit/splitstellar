import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getCategoryById } from '../services/categories';
import { staggerContainer, fadeUpItem } from '../services/animations';

function StatCard({ label, value, subtitle, color = '#666' }) {
  return (
    <motion.div
      variants={fadeUpItem}
      className="p-4 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
    >
      <div className="font-mono text-[10px] uppercase tracking-widest text-[#666] dark:text-[#888] mb-2">
        {label}
      </div>
      <div className="font-serif italic text-2xl text-black dark:text-white" style={{ color }}>
        {value}
      </div>
      {subtitle && (
        <div className="font-mono text-[10px] text-[#666] dark:text-[#888] mt-1">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

function CategoryBar({ category, amount, total, index }) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  const cat = getCategoryById(category);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cat?.color + '20' }}>
        {cat && <cat.icon className="w-4 h-4" style={{ color: cat.color }} />}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-xs text-black dark:text-white">{cat?.name || 'Other'}</span>
          <span className="font-mono text-xs text-[#666] dark:text-[#888]">{amount.toFixed(2)} XLM</span>
        </div>
        <div className="h-1.5 bg-[#E5E5E5] dark:bg-[#333] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, delay: 0.2 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: cat?.color || '#666' }}
          />
        </div>
      </div>
      <span className="font-mono text-[10px] text-[#666] dark:text-[#888] w-12 text-right">
        {percentage.toFixed(0)}%
      </span>
    </motion.div>
  );
}

function SpendingTrend({ data }) {
  const maxValue = Math.max(...data.map(d => d.amount));
  
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(item.amount / maxValue) * 100}%` }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 bg-black dark:bg-white rounded-t"
          title={`${item.label}: ${item.amount.toFixed(2)} XLM`}
        />
      ))}
    </div>
  );
}

export default function SpendingInsights({ expenses }) {
  const insights = useMemo(() => {
    if (!expenses?.length) return null;

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0) / 1e7;
    const averageExpense = totalAmount / expenses.length;
    const largestExpense = Math.max(...expenses.map(exp => exp.amount)) / 1e7;
    const smallestExpense = Math.min(...expenses.map(exp => exp.amount)) / 1e7;

    // Category breakdown
    const categoryTotals = {};
    expenses.forEach(exp => {
      const catId = exp.category || 'other';
      categoryTotals[catId] = (categoryTotals[catId] || 0) + exp.amount / 1e7;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    // Payer breakdown
    const payerTotals = {};
    expenses.forEach(exp => {
      const payer = exp.payer || 'Unknown';
      payerTotals[payer] = (payerTotals[payer] || 0) + exp.amount / 1e7;
    });

    const topPayers = Object.entries(payerTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Time-based trends (group by day)
    const dailyTotals = {};
    expenses.forEach(exp => {
      const date = exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : 'Unknown';
      dailyTotals[date] = (dailyTotals[date] || 0) + exp.amount / 1e7;
    });

    const trendData = Object.entries(dailyTotals)
      .slice(-7)
      .map(([label, amount]) => ({ label, amount }));

    // Split type usage
    const splitTypes = {};
    expenses.forEach(exp => {
      const type = exp.splitType || 'equal';
      splitTypes[type] = (splitTypes[type] || 0) + 1;
    });

    return {
      totalAmount,
      averageExpense,
      largestExpense,
      smallestExpense,
      expenseCount: expenses.length,
      sortedCategories,
      topPayers,
      trendData,
      splitTypes,
    };
  }, [expenses]);

  if (!insights) {
    return (
      <div className="p-8 border border-[#E5E5E5] dark:border-[#222] text-center">
        <p className="font-mono text-xs text-[#666] dark:text-[#888]">
          No data available for insights
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Spent"
          value={`${insights.totalAmount.toFixed(2)} XLM`}
          subtitle="Across all expenses"
        />
        <StatCard
          label="Average"
          value={`${insights.averageExpense.toFixed(2)} XLM`}
          subtitle="Per expense"
        />
        <StatCard
          label="Largest"
          value={`${insights.largestExpense.toFixed(2)} XLM`}
          subtitle="Single expense"
          color="#10B981"
        />
        <StatCard
          label="Expenses"
          value={insights.expenseCount}
          subtitle="Total logged"
        />
      </div>

      {/* Category Breakdown */}
      <motion.div
        variants={fadeUpItem}
        className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
      >
        <h3 className="font-serif italic text-lg mb-4">Spending by Category</h3>
        <div className="space-y-4">
          {insights.sortedCategories.map(([catId, amount], i) => (
            <CategoryBar
              key={catId}
              category={catId}
              amount={amount}
              total={insights.totalAmount}
              index={i}
            />
          ))}
        </div>
      </motion.div>

      {/* Top Payers */}
      <motion.div
        variants={fadeUpItem}
        className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
      >
        <h3 className="font-serif italic text-lg mb-4">Top Contributors</h3>
        <div className="space-y-3">
          {insights.topPayers.map(([payer, amount], i) => (
            <motion.div
              key={payer}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center justify-between p-3 bg-[#F7F7F7] dark:bg-[#111]"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-black dark:bg-white flex items-center justify-center font-mono text-[10px] text-white dark:text-black">
                  {i + 1}
                </div>
                <span className="font-mono text-xs text-black dark:text-white">
                  {payer.substring(0, 12)}...
                </span>
              </div>
              <span className="font-mono text-xs text-[#666] dark:text-[#888]">
                {amount.toFixed(2)} XLM
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Spending Trend */}
      {insights.trendData.length > 1 && (
        <motion.div
          variants={fadeUpItem}
          className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
        >
          <h3 className="font-serif italic text-lg mb-4">Spending Trend</h3>
          <SpendingTrend data={insights.trendData} />
          <div className="flex justify-between mt-2">
            {insights.trendData.map((item, i) => (
              <span key={i} className="font-mono text-[8px] text-[#666] dark:text-[#888]">
                {item.label.split('/').slice(0, 2).join('/')}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
