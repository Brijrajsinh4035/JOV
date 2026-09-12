import React, { forwardRef } from 'react';

const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      icon: Icon,
      rightElement,
      className = '',
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-slate-700 tracking-wide"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center w-full">
          {Icon && (
            <div className="absolute left-3 flex items-center text-slate-400 pointer-events-none">
              <Icon size={16} />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`w-full bg-white border rounded-lg py-2 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-150 ${
              Icon ? 'pl-9' : 'pl-3.5'
            } ${rightElement ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
            } ${className}`}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>

        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
