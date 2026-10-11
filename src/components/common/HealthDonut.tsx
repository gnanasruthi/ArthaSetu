import React, { useState } from 'react';
import { HelpCircle, X, CheckCircle2, AlertCircle } from 'lucide-react';
import type { FinancialHealth } from '../../types';

interface HealthDonutProps {
  health: FinancialHealth;
  size?: number;
  strokeWidth?: number;
}

export const HealthDonut: React.FC<HealthDonutProps> = ({
  health,
  size = 140,
  strokeWidth = 12,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (health.score / 100) * circumference;

  const bandColors = {
    Strong: {
      stroke: '#15803D',
      text: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    },
    Okay: {
      stroke: '#B45309',
      text: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    Shaky: {
      stroke: '#EA580C',
      text: 'text-orange-700',
      bg: 'bg-orange-50',
      border: 'border-orange-200',
    },
    Critical: {
      stroke: '#991B1B',
      text: 'text-red-700',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  }[health.band];

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EADFC8"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Value Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bandColors.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="font-serif text-3xl font-bold text-brand-green leading-none tabular-nums">
            {health.score}
          </span>
          <span className="text-xs font-semibold text-brand-muted mt-0.5">
            /100
          </span>
        </div>
      </div>

      {/* Band Badge */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${bandColors.bg} ${bandColors.text} ${bandColors.border}`}
        >
          {health.band} Score
        </span>
      </div>

      {/* "How is this calculated?" Popover button */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-muted hover:text-brand-green transition-colors underline underline-offset-2 focus-visible:ring-1 focus-visible:ring-brand-orange rounded"
        aria-expanded={isPopoverOpen}
        aria-haspopup="dialog"
      >
        <HelpCircle className="w-3.5 h-3.5 text-brand-orange" />
        <span>How is this calculated?</span>
      </button>

      {/* Popover / Modal Dialog */}
      {isPopoverOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="health-dialog-title"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#EADFC8] pb-4">
              <div>
                <h3 id="health-dialog-title" className="font-serif text-xl font-bold text-brand-green">
                  Financial Health Score Breakdown
                </h3>
                <p className="text-xs text-brand-muted mt-1">
                  Evaluated out of 100 points across 5 survival metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green hover:bg-[#FFF8EC] transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {health.factors.map((factor) => (
                <div
                  key={factor.name}
                  className="p-3.5 rounded-xl bg-[#FFF8EC] border border-[#EADFC8]/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-brand-green">
                      {factor.name}
                    </span>
                    <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-md bg-white border border-[#EADFC8] text-brand-green">
                      {factor.score} / {factor.maxScore} pts
                    </span>
                  </div>

                  <p className="text-xs text-brand-muted mt-1">
                    {factor.explanation}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-text/90">
                    {factor.score >= 14 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span>Current status: <strong className="font-semibold text-brand-green">{factor.userValueDescription}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EADFC8] pt-4 flex justify-between items-center text-xs text-brand-muted">
              <span>Bands: 80+ Strong · 60-79 Okay · 40-59 Shaky · &lt;40 Critical</span>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="px-4 py-2 bg-brand-green text-cream-bg font-semibold rounded-lg hover:bg-brand-green-light transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
