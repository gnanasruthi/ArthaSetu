import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';
import type { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
  variant?: 'mint-pill' | 'default';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  className = '',
  variant = 'mint-pill',
}) => {
  const config = {
    Low: {
      icon: ShieldCheck,
      label: 'Low Risk',
      textColor: 'text-emerald-800',
      iconColor: 'text-emerald-700',
      pillBg: 'bg-[#DCEBDD]',
      dotColor: 'bg-emerald-600',
    },
    Medium: {
      icon: AlertTriangle,
      label: 'Medium Risk',
      textColor: 'text-amber-900',
      iconColor: 'text-amber-700',
      pillBg: 'bg-amber-100',
      dotColor: 'bg-amber-600',
    },
    High: {
      icon: AlertOctagon,
      label: 'High Risk',
      textColor: 'text-rose-900',
      iconColor: 'text-rose-600',
      pillBg: 'bg-rose-100',
      dotColor: 'bg-rose-600',
    },
    Critical: {
      icon: Flame,
      label: 'Critical Risk',
      textColor: 'text-red-950',
      iconColor: 'text-red-700',
      pillBg: 'bg-red-200',
      dotColor: 'bg-red-700',
    },
  }[level];

  const IconComponent = config.icon;

  if (variant === 'mint-pill') {
    // Specifically styled for readability on dark cards (e.g. Hero card)
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCEBDD] text-[#153629] text-xs font-semibold tracking-wide shadow-sm border border-[#C5DEC7] ${className}`}
        role="status"
        aria-label={`Risk level: ${config.label}`}
      >
        <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} aria-hidden="true" />
        <span>{config.label}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.pillBg} ${config.textColor} text-xs font-semibold ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
