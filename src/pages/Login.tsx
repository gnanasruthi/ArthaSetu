import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { BrandLogo } from '../components/common/BrandLogo';
import { useBudgetStore } from '../store/budgetStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginAsFrontendUser = useBudgetStore((state) => state.loginAsFrontendUser);
  const enterDemoMode = useBudgetStore((state) => state.enterDemoMode);

  const handleGoogleSignIn = () => {
    // Frontend-only login flow without external Firebase popup
    loginAsFrontendUser({
      displayName: 'Rohan Verma',
      email: 'rohan.verma@example.com',
    });
    navigate('/');
  };

  const handleTryDemo = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-[#1B2A22] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Main Container */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          <div className="flex justify-center mb-5">
            <BrandLogo size={46} showText={false} />
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
            ArthaSetu
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-brand-orange mt-1">
            Bridge your money to month-end
          </p>

          <p className="text-xs sm:text-sm text-brand-muted mt-3 mb-6 leading-relaxed">
            Built for the &ldquo;Broke But Functional: Survive the Month&rdquo; challenge.
            Simulate financial decisions, protect upcoming bills, and prevent running out of money before next payday.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Google Sign In (Frontend Demonstration Mode) */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 rounded-xl border border-[#EADFC8] bg-white hover:bg-[#FFF8EC] font-semibold text-xs sm:text-sm text-brand-green transition-all shadow-2xs flex items-center justify-center gap-3 active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Try Demo Button */}
            <button
              type="button"
              onClick={handleTryDemo}
              className="w-full py-3 px-4 rounded-xl bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange-hover shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Try Demo Mode (Instant Sandbox)</span>
            </button>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 pt-6 border-t border-[#EADFC8]/60 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-brand-green mb-1" />
              <span className="text-[10px] font-bold text-brand-green uppercase">
                Safe Runway
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Sparkles className="w-4 h-4 text-brand-orange mb-1" />
              <span className="text-[10px] font-bold text-brand-green uppercase">
                What-If Lab
              </span>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="w-4 h-4 text-emerald-700 mb-1" />
              <span className="text-[10px] font-bold text-brand-green uppercase">
                Health Score
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-brand-muted py-2">
        <p>ArthaSetu · Built for Gen Z financial resilience · Default budget: ₹10,000 / 30 Days</p>
      </footer>
    </div>
  );
};
