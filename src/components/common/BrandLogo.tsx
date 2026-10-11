import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 36,
  showText = true,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-brand-green text-cream-bg shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Bridge arch */}
          <path
            d="M8 35C13 24 20 20 24 20C28 20 35 24 40 35"
            stroke="#DCEBDD"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Bridge vertical suspension struts */}
          <path
            d="M13 35V27M35 35V27M24 35V20"
            stroke="#DCEBDD"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Roadbed beam */}
          <line
            x1="7"
            y1="35"
            x2="41"
            y2="35"
            stroke="#F28C28"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {/* Indian Rupee Mark resting above bridge */}
          <path
            d="M18 10H30M18 14.5H28M18 10V22M23.5 14.5C26.5 14.5 28 16.5 27 19C26 21.5 23.5 22 20.5 22L28 31"
            stroke="#FFF8EC"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col min-w-0">
          <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-brand-green leading-none">
            ArthaSetu
          </span>
          <span className="text-[11px] font-medium text-brand-muted tracking-tight truncate mt-0.5">
            Bridge your money to month-end
          </span>
        </div>
      )}
    </div>
  );
};
