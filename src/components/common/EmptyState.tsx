import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#E8DDD5] bg-[#FFFFFF] ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#FDF1ED] text-[#542743] flex items-center justify-center mb-4 shadow-2xs border border-[#F5B39B]/50">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#542743]">
        {title}
      </h3>
      <p className="text-sm text-[#817780] max-w-sm mt-1.5 mb-5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#542743] text-white font-medium text-sm shadow-xs hover:bg-[#3D1C35] active:scale-98 transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#542743] cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
