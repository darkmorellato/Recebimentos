import React, { useState, useEffect, useCallback } from 'react';
import { ToastMessage } from '../../utils/types';
import { Icons } from './Icons';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  const typeStyles = {
    error: 'text-red-600 dark:text-red-400 border-l-red-500',
    success: 'text-emerald-600 dark:text-emerald-400 border-l-emerald-500',
    info: 'text-blue-600 dark:text-blue-400 border-l-blue-500',
  };

  const IconComponent = toast.type === 'error' ? Icons.AlertCircle : toast.type === 'success' ? Icons.Check : Icons.AlertCircle;

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl material-panel dark:bg-slate-800 transform transition-all duration-300 animate-in slide-in-from-right fade-in border-l-4 ${typeStyles[toast.type]}`}>
      <div className="p-2 rounded-full bg-slate-50 dark:bg-slate-700/50">
        <IconComponent className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
      </div>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); onRemove(); }}
          className="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <Icons.Undo className="w-3 h-3" /> {toast.action.label}
        </button>
      )}
      <button onClick={onRemove} className="opacity-60 hover:opacity-100 ml-2 text-slate-400">
        <Icons.X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = React.useRef<number[]>([]);

  useEffect(() => {
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success', action?: ToastMessage['action']) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    const timeout = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
    timeoutsRef.current.push(timeout);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
    {toasts.map((toast) => (
      <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
    ))}
  </div>
);
