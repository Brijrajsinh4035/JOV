import React from 'react';

const getTailwindBadgeStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'done':
    case 'mitigated':
    case 'closed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'active':
    case 'in-progress':
    case 'in progress':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'delayed':
    case 'critical':
    case 'cancelled':
    case 'blocked':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'on-hold':
    case 'review':
    case 'high':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'planning':
    case 'pending':
    case 'todo':
    case 'open':
    case 'low':
    case 'medium':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const Badge = ({ children, variant, status, className = '', ...props }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  if (status) {
    colorClass = getTailwindBadgeStyle(status);
  } else if (variant === 'danger') {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (variant === 'success') {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'warning') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (variant === 'info' || variant === 'primary') {
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${colorClass} ${className}`}
      {...props}
    >
      {children || status}
    </span>
  );
};

export default Badge;
