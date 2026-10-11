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
          success: { icon: CheckCircle2, color: 'text-[#225539]', bg: 'bg-[#EBF3ED]', border: 'border-[#CCE2D2]' },
          info: { icon: Info, color: 'text-[#542743]', bg: 'bg-[#F9EDF2]', border: 'border-[#E6BCCE]' },
          warning: { icon: AlertTriangle, color: 'text-[#8A4524]', bg: 'bg-[#FDF1ED]', border: 'border-[#F5B39B]' },
          error: { icon: AlertCircle, color: 'text-[#6B1829]', bg: 'bg-[#FBECF0]', border: 'border-[#ECAAB8]' },
        }[toast.type];

        const IconComponent = iconConfig.icon;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border ${iconConfig.border} ${iconConfig.bg} shadow-lg flex items-start gap-3 bg-white/95 backdrop-blur-sm transition-all animate-in slide-in-from-right-4`}
            role="alert"
          >
            <IconComponent className={`w-5 h-5 shrink-0 ${iconConfig.color} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#542743] leading-snug">
                {toast.title}
              </h4>
              {toast.description && (
                <p className="text-xs text-[#817780] mt-0.5 leading-relaxed">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-[#817780] hover:text-[#542743] p-1 rounded-md transition-colors cursor-pointer"
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
