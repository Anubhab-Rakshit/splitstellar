import { motion } from 'framer-motion';

const shimmer = {
  initial: { opacity: 0.5 },
  animate: { opacity: 1 },
  transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
};

function SkeletonBlock({ className = '' }) {
  return (
    <motion.div
      {...shimmer}
      className={`bg-[#E5E5E5] dark:bg-[#222] ${className}`}
    />
  );
}

export function PoolCardSkeleton() {
  return (
    <div className="w-full text-left p-4 sm:p-6 border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black">
      <div className="flex justify-between items-center mb-2">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-4 w-4 rounded-full" />
      </div>
      <SkeletonBlock className="h-3 w-24 mt-2" />
    </div>
  );
}

export function PoolListSkeleton() {
  return (
    <div className="space-y-4">
      <PoolCardSkeleton />
      <PoolCardSkeleton />
      <PoolCardSkeleton />
    </div>
  );
}

export function ExpenseRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-[#E5E5E5] dark:border-[#222]">
      <div>
        <SkeletonBlock className="h-4 w-40 mb-2" />
        <SkeletonBlock className="h-3 w-24" />
      </div>
      <SkeletonBlock className="h-5 w-20 mt-4 sm:mt-0" />
    </div>
  );
}

export function ExpenseListSkeleton() {
  return (
    <div className="border border-[#E5E5E5] dark:border-[#222]">
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
      <ExpenseRowSkeleton />
    </div>
  );
}

export function SettleUpSkeleton() {
  return (
    <div className="mt-12 border border-[#E5E5E5] dark:border-[#333] p-6 bg-[#F7F7F7] dark:bg-[#050505]">
      <div className="flex items-center justify-between mb-6">
        <SkeletonBlock className="h-6 w-24" />
        <SkeletonBlock className="h-5 w-16 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-64 mx-auto mb-6" />
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222]">
          <div>
            <SkeletonBlock className="h-4 w-20 mb-2" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-8 w-24 rounded" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4 bg-white dark:bg-black border border-[#E5E5E5] dark:border-[#222]">
          <div>
            <SkeletonBlock className="h-4 w-20 mb-2" />
            <SkeletonBlock className="h-3 w-32" />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-4 w-16" />
            <SkeletonBlock className="h-8 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-20 sm:pb-32 px-6 lg:px-12 max-w-[1000px] mx-auto">
      <div className="mb-16">
        <SkeletonBlock className="h-16 sm:h-20 w-64 mb-6" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 border-y border-[#E5E5E5] dark:border-[#222] py-6">
          <div className="flex-1">
            <SkeletonBlock className="h-3 w-24 mb-2" />
            <SkeletonBlock className="h-5 w-64" />
          </div>
          <div className="w-[1px] h-12 bg-[#E5E5E5] dark:bg-[#222]" />
          <div className="flex-1 sm:text-right">
            <SkeletonBlock className="h-3 w-32 mb-2" />
            <SkeletonBlock className="h-8 w-32" />
          </div>
        </div>
      </div>
      <div>
        <SkeletonBlock className="h-6 w-32 mb-8" />
        <div className="border border-[#E5E5E5] dark:border-[#222]">
          <div className="p-6 border-b border-[#E5E5E5] dark:border-[#222]">
            <SkeletonBlock className="h-4 w-48 mb-1" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
          <div className="p-6 border-b border-[#E5E5E5] dark:border-[#222]">
            <SkeletonBlock className="h-4 w-48 mb-1" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
          <div className="p-6">
            <SkeletonBlock className="h-4 w-48 mb-1" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-20 sm:pb-32 px-6 lg:px-12 max-w-[1200px] mx-auto">
      <div className="mb-16">
        <SkeletonBlock className="h-12 sm:h-16 w-64 mb-4" />
        <SkeletonBlock className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <SkeletonBlock className="h-6 w-32 mb-6" />
          <SkeletonBlock className="h-12 w-full mb-4" />
          <SkeletonBlock className="h-12 w-full mb-8" />
          <PoolListSkeleton />
        </div>
        <div className="lg:col-span-8">
          <div className="h-full min-h-[400px] border border-[#E5E5E5] dark:border-[#222] bg-white dark:bg-black flex flex-col items-center justify-center p-8">
            <SkeletonBlock className="h-[1px] w-16 mb-6" />
            <SkeletonBlock className="h-6 w-40 mb-2" />
            <SkeletonBlock className="h-3 w-64" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingSkeleton() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-black">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-20 sm:pt-32 pb-20 sm:pb-32">
        <div className="min-h-[85vh] flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <SkeletonBlock className="h-20 sm:h-32 w-full mb-6" />
              <SkeletonBlock className="h-20 sm:h-32 w-3/4 mb-6" />
              <SkeletonBlock className="h-5 w-96 mb-10" />
              <div className="flex gap-8">
                <SkeletonBlock className="h-12 w-40" />
                <SkeletonBlock className="h-12 w-32" />
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block">
              <SkeletonBlock className="h-80 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
