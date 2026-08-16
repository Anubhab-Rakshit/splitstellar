import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getCategoryById } from '../services/categories';
import { getEarnedBadges, calculateBadgeProgress, getAllBadges } from '../services/badges';
import { staggerContainer, fadeUpItem, scaleReveal } from '../services/animations';
import { Trophy, TrendingUp, Calendar, Wallet } from 'lucide-react';

function BadgeCard({ badge, progress, earned }) {
  return (
    <motion.div
      variants={scaleReveal}
      whileHover={{ scale: 1.05 }}
      className={`relative p-4 border ${earned ? 'border-black dark:border-white' : 'border-[#E5E5E5] dark:border-[#333]'} bg-white dark:bg-black transition-colors duration-300`}
    >
      {earned && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center"
        >
          <span className="text-white dark:text-black text-xs">✓</span>
        </motion.div>
      )}
      <div className="mb-2 flex items-center justify-center">
        <badge.icon className="w-6 h-6 text-black dark:text-white" strokeWidth={1.5} />
      </div>
      <div className="font-mono text-xs text-black dark:text-white mb-1">{badge.name}</div>
      <div className="font-mono text-[10px] text-[#666] dark:text-[#888] mb-2">{badge.description}</div>
      {!earned && (
        <div className="mt-2">
          <div className="h-1 bg-[#E5E5E5] dark:bg-[#333] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: badge.color }}
            />
          </div>
          <div className="font-mono text-[8px] text-[#666] dark:text-[#888] mt-1">
            {progress}% complete
          </div>
        </div>
      )}
    </motion.div>
  );
}

function MemberStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#F7F7F7] dark:bg-[#111]">
      <Icon className="w-4 h-4 text-[#666] dark:text-[#888]" />
      <div>
        <div className="font-mono text-[10px] text-[#666] dark:text-[#888]">{label}</div>
        <div className="font-mono text-xs text-black dark:text-white">{value}</div>
      </div>
    </div>
  );
}

export default function MemberProfile({ address, expenses }) {
  const stats = useMemo(() => {
    if (!expenses?.length) return null;

    // Calculate user stats
    const userExpenses = expenses.filter(exp => exp.payer === address);
    const totalSpent = userExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 1e7;
    const averageExpense = userExpenses.length > 0 ? totalSpent / userExpenses.length : 0;
    const largestExpense = userExpenses.length > 0 
      ? Math.max(...userExpenses.map(exp => exp.amount)) / 1e7 
      : 0;

    // Category usage
    const categoriesUsed = new Set(userExpenses.map(exp => exp.category || 'other'));

    // Expenses with notes
    const expensesWithNotes = userExpenses.filter(exp => exp.notes).length;

    // Pools joined (approximate)
    const poolsJoined = new Set(expenses.map(exp => exp.poolId)).size;

    const userStats = {
      totalExpenses: userExpenses.length,
      totalSpent,
      averageExpense,
      largestExpense,
      poolsCreated: 0, // Would need additional data
      poolsJoined,
      settlements: 0, // Would need settlement data
      totalSaved: 0,
      uniqueCategories: categoriesUsed.size,
      dailyStreak: 1, // Simplified
      expensesWithNotes,
    };

    // Get earned badges
    const earnedBadges = getEarnedBadges(userStats);

    return {
      ...userStats,
      earnedBadges,
      recentExpenses: userExpenses.slice(0, 5),
    };
  }, [address, expenses]);

  if (!stats) {
    return (
      <div className="p-8 border border-[#E5E5E5] dark:border-[#222] text-center">
        <p className="font-mono text-xs text-[#666] dark:text-[#888]">
          No activity data available
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
      {/* Profile Header */}
      <motion.div
        variants={fadeUpItem}
        className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-black to-[#333] dark:from-white dark:to-[#999] flex items-center justify-center">
            <span className="font-serif italic text-2xl text-white dark:text-black">
              {address?.substring(2, 4).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs text-[#666] dark:text-[#888] mb-1">Wallet Address</div>
            <div className="font-mono text-sm text-black dark:text-white break-all">
              {address}
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-500" />
                <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                  {stats.earnedBadges.length} badges
                </span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                  {stats.totalExpenses} expenses
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={fadeUpItem}
        className="grid grid-cols-2 gap-3"
      >
        <MemberStat
          icon={Wallet}
          label="Total Spent"
          value={`${stats.totalSpent.toFixed(2)} XLM`}
        />
        <MemberStat
          icon={Calendar}
          label="Avg Expense"
          value={`${stats.averageExpense.toFixed(2)} XLM`}
        />
        <MemberStat
          icon={TrendingUp}
          label="Largest"
          value={`${stats.largestExpense.toFixed(2)} XLM`}
        />
        <MemberStat
          icon={Trophy}
          label="Categories"
          value={stats.uniqueCategories}
        />
      </motion.div>

      {/* Badges Section */}
      <motion.div
        variants={fadeUpItem}
        className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
      >
        <h3 className="font-serif italic text-lg mb-4">Achievements</h3>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {getAllBadges().slice(0, 10).map(badge => {
            const earned = stats.earnedBadges.some(e => e.id === badge.id);
            const progress = calculateBadgeProgress(badge, stats);
            return (
              <BadgeCard
                key={badge.id}
                badge={badge}
                progress={progress}
                earned={earned}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {stats.recentExpenses.length > 0 && (
        <motion.div
          variants={fadeUpItem}
          className="p-6 border border-[#E5E5E5] dark:border-[#333] bg-white dark:bg-black"
        >
          <h3 className="font-serif italic text-lg mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentExpenses.map((exp, i) => {
              const cat = exp.category ? getCategoryById(exp.category) : null;
              return (
                <motion.div
                  key={exp.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-[#F7F7F7] dark:bg-[#111]"
                >
                  <div className="flex items-center gap-3">
                    {cat && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                        <cat.icon className="w-3 h-3" style={{ color: cat.color }} />
                      </div>
                    )}
                    <div>
                      <div className="font-mono text-xs text-black dark:text-white">
                        {exp.description}
                      </div>
                      <div className="font-mono text-[10px] text-[#666] dark:text-[#888]">
                        {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-black dark:text-white">
                    {(exp.amount / 1e7).toFixed(2)} XLM
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
