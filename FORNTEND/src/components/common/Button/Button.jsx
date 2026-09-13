import React, { useState, useRef } from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const [isClicking, setIsClicking] = useState(false);
  const lastClickRef = useRef(0);

  const isBusy = disabled || isLoading || isClicking;

  const handleClick = async (e) => {
    if (isBusy) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const now = Date.now();
    if (now - lastClickRef.current < 350) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    lastClickRef.current = now;

    if (onClick) {
      try {
        const result = onClick(e);
        if (result && typeof result.then === 'function') {
          setIsClicking(true);
          await result;
        }
      } catch (err) {
        console.error('Button action error:', err);
      } finally {
        setIsClicking(false);
      }
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size] || 'px-4 py-2 text-sm gap-2';

  const variantClasses = {
    primary: 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm focus:ring-2 focus:ring-blue-500/40 active:scale-[0.98]',
    secondary: 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs focus:ring-2 focus:ring-slate-300 active:scale-[0.98]',
    outline: 'bg-transparent text-blue-700 border border-blue-700 hover:bg-blue-50 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-2 focus:ring-red-500/40 active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  }[variant] || 'bg-blue-700 text-white hover:bg-blue-800';

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18,
  }[size] || 16;

  return (
    <button
      type={type}
      disabled={isBusy}
      onClick={handleClick}
      aria-busy={isBusy}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading || isClicking ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
      ) : Icon ? (
        <Icon size={iconSizes} className="shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

