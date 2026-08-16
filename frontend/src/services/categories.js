import {
  Utensils,
  Car,
  Home,
  Film,
  ShoppingBag,
  Zap,
  Heart,
  Package,
  Plane,
  Coffee,
  Gift,
  BookOpen,
  Dumbbell,
  Wifi,
  Music,
  Gamepad2,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Wrench,
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: Utensils, color: '#F97316' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#3B82F6' },
  { id: 'accommodation', name: 'Accommodation', icon: Home, color: '#8B5CF6' },
  { id: 'entertainment', name: 'Entertainment', icon: Film, color: '#EC4899' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#10B981' },
  { id: 'utilities', name: 'Bills & Utilities', icon: Zap, color: '#F59E0B' },
  { id: 'health', name: 'Health', icon: Heart, color: '#EF4444' },
  { id: 'other', name: 'Other', icon: Package, color: '#6B7280' },
  { id: 'travel', name: 'Travel', icon: Plane, color: '#06B6D4' },
  { id: 'coffee', name: 'Coffee & Drinks', icon: Coffee, color: '#92400E' },
  { id: 'gifts', name: 'Gifts', icon: Gift, color: '#D946EF' },
  { id: 'education', name: 'Education', icon: BookOpen, color: '#2563EB' },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell, color: '#16A34A' },
  { id: 'subscriptions', name: 'Subscriptions', icon: Wifi, color: '#7C3AED' },
  { id: 'hobbies', name: 'Hobbies', icon: Music, color: '#DB2777' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: '#4F46E5' },
  { id: 'medical', name: 'Medical', icon: Stethoscope, color: '#DC2626' },
  { id: 'training', name: 'Training', icon: GraduationCap, color: '#0891B2' },
  { id: 'business', name: 'Business', icon: Briefcase, color: '#374151' },
  { id: 'repairs', name: 'Repairs', icon: Wrench, color: '#B45309' },
];

export const SPLIT_TYPES = [
  { id: 'equal', name: 'Equal', description: 'Split evenly among all members' },
  { id: 'percentage', name: 'Percentage', description: 'Custom percentage per member' },
  { id: 'exact', name: 'Exact', description: 'Specify exact amount per member' },
  { id: 'shares', name: 'Shares', description: 'Split by shares (e.g., 2:1)' },
];

export function getCategoryById(id) {
  return EXPENSE_CATEGORIES.find((c) => c.id === id) || EXPENSE_CATEGORIES.find((c) => c.id === 'other');
}

export function getCategoryIcon(id) {
  const category = getCategoryById(id);
  return category ? category.icon : Package;
}

export function getCategoryColor(id) {
  const category = getCategoryById(id);
  return category ? category.color : '#6B7280';
}

export function calculateSplit(totalAmount, splitType, members, customData = {}) {
  const memberCount = members.length;
  if (memberCount === 0) return [];

  switch (splitType) {
    case 'equal': {
      const share = Math.floor(totalAmount / memberCount);
      const remainder = totalAmount - share * memberCount;
      return members.map((member, index) => ({
        member,
        amount: share + (index === 0 ? remainder : 0),
      }));
    }

    case 'percentage': {
      const percentages = customData.percentages || {};
      return members.map((member) => {
        const pct = percentages[member] || Math.floor(100 / memberCount);
        return {
          member,
          amount: Math.floor((totalAmount * pct) / 100),
        };
      });
    }

    case 'exact': {
      const amounts = customData.amounts || {};
      return members.map((member) => ({
        member,
        amount: amounts[member] || 0,
      }));
    }

    case 'shares': {
      const shares = customData.shares || {};
      const totalShares = members.reduce((sum, m) => sum + (shares[m] || 1), 0);
      return members.map((member) => {
        const memberShares = shares[member] || 1;
        return {
          member,
          amount: Math.floor((totalAmount * memberShares) / totalShares),
        };
      });
    }

    default:
      return calculateSplit(totalAmount, 'equal', members, customData);
  }
}
