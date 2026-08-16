// Achievement badges system for SplitStellar
// Gamification to encourage engagement

const BADGES = [
  {
    id: 'first_expense',
    name: 'First Steps',
    description: 'Log your first expense',
    icon: '🎯',
    color: '#10B981',
    requirement: { type: 'expenses_count', value: 1 },
  },
  {
    id: 'expense_10',
    name: 'Regular',
    description: 'Log 10 expenses',
    icon: '📊',
    color: '#3B82F6',
    requirement: { type: 'expenses_count', value: 10 },
  },
  {
    id: 'expense_50',
    name: 'Power User',
    description: 'Log 50 expenses',
    icon: '⚡',
    color: '#8B5CF6',
    requirement: { type: 'expenses_count', value: 50 },
  },
  {
    id: 'expense_100',
    name: 'Century',
    description: 'Log 100 expenses',
    icon: '💯',
    color: '#EC4899',
    requirement: { type: 'expenses_count', value: 100 },
  },
  {
    id: 'first_pool',
    name: 'Founder',
    description: 'Create your first pool',
    icon: '🏛️',
    color: '#F59E0B',
    requirement: { type: 'pools_created', value: 1 },
  },
  {
    id: 'pool_5',
    name: 'Organizer',
    description: 'Create 5 pools',
    icon: '👑',
    color: '#D946EF',
    requirement: { type: 'pools_created', value: 5 },
  },
  {
    id: 'first_settlement',
    name: 'Settler',
    description: 'Complete your first settlement',
    icon: '✅',
    color: '#10B981',
    requirement: { type: 'settlements', value: 1 },
  },
  {
    id: 'settlement_10',
    name: 'Debt Free',
    description: 'Complete 10 settlements',
    icon: '🎉',
    color: '#06B6D4',
    requirement: { type: 'settlements', value: 10 },
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Log an expense over 1000 XLM',
    icon: '💎',
    color: '#F97316',
    requirement: { type: 'single_expense', value: 10000000000 },
  },
  {
    id: 'big_saver',
    name: 'Big Saver',
    description: 'Save over 10000 XLM through settlements',
    icon: '🏦',
    color: '#14B8A6',
    requirement: { type: 'total_saved', value: 100000000000 },
  },
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Join 5 different pools',
    icon: '🦋',
    color: '#EC4899',
    requirement: { type: 'pools_joined', value: 5 },
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Use SplitStellar in its first month',
    icon: '🚀',
    color: '#7C3AED',
    requirement: { type: 'early_adopter', value: Date.now() },
  },
  {
    id: 'category_explorer',
    name: 'Category Explorer',
    description: 'Use 5 different expense categories',
    icon: '🗂️',
    color: '#0EA5E9',
    requirement: { type: 'categories_used', value: 5 },
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Log expenses 7 days in a row',
    icon: '🔥',
    color: '#EF4444',
    requirement: { type: 'daily_streak', value: 7 },
  },
  {
    id: 'commentator',
    name: 'Commentator',
    description: 'Add notes to 10 expenses',
    icon: '💬',
    color: '#6366F1',
    requirement: { type: 'expenses_with_notes', value: 10 },
  },
];

export function getAllBadges() {
  return BADGES;
}

export function getBadgeById(id) {
  return BADGES.find(b => b.id === id);
}

export function checkBadgeRequirement(badge, stats) {
  const { requirement } = badge;
  
  switch (requirement.type) {
    case 'expenses_count':
      return (stats.totalExpenses || 0) >= requirement.value;
    case 'pools_created':
      return (stats.poolsCreated || 0) >= requirement.value;
    case 'settlements':
      return (stats.settlements || 0) >= requirement.value;
    case 'single_expense':
      return (stats.largestExpense || 0) >= requirement.value;
    case 'total_saved':
      return (stats.totalSaved || 0) >= requirement.value;
    case 'pools_joined':
      return (stats.poolsJoined || 0) >= requirement.value;
    case 'early_adopter':
      return Date.now() <= requirement.value + (30 * 24 * 60 * 60 * 1000);
    case 'categories_used':
      return (stats.uniqueCategories || 0) >= requirement.value;
    case 'daily_streak':
      return (stats.dailyStreak || 0) >= requirement.value;
    case 'expenses_with_notes':
      return (stats.expensesWithNotes || 0) >= requirement.value;
    default:
      return false;
  }
}

export function getEarnedBadges(stats) {
  return BADGES.filter(badge => checkBadgeRequirement(badge, stats));
}

export function getNextBadge(stats) {
  const unearned = BADGES.filter(badge => !checkBadgeRequirement(badge, stats));
  if (unearned.length === 0) return null;
  
  // Return the badge closest to being earned
  return unearned[0];
}

export function calculateBadgeProgress(badge, stats) {
  const { requirement } = badge;
  let current = 0;
  let target = requirement.value;
  
  switch (requirement.type) {
    case 'expenses_count':
      current = stats.totalExpenses || 0;
      break;
    case 'pools_created':
      current = stats.poolsCreated || 0;
      break;
    case 'settlements':
      current = stats.settlements || 0;
      break;
    case 'single_expense':
      current = stats.largestExpense || 0;
      break;
    case 'total_saved':
      current = stats.totalSaved || 0;
      break;
    case 'pools_joined':
      current = stats.poolsJoined || 0;
      break;
    case 'categories_used':
      current = stats.uniqueCategories || 0;
      break;
    case 'daily_streak':
      current = stats.dailyStreak || 0;
      break;
    case 'expenses_with_notes':
      current = stats.expensesWithNotes || 0;
      break;
    default:
      break;
  }
  
  return Math.min(100, Math.round((current / target) * 100));
}
