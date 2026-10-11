import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  CalendarClock,
  Tv,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { useBudgetStore } from '../../store/budgetStore';
import { formatRupee } from '../../lib/finance';
import type { Commitment, Subscription, Goal } from '../../types';

interface OnboardingWizardProps {
  onFinished: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onFinished }) => {
  const completeOnboarding = useBudgetStore((state) => state.completeOnboarding);
  const addToast = useBudgetStore((state) => state.addToast);

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [startingBudget, setStartingBudget] = useState<number>(10000);
  const [expectedIncome, setExpectedIncome] = useState<number>(0);

  // Commitments
  const [commitments, setCommitments] = useState<Array<Omit<Commitment, 'id'>>>([]);
  const [newCommitName, setNewCommitName] = useState('');
  const [newCommitAmount, setNewCommitAmount] = useState<string>('');
  const [newCommitDueDay, setNewCommitDueDay] = useState<number>(15);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<Array<Omit<Subscription, 'id'>>>([]);
  const [newSubName, setNewSubName] = useState('');
  const [newSubAmount, setNewSubAmount] = useState<string>('');
  const [newSubDueDay, setNewSubDueDay] = useState<number>(10);

  // Goals
  const [goals, setGoals] = useState<Array<Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>>>([]);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState<string>('');

  const handleAddCommitment = () => {
    const amt = parseFloat(newCommitAmount);
    if (!newCommitName.trim() || isNaN(amt) || amt <= 0) return;
    setCommitments([
      ...commitments,
      {
        name: newCommitName.trim(),
        amount: amt,
        dueDay: Math.min(30, Math.max(1, newCommitDueDay)),
        isPaused: false,
        isPaid: false,
        autoDeduct: true,
      },
    ]);
    setNewCommitName('');
    setNewCommitAmount('');
  };

  const handleRemoveCommitment = (index: number) => {
    setCommitments(commitments.filter((_, i) => i !== index));
  };

  const handleAddSubscription = () => {
    const amt = parseFloat(newSubAmount);
    if (!newSubName.trim() || isNaN(amt) || amt <= 0) return;
    setSubscriptions([
      ...subscriptions,
      {
        name: newSubName.trim(),
        amount: amt,
        dueDay: Math.min(30, Math.max(1, newSubDueDay)),
        isPaused: false,
        isCancelled: false,
        autoDeduct: true,
      },
    ]);
    setNewSubName('');
    setNewSubAmount('');
  };

  const handleRemoveSubscription = (index: number) => {
    setSubscriptions(subscriptions.filter((_, i) => i !== index));
  };

  const handleAddGoal = () => {
    const amt = parseFloat(newGoalTarget);
    if (!newGoalName.trim() || isNaN(amt) || amt <= 0) return;
    const now = new Date();
    const deadline = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setGoals([
      ...goals,
      {
        name: newGoalName.trim(),
        targetAmount: amt,
        deadline,
      },
    ]);
    setNewGoalName('');
    setNewGoalTarget('');
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (startingBudget <= 0) {
      addToast({
        type: 'error',
        title: 'Starting Budget Required',
        description: 'Please enter a valid starting budget greater than ₹0.',
      });
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        startingBudget,
        expectedIncome,
        commitments,
        subscriptions,
        goals,
      });
      addToast({
        type: 'success',
        title: 'Welcome to ArthaSetu!',
        description: 'Your 30-day budget plan is live and ready.',
      });
      onFinished();
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Setup Failed',
        description: 'Could not save onboarding data. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFF8EC]/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Progress Tracker */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">
            <span>Step {step} of 5</span>
            <span>
              {step === 1 && 'Starting Budget (Required)'}
              {step === 2 && 'Expected Income (Optional)'}
              {step === 3 && 'Fixed Commitments (Optional)'}
              {step === 4 && 'Subscriptions (Optional)'}
              {step === 5 && 'Savings Goals (Optional)'}
            </span>
          </div>
          <div className="w-full bg-[#EADFC8] h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-orange h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Starting Budget */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEBDD] text-brand-green flex items-center justify-center mb-2">
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green">
              What is your starting budget?
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              For the &ldquo;Broke But Functional&rdquo; challenge, define the total amount you have to survive the next 30 days. Default is ₹10,000.
            </p>

            <div className="pt-2">
              <label htmlFor="budget-input" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Starting Budget (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-xl font-bold text-brand-green">
                  ₹
                </span>
                <input
                  id="budget-input"
                  type="number"
                  min="1"
                  step="100"
                  value={startingBudget || ''}
                  onChange={(e) => setStartingBudget(parseFloat(e.target.value) || 0)}
                  placeholder="10000"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif text-2xl font-bold text-brand-green focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none tabular-nums"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Expected Income */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEBDD] text-brand-green flex items-center justify-center mb-2">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green">
              Any expected income?
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              If you expect freelance payouts, pocket money, or stipends midway through the month, add them here. Or leave as ₹0 if living strictly off the budget.
            </p>

            <div className="pt-2">
              <label htmlFor="income-input" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Expected Income (₹)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-serif text-xl font-bold text-brand-green">
                  ₹
                </span>
                <input
                  id="income-input"
                  type="number"
                  min="0"
                  step="100"
                  value={expectedIncome || ''}
                  onChange={(e) => setExpectedIncome(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif text-2xl font-bold text-brand-green focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 outline-none tabular-nums"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Fixed Commitments */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEBDD] text-brand-green flex items-center justify-center mb-2">
              <CalendarClock className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green">
              Non-negotiable Commitments
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Rent share, mobile bill, or semester books that must be paid this month. These get protected from your daily spending allowance.
            </p>

            {/* List */}
            {commitments.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {commitments.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF8EC] border border-[#EADFC8] text-sm"
                  >
                    <div>
                      <span className="font-semibold text-brand-green">{c.name}</span>
                      <span className="text-xs text-brand-muted ml-2">Due Day {c.dueDay}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-green tabular-nums">{formatRupee(c.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitment(i)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add commitment row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#EADFC8]">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="e.g. Room Rent Share"
                  value={newCommitName}
                  onChange={(e) => setNewCommitName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={newCommitAmount}
                  onChange={(e) => setNewCommitAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none tabular-nums"
                />
              </div>
              <div className="sm:col-span-3 flex gap-1.5">
                <select
                  value={newCommitDueDay}
                  onChange={(e) => setNewCommitDueDay(parseInt(e.target.value))}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none font-semibold"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCommitment}
                  className="px-3 py-2 bg-brand-green text-cream-bg rounded-lg hover:bg-brand-green-light shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Subscriptions */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEBDD] text-brand-green flex items-center justify-center mb-2">
              <Tv className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green">
              Monthly Subscriptions
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Spotify, YouTube Premium, Netflix, gym fees, etc. We will auto-deduct or track them on their due day.
            </p>

            {subscriptions.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {subscriptions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF8EC] border border-[#EADFC8] text-sm"
                  >
                    <div>
                      <span className="font-semibold text-brand-green">{s.name}</span>
                      <span className="text-xs text-brand-muted ml-2">Due Day {s.dueDay}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-green tabular-nums">{formatRupee(s.amount)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubscription(i)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#EADFC8]">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="e.g. Spotify Student"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Amount ₹"
                  value={newSubAmount}
                  onChange={(e) => setNewSubAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none tabular-nums"
                />
              </div>
              <div className="sm:col-span-3 flex gap-1.5">
                <select
                  value={newSubDueDay}
                  onChange={(e) => setNewSubDueDay(parseInt(e.target.value))}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none font-semibold"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddSubscription}
                  className="px-3 py-2 bg-brand-green text-cream-bg rounded-lg hover:bg-brand-green-light shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Goals */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DCEBDD] text-brand-green flex items-center justify-center mb-2">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green">
              Savings Targets &amp; Goals
            </h2>
            <p className="text-sm text-brand-muted leading-relaxed">
              Create an Emergency Cushion or a fun milestone goal. You can simulate contributions in the What-If Lab anytime.
            </p>

            {goals.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {goals.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFF8EC] border border-[#EADFC8] text-sm"
                  >
                    <span className="font-semibold text-brand-green">{g.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-brand-green tabular-nums">Target: {formatRupee(g.targetAmount)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(i)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[#EADFC8]">
              <div className="sm:col-span-7">
                <input
                  type="text"
                  placeholder="e.g. Month-end Emergency Fund"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Target ₹"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#EADFC8] bg-[#FFF8EC] outline-none tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="w-full py-2 bg-brand-green text-cream-bg rounded-lg hover:bg-brand-green-light flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-[#EADFC8] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EADFC8] text-brand-green font-semibold text-sm hover:bg-[#FFF8EC] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step > 1 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="text-xs font-semibold text-brand-muted hover:text-brand-green underline underline-offset-4"
              >
                Skip for now
              </button>
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orange-hover shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-green text-cream-bg font-semibold text-sm hover:bg-brand-green-light shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? 'Finalizing...' : 'Launch ArthaSetu'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
