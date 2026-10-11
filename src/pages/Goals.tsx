import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowDownLeft,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import {
  calculateFinancialMetrics,
  reviewGoalContribution,
  formatRupee,
} from '../lib/finance';
import { EmptyState } from '../components/common/EmptyState';
import type { Goal, GoalContributionReview } from '../types';

export const Goals: React.FC = () => {
  const goals = useBudgetStore((state) => state.goals);
  const addGoal = useBudgetStore((state) => state.addGoal);
  const updateGoal = useBudgetStore((state) => state.updateGoal);
  const deleteGoal = useBudgetStore((state) => state.deleteGoal);
  const contributeToGoal = useBudgetStore((state) => state.contributeToGoal);
  const withdrawFromGoal = useBudgetStore((state) => state.withdrawFromGoal);
  const addToast = useBudgetStore((state) => state.addToast);

  const settings = useBudgetStore((state) => state.settings);
  const transactions = useBudgetStore((state) => state.transactions);
  const commitments = useBudgetStore((state) => state.commitments);
  const subscriptions = useBudgetStore((state) => state.subscriptions);

  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });
  }, [settings, transactions, commitments, subscriptions, goals]);

  // Expanded inline contribute panel state (keyed by goal id)
  const [activeContributeGoalId, setActiveContributeGoalId] = useState<string | null>(null);
  const [contributeAmountStr, setContributeAmountStr] = useState<string>('');

  // Expanded inline withdraw panel state (keyed by goal id)
  const [activeWithdrawGoalId, setActiveWithdrawGoalId] = useState<string | null>(null);
  const [withdrawAmountStr, setWithdrawAmountStr] = useState<string>('');

  // Confirmation Modal Review State
  const [reviewData, setReviewData] = useState<GoalContributionReview | null>(null);
  const [extraConfirmed, setExtraConfirmed] = useState(false);

  // Add / Edit Goal Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formName, setFormName] = useState('');
  const [formTargetStr, setFormTargetStr] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  const handleOpenAddModal = () => {
    setFormName('');
    setFormTargetStr('');
    const now = new Date();
    setFormDeadline(
      new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    );
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = async () => {
    const target = parseFloat(formTargetStr);
    if (!formName.trim() || isNaN(target) || target <= 0) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        description: 'Provide a valid goal title and target amount.',
      });
      return;
    }

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        name: formName.trim(),
        targetAmount: target,
        deadline: formDeadline,
      });
      addToast({ type: 'info', title: 'Goal updated' });
      setEditingGoal(null);
    } else {
      await addGoal({
        name: formName.trim(),
        targetAmount: target,
        deadline: formDeadline,
      });
      addToast({ type: 'success', title: 'New savings goal established' });
      setIsAddModalOpen(false);
    }
  };

  const handleStartReview = (goal: Goal) => {
    const amount = parseFloat(contributeAmountStr);
    if (isNaN(amount) || amount <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid amount',
        description: 'Please enter a positive contribution amount.',
      });
      return;
    }

    // Call pure finance engine review
    const review = reviewGoalContribution({
      goal,
      contributionAmount: amount,
      currentMetrics: metrics,
    });

    setReviewData(review);
    setExtraConfirmed(false);
  };

  const handleExecuteContribution = async () => {
    if (!reviewData) return;

    if (reviewData.requiresExtraConfirmation && !extraConfirmed) {
      addToast({
        type: 'warning',
        title: 'Confirmation required',
        description: 'Please confirm that you want to contribute despite the risk.',
      });
      return;
    }

    await contributeToGoal(reviewData.goalId, reviewData.contributionAmount);

    setReviewData(null);
    setActiveContributeGoalId(null);
    setContributeAmountStr('');
  };

  const handleExecuteWithdraw = async (goalId: string) => {
    const amount = parseFloat(withdrawAmountStr);
    if (isNaN(amount) || amount <= 0) return;

    await withdrawFromGoal(goalId, amount);
    setActiveWithdrawGoalId(null);
    setWithdrawAmountStr('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
            Savings Goals
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Build emergency buffers and protect yourself from month-end shocks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orange-hover shadow-sm transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals established yet"
          description="Setting aside even ₹500 as an emergency cushion drastically boosts your Financial Health Score."
          actionLabel="+ Create Your First Goal"
          onAction={handleOpenAddModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const percent = Math.min(
              100,
              Math.round((goal.currentAmount / Math.max(1, goal.targetAmount)) * 100)
            );
            const isContributeActive = activeContributeGoalId === goal.id;
            const isWithdrawActive = activeWithdrawGoalId === goal.id;

            // Mini SVG circular progress ring
            const radius = 34;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (percent / 100) * circumference;

            return (
              <div
                key={goal.id}
                className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Animated SVG Progress Ring */}
                      <div className="relative w-20 h-20 shrink-0">
                        <svg className="w-20 h-20 -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="#EADFC8"
                            strokeWidth="7"
                            fill="none"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r={radius}
                            stroke="#1F4D3A"
                            strokeWidth="7"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-brand-green tabular-nums">
                          {percent}%
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-bold text-brand-green truncate">
                          {goal.name}
                        </h3>
                        <p className="text-xs text-brand-muted mt-0.5">
                          Target: {formatRupee(goal.targetAmount)}
                        </p>
                        <p className="text-xs font-semibold text-brand-green mt-1 tabular-nums">
                          Saved: {formatRupee(goal.currentAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingGoal(goal);
                          setFormName(goal.name);
                          setFormTargetStr(goal.targetAmount.toString());
                          setFormDeadline(goal.deadline);
                        }}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green hover:bg-[#FFF8EC]"
                        aria-label="Edit goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete goal "${goal.name}"?`)) {
                            deleteGoal(goal.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-red-700 hover:bg-red-50"
                        aria-label="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-[#EADFC8]/60 h-2 rounded-full overflow-hidden mb-5">
                    <div
                      className="bg-brand-green h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-[#EADFC8]/70">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveContributeGoalId(isContributeActive ? null : goal.id);
                        setActiveWithdrawGoalId(null);
                        setContributeAmountStr('');
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-green text-cream-bg text-xs font-semibold hover:bg-brand-green-light transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isContributeActive ? 'Close' : '+ Contribute'}</span>
                    </button>

                    {goal.currentAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveWithdrawGoalId(isWithdrawActive ? null : goal.id);
                          setActiveContributeGoalId(null);
                          setWithdrawAmountStr('');
                        }}
                        className="py-2 px-3 rounded-xl border border-[#EADFC8] text-brand-green text-xs font-semibold hover:bg-[#FFF8EC] transition-all flex items-center justify-center gap-1.5"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Expandable Contribute Panel */}
                  {isContributeActive && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFF8EC] border border-[#EADFC8] animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                          Contribute to {goal.name}
                        </span>
                        <span className="text-xs text-brand-muted tabular-nums">
                          Available: <strong>{formatRupee(metrics.remainingBalance)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-sm font-bold text-brand-green">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            placeholder="Amount to save"
                            value={contributeAmountStr}
                            onChange={(e) => setContributeAmountStr(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-[#EADFC8] bg-[#FFFDF7] font-semibold text-brand-green outline-none tabular-nums"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartReview(goal)}
                          className="px-4 py-2 bg-brand-orange text-white text-xs font-bold rounded-xl hover:bg-brand-orange-hover transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Expandable Withdraw Panel */}
                  {isWithdrawActive && (
                    <div className="mt-4 p-4 rounded-2xl bg-[#FFF8EC] border border-[#EADFC8] animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                          Withdraw to Available Balance
                        </span>
                        <span className="text-xs text-brand-muted tabular-nums">
                          Saved: <strong>{formatRupee(goal.currentAmount)}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-serif text-sm font-bold text-brand-green">
                            ₹
                          </span>
                          <input
                            type="number"
                            min="1"
                            max={goal.currentAmount}
                            step="any"
                            placeholder="Amount to release"
                            value={withdrawAmountStr}
                            onChange={(e) => setWithdrawAmountStr(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 text-sm rounded-xl border border-[#EADFC8] bg-[#FFFDF7] font-semibold text-brand-green outline-none tabular-nums"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleExecuteWithdraw(goal.id)}
                          className="px-4 py-2 bg-brand-green text-cream-bg text-xs font-bold rounded-xl hover:bg-brand-green-light transition-colors"
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal from Finance Engine */}
      {reviewData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
            <div className="flex items-start justify-between pb-4 border-b border-[#EADFC8]">
              <div>
                <h3 className="font-serif text-xl font-bold text-brand-green">
                  Review Goal Contribution
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  Assessing impact on &ldquo;{reviewData.goalName}&rdquo; &amp; month-end runway
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewData(null)}
                className="p-1 rounded-lg text-brand-muted hover:text-brand-green"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict Banner */}
            <div
              className={`my-4 p-4 rounded-2xl border flex items-start gap-3 ${
                reviewData.verdict === 'Safe'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : reviewData.verdict === 'Tight'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-red-50 border-red-200 text-red-950'
              }`}
            >
              {reviewData.verdict === 'Safe' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : reviewData.verdict === 'Tight' ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  Verdict: {reviewData.verdict}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">
                  {reviewData.verdictExplanation}
                </p>
              </div>
            </div>

            {/* Numbers Breakdown */}
            <div className="space-y-3 py-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8EC] border border-[#EADFC8]">
                <span className="font-medium text-brand-muted">Spending Balance</span>
                <span className="font-bold text-brand-green tabular-nums">
                  {formatRupee(reviewData.balanceNow)} &rarr; {formatRupee(reviewData.balanceAfter)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8EC] border border-[#EADFC8]">
                <span className="font-medium text-brand-muted">Upcoming Obligations Protected</span>
                <span className="font-bold text-brand-green tabular-nums">
                  {formatRupee(reviewData.remainingObligations)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8EC] border border-[#EADFC8]">
                <span className="font-medium text-brand-muted">Safe Daily Allowance</span>
                <span className="font-bold text-brand-green tabular-nums">
                  {formatRupee(reviewData.safeDailyAllowanceBefore)}/day &rarr;{' '}
                  <span
                    className={
                      reviewData.safeDailyAllowanceAfter < 150 ? 'text-amber-800' : 'text-emerald-800'
                    }
                  >
                    {formatRupee(reviewData.safeDailyAllowanceAfter)}/day
                  </span>
                </span>
              </div>
            </div>

            {/* If Red Verdict: Extra Confirmation Required */}
            {reviewData.requiresExtraConfirmation && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-100/70 border border-red-300">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={extraConfirmed}
                    onChange={(e) => setExtraConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-xs font-semibold text-red-950">
                    Contribute anyway: I understand this leaves insufficient money for my upcoming bills.
                  </span>
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-6 pt-4 border-t border-[#EADFC8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewData(null)}
                className="px-4 py-2 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-green hover:bg-[#FFF8EC]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  reviewData.contributionAmount > reviewData.balanceNow ||
                  (reviewData.requiresExtraConfirmation && !extraConfirmed)
                }
                onClick={handleExecuteContribution}
                className="px-5 py-2.5 rounded-xl bg-brand-green text-cream-bg text-xs font-bold hover:bg-brand-green-light transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  Confirm Transfer ({formatRupee(reviewData.contributionAmount)})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {(isAddModalOpen || editingGoal) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFC8]">
              <h3 className="font-serif text-lg font-bold text-brand-green">
                {editingGoal ? 'Edit Goal' : 'New Savings Goal'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingGoal(null);
                }}
                className="p-1 rounded-lg text-brand-muted hover:text-brand-green"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency Cushion, Concert Ticket"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Target Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 3000"
                  value={formTargetStr}
                  onChange={(e) => setFormTargetStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-base text-brand-green outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-xs font-semibold text-brand-green outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EADFC8]">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingGoal(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-green hover:bg-[#FFF8EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGoal}
                className="px-5 py-2 rounded-xl bg-brand-green text-cream-bg text-xs font-bold hover:bg-brand-green-light"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
