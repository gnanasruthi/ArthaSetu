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
      textColor: 'text-[#225539]',
      iconColor: 'text-[#225539]',
      pillBg: 'bg-[#EBF3ED]',
      borderColor: 'border-[#CCE2D2]',
    },
    Medium: {
      icon: AlertTriangle,
      label: 'Medium Risk',
      textColor: 'text-[#8A4524]',
      iconColor: 'text-[#8A4524]',
      pillBg: 'bg-[#FDF1ED]',
      borderColor: 'border-[#F5B39B]',
    },
    High: {
      icon: AlertOctagon,
      label: 'High Risk',
      textColor: 'text-[#85274C]',
      iconColor: 'text-[#85274C]',
      pillBg: 'bg-[#F9EDF2]',
      borderColor: 'border-[#E6BCCE]',
    },
    Critical: {
      icon: Flame,
      label: 'Critical Risk',
      textColor: 'text-[#6B1829]',
      iconColor: 'text-[#6B1829]',
      pillBg: 'bg-[#FBECF0]',
      borderColor: 'border-[#ECAAB8]',
    },
  }[level];

  const IconComponent = config.icon;

  if (variant === 'mint-pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.pillBg} ${config.textColor} text-xs font-semibold tracking-wide shadow-2xs border ${config.borderColor} ${className}`}
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.pillBg} ${config.textColor} text-xs font-semibold border ${config.borderColor} ${className}`}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
};
