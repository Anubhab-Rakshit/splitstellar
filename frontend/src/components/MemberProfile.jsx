import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getEarnedBadges, calculateBadgeProgress, getAllBadges } from '../services/badges';
import { staggerContainer, fadeUpItem, scaleReveal } from '../services/animations';
import { Trophy, TrendingUp, Calendar, Wallet } from 'lucide-react';

function BadgeCard({ badge, progress, earned }) {
  return (
    <motion.div
      variants={scaleReveal}
      whileHover={{ y: -5 }}
      className={`relative p-4 hairline-card ${earned ? 'border-black/20 dark:border-white/20' : 'opacity-70'} transition-all duration-300`}
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
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-4 hairline-card"
    >
      <Icon className="w-5 h-5 text-black dark:text-white opacity-50" />
      <div>
        <div className="font-mono text-[10px] text-[#666] dark:text-[#888] mb-0.5">{label}</div>
        <div className="font-mono text-sm sm:text-base text-black dark:text-white font-semibold">{value}</div>
      </div>
    </motion.div>
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
    };
  }, [address, expenses]);

  if (!stats) {
    return (
    <div className="glass-card p-8 text-center">
      <p className="font-mono text-xs text-[#666] dark:text-[#888]">
        Log an expense to unlock your stats and achievements.
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
        className="glass-card p-6"
      >
        <h3 className="font-serif italic text-lg mb-4">Achievements</h3>
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center gap-2 px-3 py-1 hairline-card rounded-full border-transparent">
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#666] dark:text-[#888]">
              {stats.earnedBadges.length} / {getAllBadges().length} earned
            </span>
          </div>
        </div>
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
    </motion.div>
  );
}
