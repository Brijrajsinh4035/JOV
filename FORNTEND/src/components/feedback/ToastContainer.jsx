import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { selectToasts, removeToast } from '../../features/ui/uiSlice';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-600" />,
    error: <AlertCircle size={18} className="text-rose-600" />,
    warning: <AlertTriangle size={18} className="text-amber-500" />,
    info: <Info size={18} className="text-blue-600" />,
  };

  return (
    <div
      className="flex items-center gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl w-full sm:w-auto sm:min-w-[280px] max-w-md shadow-lg border border-slate-200 bg-white text-slate-800 transition-all animate-in fade-in duration-200"
    >
      <div className="shrink-0">{icons[toast.type] || icons.info}</div>
      <p className="flex-1 text-xs sm:text-sm font-medium text-slate-800 m-0 break-words">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer flex items-center shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(selectToasts);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-3 sm:right-5 left-3 sm:left-auto z-50 flex flex-col gap-2.5 pointer-events-auto max-w-[calc(100vw-1.5rem)]">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={(id) => dispatch(removeToast(id))}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

