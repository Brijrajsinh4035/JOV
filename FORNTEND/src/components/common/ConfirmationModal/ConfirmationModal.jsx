import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../Button/Button';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  itemName,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  icon: Icon = AlertTriangle,
  isLoading = false,
  maxWidth = 'max-w-md',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = isLoading || internalLoading;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (loading) return;
    if (onConfirm) {
      try {
        const result = onConfirm();
        if (result && typeof result.then === 'function') {
          setInternalLoading(true);
          await result;
        }
      } catch (err) {
        console.error('Confirmation action error:', err);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  const variantIconStyles = {
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60',
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60',
  }[confirmVariant] || 'bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        className={`w-full ${maxWidth} max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-all my-auto`}
      >
        {/* Header & Alert Icon */}
        <div className="p-5 sm:p-6 pb-2 sm:pb-3 flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${variantIconStyles}`}>
            <Icon size={22} />
          </div>

          <div className="flex-1 min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Highlighted item preview (if any) */}
        {itemName && (
          <div className="px-5 sm:px-6 py-2">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Target:
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                {itemName}
              </span>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 px-5 sm:px-6 py-4 mt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            size="md"
            onClick={handleConfirm}
            isLoading={loading}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
