import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import { formatRupee } from '../lib/finance';

export const Settings: React.FC = () => {
  const settings = useBudgetStore((state) => state.settings);
  const updateSettings = useBudgetStore((state) => state.updateSettings);
  const resetAllData = useBudgetStore((state) => state.resetAllData);
  const addToast = useBudgetStore((state) => state.addToast);
  const user = useBudgetStore((state) => state.user);

  const [startingBudget, setStartingBudget] = useState(settings.startingBudget);
  const [periodStartDate, setPeriodStartDate] = useState(settings.periodStartDate);
  const [periodLength, setPeriodLength] = useState(settings.periodLength);
  const [expectedIncome, setExpectedIncome] = useState(settings.expectedIncome);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startingBudget <= 0) {
      addToast({
        type: 'error',
        title: 'Validation error',
        description: 'Budget must be greater than ₹0.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateSettings({
        startingBudget,
        periodStartDate,
        periodLength,
        expectedIncome,
      });
      addToast({
        type: 'success',
        title: 'Settings Saved',
        description: 'Your budget parameters have been updated.',
      });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to completely reset your budget workspace? All transactions and progress will be cleared.'
      )
    ) {
      await resetAllData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
          Settings &amp; Preferences
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Adjust your 30-day budget period, initial survival allocation, or reset your workspace.
        </p>
      </div>

      {/* Account Info Pill */}
      <div className="p-4 rounded-2xl bg-[#FFFDF7] border border-[#EADFC8] flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Active Workspace
          </span>
          <p className="text-sm font-semibold text-brand-green mt-0.5">
            {user?.displayName || (user?.isDemo ? 'Guest' : 'User')} ({user?.email || 'Demo Mode'})
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#DCEBDD] text-brand-green text-xs font-bold border border-[#C5DEC7]">
          {user?.isDemo ? 'Local Demo' : 'Firebase Cloud Sync'}
        </span>
      </div>

      {/* Budget Configuration Form */}
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="w-5 h-5 text-brand-green" />
          <h2 className="font-serif text-xl font-bold text-brand-green">
            Budget Engine Parameters
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Starting Budget */}
            <div>
              <label htmlFor="settings-budget" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Starting Budget (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-base font-bold text-brand-green">
                  ₹
                </span>
                <input
                  id="settings-budget"
                  type="number"
                  min="1"
                  step="any"
                  value={startingBudget}
                  onChange={(e) => setStartingBudget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-lg text-brand-green outline-none focus:border-brand-orange tabular-nums"
                  required
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1">
                Currently: {formatRupee(startingBudget)}
              </p>
            </div>

            {/* Expected Additional Income */}
            <div>
              <label htmlFor="settings-income" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Expected Additional Income (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-base font-bold text-brand-green">
                  ₹
                </span>
                <input
                  id="settings-income"
                  type="number"
                  min="0"
                  step="any"
                  value={expectedIncome}
                  onChange={(e) => setExpectedIncome(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-lg text-brand-green outline-none focus:border-brand-orange tabular-nums"
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1">
                Mid-month freelance, stipends, or allowances.
              </p>
            </div>

            {/* Period Start Date */}
            <div>
              <label htmlFor="settings-start-date" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Period Start Date *
              </label>
              <div className="relative">
                <input
                  id="settings-start-date"
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-semibold text-sm text-brand-green outline-none focus:border-brand-orange"
                  required
                />
              </div>
              <p className="text-[11px] text-brand-muted mt-1">
                Marks Day 1 of your survival challenge.
              </p>
            </div>

            {/* Period Length */}
            <div>
              <label htmlFor="settings-period-length" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Period Length (Days) *
              </label>
              <input
                id="settings-period-length"
                type="number"
                min="7"
                max="60"
                value={periodLength}
                onChange={(e) => setPeriodLength(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-semibold text-sm text-brand-green outline-none focus:border-brand-orange tabular-nums"
                required
              />
              <p className="text-[11px] text-brand-muted mt-1">
                Default: 30 days for month-end survival.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EADFC8] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-sm hover:bg-brand-orange-hover shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Parameters'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone: Reset Data */}
      <div className="bg-red-50/60 border border-red-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-800 font-bold">
              <AlertTriangle className="w-5 h-5 text-red-700" />
              <h3 className="font-serif text-lg font-bold">
                Reset Budget Data
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-red-950/80 mt-1 max-w-lg leading-relaxed">
              Clear all transactions, commitments, subscriptions, and reset your starting balance back to defaults. This action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-red-700 text-white font-bold text-xs hover:bg-red-800 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
