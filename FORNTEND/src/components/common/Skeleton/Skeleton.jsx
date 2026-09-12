import React from 'react';

/**
 * Base atomic Skeleton block with pulse shimmer animation
 */
export const Skeleton = ({ className = '', rounded = 'rounded-lg', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-slate-200/90 dark:bg-slate-700/60 skeleton-shimmer ${rounded} ${className}`}
      {...props}
    />
  );
};

/**
 * Text line skeleton with natural varying widths
 */
export const SkeletonText = ({ lines = 3, className = '', lineClassName = 'h-3.5' }) => {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3'];
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`${lineClassName} ${widths[i % widths.length]}`}
          rounded="rounded-md"
        />
      ))}
    </div>
  );
};

/**
 * KPI Stat Card Skeleton
 */
export const SkeletonKpi = ({ count = 6, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs flex flex-col gap-2.5"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-2.5 w-32" />
        </div>
      ))}
    </div>
  );
};

/**
 * Data Table Rows Skeleton
 */
export const SkeletonTable = ({ rows = 5, columns = 6 }) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3.5">
                <Skeleton className="h-3.5 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="hover:bg-slate-50/50">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-4 py-3.5">
                  {c === 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ) : c === columns - 1 ? (
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="h-7 w-7 rounded-lg" />
                      <Skeleton className="h-7 w-7 rounded-lg" />
                    </div>
                  ) : (
                    <Skeleton className={`h-3.5 ${c % 2 === 0 ? 'w-28' : 'w-20'}`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Mobile Card List Skeleton
 */
export const SkeletonCardList = ({ count = 4 }) => {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-700 flex flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <Skeleton className="h-7 w-28 rounded-lg" />
            <div className="flex gap-1">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Kanban Board 5-Column Skeleton
 */
export const SkeletonKanban = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-start">
      {['To Do', 'In Progress', 'Under Review', 'Blocked', 'Completed'].map((title, colIndex) => (
        <div
          key={title}
          className="bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-3 min-h-[480px]"
        >
          {/* Column Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>

          {/* Cards inside column */}
          {Array.from({ length: colIndex === 1 ? 3 : 2 }).map((_, cardIndex) => (
            <div
              key={cardIndex}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 shadow-xs flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-4 w-14 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Milestones Checkpoint List Skeleton
 */
export const SkeletonMilestones = ({ count = 5 }) => {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Project Details Full Page Skeleton
 */
export const SkeletonProjectDetails = () => {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Back Button */}
      <Skeleton className="h-8 w-36 rounded-lg" />

      {/* Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-md flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <SkeletonText lines={4} />
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-32" />
            <SkeletonMilestones count={4} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-28" />
            <SkeletonText lines={3} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
