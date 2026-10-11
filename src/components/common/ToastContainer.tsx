import React from 'react';
import { useBudgetStore } from '../../store/budgetStore';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useBudgetStore((state) => state.toasts);
  const removeToast = useBudgetStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const iconConfig = {
          success: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
          info: { icon: Info, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
          warning: { icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
          error: { icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
        }[toast.type];

        const IconComponent = iconConfig.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border ${iconConfig.border} ${iconConfig.bg} shadow-lg flex items-start gap-3 bg-white/95 backdrop-blur-sm transition-all animate-in slide-in-from-right-4`}
            role="alert"
          >
            <IconComponent className={`w-5 h-5 shrink-0 ${iconConfig.color} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-brand-green leading-snug">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-brand-muted hover:text-brand-green p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
