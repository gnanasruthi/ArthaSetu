import React, { useState } from 'react';
import {
  CalendarClock,
  Tv,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import { formatRupee } from '../lib/finance';
import { EmptyState } from '../components/common/EmptyState';
import type { Commitment, Subscription } from '../types';

export const Commitments: React.FC = () => {
  const commitments = useBudgetStore((state) => state.commitments);
  const subscriptions = useBudgetStore((state) => state.subscriptions);
  const addCommitment = useBudgetStore((state) => state.addCommitment);
  const updateCommitment = useBudgetStore((state) => state.updateCommitment);
  const deleteCommitment = useBudgetStore((state) => state.deleteCommitment);
  const toggleCommitmentPause = useBudgetStore((state) => state.toggleCommitmentPause);
  const toggleCommitmentPaid = useBudgetStore((state) => state.toggleCommitmentPaid);

  const addSubscription = useBudgetStore((state) => state.addSubscription);
  const updateSubscription = useBudgetStore((state) => state.updateSubscription);
  const deleteSubscription = useBudgetStore((state) => state.deleteSubscription);
  const toggleSubscriptionPause = useBudgetStore((state) => state.toggleSubscriptionPause);
  const toggleSubscriptionCancelled = useBudgetStore(
    (state) => state.toggleSubscriptionCancelled
  );

  const addToast = useBudgetStore((state) => state.addToast);

  // Modals state
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [commitName, setCommitName] = useState('');
  const [commitAmount, setCommitAmount] = useState('');
  const [commitDueDay, setCommitDueDay] = useState<number>(15);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDueDay, setSubDueDay] = useState<number>(10);

  // Total loads
  const activeCommitmentLoad = commitments
    .filter((c) => !c.isPaused && !c.isPaid)
    .reduce((sum, c) => sum + c.amount, 0);

  const activeSubLoad = subscriptions
    .filter((s) => !s.isPaused && !s.isCancelled)
    .reduce((sum, s) => sum + s.amount, 0);

  const totalFixedLoad = activeCommitmentLoad + activeSubLoad;

  // Handlers for Commitment
  const handleOpenCommitModal = (c?: Commitment) => {
    if (c) {
      setEditingCommitment(c);
      setCommitName(c.name);
      setCommitAmount(c.amount.toString());
      setCommitDueDay(c.dueDay);
    } else {
      setEditingCommitment(null);
      setCommitName('');
      setCommitAmount('');
      setCommitDueDay(15);
    }
    setIsCommitModalOpen(true);
  };

  const handleSaveCommitment = async () => {
    const amt = parseFloat(commitAmount);
    if (!commitName.trim() || isNaN(amt) || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid commitment data' });
      return;
    }

    if (editingCommitment) {
      await updateCommitment(editingCommitment.id, {
        name: commitName.trim(),
        amount: amt,
        dueDay: commitDueDay,
      });
      addToast({ type: 'info', title: 'Commitment updated' });
    } else {
      await addCommitment({
        name: commitName.trim(),
        amount: amt,
        dueDay: commitDueDay,
        isPaused: false,
        isPaid: false,
        autoDeduct: true,
      });
      addToast({ type: 'success', title: 'Fixed commitment added' });
    }
    setIsCommitModalOpen(false);
  };

  // Handlers for Subscription
  const handleOpenSubModal = (s?: Subscription) => {
    if (s) {
      setEditingSub(s);
      setSubName(s.name);
      setSubAmount(s.amount.toString());
      setSubDueDay(s.dueDay);
    } else {
      setEditingSub(null);
      setSubName('');
      setSubAmount('');
      setSubDueDay(10);
    }
    setIsSubModalOpen(true);
  };

  const handleSaveSubscription = async () => {
    const amt = parseFloat(subAmount);
    if (!subName.trim() || isNaN(amt) || amt <= 0) {
      addToast({ type: 'error', title: 'Invalid subscription data' });
      return;
    }

    if (editingSub) {
      await updateSubscription(editingSub.id, {
        name: subName.trim(),
        amount: amt,
        dueDay: subDueDay,
      });
      addToast({ type: 'info', title: 'Subscription updated' });
    } else {
      await addSubscription({
        name: subName.trim(),
        amount: amt,
        dueDay: subDueDay,
        isPaused: false,
        isCancelled: false,
        autoDeduct: true,
      });
      addToast({ type: 'success', title: 'Recurring subscription added' });
    }
    setIsSubModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
          Commitments &amp; Subscriptions
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Lock in your non-negotiables. Pausing or modifying any item updates your daily allowance and forecast in real time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADFC8] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Total Fixed Obligations
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-green tabular-nums mt-1">
            {formatRupee(totalFixedLoad)}
          </div>
          <p className="text-xs text-brand-muted mt-1.5">
            Active monthly load reserved from flexible allowance.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADFC8] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Commitments Load
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-green tabular-nums mt-1">
            {formatRupee(activeCommitmentLoad)}
          </div>
          <p className="text-xs text-brand-muted mt-1.5">
            {commitments.filter((c) => !c.isPaused).length} active bills &amp; rent shares.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#FFFDF7] border border-[#EADFC8] shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            Subscriptions Load
          </span>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-green tabular-nums mt-1">
            {formatRupee(activeSubLoad)}
          </div>
          <p className="text-xs text-brand-muted mt-1.5">
            {subscriptions.filter((s) => !s.isPaused && !s.isCancelled).length} recurring media &amp; tool charges.
          </p>
        </div>
      </div>

      {/* Section 1: Non-Negotiable Commitments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-brand-green" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
              Fixed Commitments
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleOpenCommitModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-green text-cream-bg text-xs font-bold hover:bg-brand-green-light shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Commitment</span>
          </button>
        </div>

        {commitments.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No fixed commitments configured"
            description="Add fixed rent shares, utility bills, or tuition dues to safeguard them from your daily allowance."
            actionLabel="+ Add Commitment"
            onAction={() => handleOpenCommitModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commitments.map((c) => (
              <div
                key={c.id}
                className={`p-5 rounded-2xl border transition-all ${
                  c.isPaused
                    ? 'bg-[#FFF8EC]/60 border-[#EADFC8] opacity-65'
                    : c.isPaid
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-[#FFFDF7] border-[#EADFC8]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-brand-green">
                      {c.name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Due Day {c.dueDay} of the cycle
                    </p>
                  </div>
                  <span className="font-serif text-xl font-bold text-brand-green tabular-nums">
                    {formatRupee(c.amount)}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EADFC8]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Mark as paid button */}
                    <button
                      type="button"
                      onClick={() => toggleCommitmentPaid(c.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        c.isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#FFF8EC] text-brand-muted hover:text-brand-green border border-[#EADFC8]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{c.isPaid ? 'Paid this cycle' : 'Mark Paid'}</span>
                    </button>

                    {/* Pause toggle */}
                    <button
                      type="button"
                      onClick={() => toggleCommitmentPause(c.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        c.isPaused
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#FFF8EC] text-brand-muted hover:text-brand-green border border-[#EADFC8]'
                      }`}
                    >
                      {c.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      <span>{c.isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCommitModal(c)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete commitment "${c.name}"?`)) {
                          deleteCommitment(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Subscriptions */}
      <div className="space-y-4 pt-4 border-t border-[#EADFC8]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-brand-orange" />
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
              Subscriptions
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleOpenSubModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-hover shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscription</span>
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <EmptyState
            icon={Tv}
            title="No subscriptions tracked"
            description="Keep track of recurring streaming, cloud apps, and memberships to avoid sneaky monthly drain."
            actionLabel="+ Add Subscription"
            onAction={() => handleOpenSubModal()}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className={`p-5 rounded-2xl border transition-all ${
                  s.isCancelled
                    ? 'bg-rose-50/40 border-rose-200 line-through text-brand-muted'
                    : s.isPaused
                    ? 'bg-[#FFF8EC]/60 border-[#EADFC8] opacity-65'
                    : 'bg-[#FFFDF7] border-[#EADFC8]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-brand-green">
                      {s.name}
                    </h3>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Auto-renews Day {s.dueDay} of month
                    </p>
                  </div>
                  <span className="font-serif text-xl font-bold text-brand-green tabular-nums">
                    {formatRupee(s.amount)}/mo
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EADFC8]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSubscriptionCancelled(s.id)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        s.isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-[#FFF8EC] text-brand-muted hover:text-red-700 border border-[#EADFC8]'
                      }`}
                    >
                      {s.isCancelled ? 'Cancelled' : 'Cancel'}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleSubscriptionPause(s.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                        s.isPaused
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#FFF8EC] text-brand-muted hover:text-brand-green border border-[#EADFC8]'
                      }`}
                    >
                      {s.isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      <span>{s.isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenSubModal(s)}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete subscription "${s.name}"?`)) {
                          deleteSubscription(s.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-brand-muted hover:text-red-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Commitment Modal */}
      {isCommitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFC8]">
              <h3 className="font-serif text-lg font-bold text-brand-green">
                {editingCommitment ? 'Edit Commitment' : 'Add Fixed Commitment'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCommitModalOpen(false)}
                className="p-1 rounded-lg text-brand-muted hover:text-brand-green"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rent, Electricity Bill, Semester Book"
                  value={commitName}
                  onChange={(e) => setCommitName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 2500"
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-base text-brand-green outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Due Day of Period (1..30)
                </label>
                <select
                  value={commitDueDay}
                  onChange={(e) => setCommitDueDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm font-semibold text-brand-green outline-none"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EADFC8]">
              <button
                type="button"
                onClick={() => setIsCommitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-green hover:bg-[#FFF8EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCommitment}
                className="px-5 py-2 rounded-xl bg-brand-green text-cream-bg text-xs font-bold hover:bg-brand-green-light"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {isSubModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFC8]">
              <h3 className="font-serif text-lg font-bold text-brand-green">
                {editingSub ? 'Edit Subscription' : 'Add Monthly Subscription'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded-lg text-brand-muted hover:text-brand-green"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Subscription Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spotify, Claude Pro, Gym Membership"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Monthly Cost (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 119"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-base text-brand-green outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Renewal Day of Month (1..30)
                </label>
                <select
                  value={subDueDay}
                  onChange={(e) => setSubDueDay(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm font-semibold text-brand-green outline-none"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EADFC8]">
              <button
                type="button"
                onClick={() => setIsSubModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-green hover:bg-[#FFF8EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSubscription}
                className="px-5 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-hover"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
