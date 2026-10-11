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
      stroke: '#542743',
      text: 'text-[#542743]',
      bg: 'bg-[#F9EDF2]',
      border: 'border-[#E6BCCE]',
    },
    Okay: {
      stroke: '#A66A8D',
      text: 'text-[#85274C]',
      bg: 'bg-[#F9EDF2]',
      border: 'border-[#E6BCCE]',
    },
    Shaky: {
      stroke: '#F5B39B',
      text: 'text-[#8A4524]',
      bg: 'bg-[#FDF1ED]',
      border: 'border-[#F5B39B]',
    },
    Critical: {
      stroke: '#7A1C2E',
      text: 'text-[#6B1829]',
      bg: 'bg-[#FBECF0]',
      border: 'border-[#ECAAB8]',
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
            stroke="#E8DDD5"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Value Ring (Dusty Rose / Band color) */}
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
          <span className="font-serif text-3xl font-bold text-[#542743] leading-none tabular-nums">
            {health.score}
          </span>
          <span className="text-xs font-semibold text-[#817780] mt-0.5">
            /100
          </span>
        </div>
      </div>

      {/* Band Badge */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span
          className={`px-3 py-0.5 text-xs font-bold rounded-full border ${bandColors.bg} ${bandColors.text} ${bandColors.border}`}
        >
          {health.band} Score
        </span>
      </div>

      {/* "How is this calculated?" Popover button */}
      <button
        type="button"
        onClick={() => setIsPopoverOpen(true)}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#817780] hover:text-[#542743] transition-colors underline underline-offset-2 focus-visible:ring-1 focus-visible:ring-[#542743] rounded"
        aria-expanded={isPopoverOpen}
        aria-haspopup="dialog"
      >
        <HelpCircle className="w-3.5 h-3.5 text-[#A66A8D]" />
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
          <div className="bg-[#FFFFFF] border border-[#E8DDD5] rounded-3xl max-w-lg w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8DDD5] pb-4">
              <div>
                <h3 id="health-dialog-title" className="font-serif text-xl font-bold text-[#542743]">
                  Financial Health Score Breakdown
                </h3>
                <p className="text-xs text-[#817780] mt-1">
                  Evaluated out of 100 points across 5 survival metrics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="p-1.5 rounded-lg text-[#817780] hover:text-[#542743] hover:bg-[#F5F0EA] transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              {health.factors.map((factor) => (
                <div
                  key={factor.name}
                  className="p-3.5 rounded-2xl bg-[#F5F0EA] border border-[#E8DDD5]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[#542743]">
                      {factor.name}
                    </span>
                    <span className="text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-lg bg-white border border-[#E8DDD5] text-[#542743]">
                      {factor.score} / {factor.maxScore} pts
                    </span>
                  </div>

                  <p className="text-xs text-[#817780] mt-1 leading-relaxed">
                    {factor.explanation}
                  </p>

                  <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#302630]">
                    {factor.score >= 14 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#225539] shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[#A45C33] shrink-0" />
                    )}
                    <span>Current status: <strong className="font-semibold text-[#542743]">{factor.userValueDescription}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E8DDD5] pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[#817780]">
              <span>Bands: 80+ Strong · 60-79 Okay · 40-59 Shaky · &lt;40 Critical</span>
              <button
                type="button"
                onClick={() => setIsPopoverOpen(false)}
                className="px-5 py-2 bg-[#542743] text-white font-semibold rounded-xl hover:bg-[#3D1C35] transition-colors cursor-pointer w-full sm:w-auto"
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
