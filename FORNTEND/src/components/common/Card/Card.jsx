import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs flex flex-col gap-3.5 sm:gap-4 ${
        hoverable
          ? 'hover:-translate-y-0.5 hover:shadow-md hover:border-blue-400 transition-all duration-150'
          : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start sm:items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight break-words">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 break-words">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className="flex-1 min-w-0">{children}</div>

      {footer && (
        <div className="border-t border-slate-100 pt-3 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
