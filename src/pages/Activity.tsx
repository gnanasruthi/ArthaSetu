import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import { calculateFinancialMetrics, formatRupee } from '../lib/finance';
import { EmptyState } from '../components/common/EmptyState';
import type { Transaction, TransactionType } from '../types';

export const Activity: React.FC = () => {
  const transactions = useBudgetStore((state) => state.transactions);
  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const updateTransaction = useBudgetStore((state) => state.updateTransaction);
  const deleteTransaction = useBudgetStore((state) => state.deleteTransaction);
  const addToast = useBudgetStore((state) => state.addToast);
  const settings = useBudgetStore((state) => state.settings);
  const commitments = useBudgetStore((state) => state.commitments);
  const subscriptions = useBudgetStore((state) => state.subscriptions);
  const goals = useBudgetStore((state) => state.goals);

  // Compute metrics for currentDay
  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });
  }, [settings, transactions, commitments, subscriptions, goals]);

  // Form State (amount + free text "Where did you spend it?", Expense/Income toggle)
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Amount',
        description: 'Please enter a positive amount.',
      });
      return;
    }

    if (!description.trim()) {
      addToast({
        type: 'error',
        title: 'Description Required',
        description: 'Please specify where this money was spent or received.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      await addTransaction({
        type,
        amount,
        description: description.trim(),
        date: now.toISOString(),
        dayOfPeriod: metrics.currentDay,
      });

      addToast({
        type: 'success',
        title: `${type === 'income' ? 'Income' : 'Expense'} Logged`,
        description: `${formatRupee(amount)} for "${description.trim()}"`,
      });

      // Reset form
      setAmountStr('');
      setDescription('');
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Failed to record transaction',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmountStr(tx.amount.toString());
    setEditDescription(tx.description);
  };

  const handleSaveEdit = async () => {
    if (!editingTx) return;
    const amount = parseFloat(editAmountStr);
    if (isNaN(amount) || amount <= 0 || !editDescription.trim()) return;

    await updateTransaction(editingTx.id, {
      amount,
      description: editDescription.trim(),
    });

    addToast({
      type: 'info',
      title: 'Transaction Updated',
    });
    setEditingTx(null);
  };

  const handleDelete = async (id: string, desc: string) => {
    if (window.confirm(`Delete "${desc}"?`)) {
      await deleteTransaction(id);
      addToast({
        type: 'info',
        title: 'Transaction Deleted',
      });
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) =>
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery]);

  // Helper to format subtitle: "Day 19 · 11 Oct"
  const formatSubtitle = (tx: Transaction) => {
    const d = new Date(tx.date || tx.createdAt);
    const dateFormatted = d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
    return `Day ${tx.dayOfPeriod} · ${dateFormatted}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
          Activity &amp; Expenses
        </h1>
        <p className="text-sm text-brand-muted mt-1">
          Log every rupee you spend or receive. Pure free-text tracking with zero assumptions.
        </p>
      </div>

      {/* Add Transaction Card Form */}
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 shadow-xs">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-serif text-xl font-bold text-brand-green">
              Log Transaction
            </h2>

            {/* Toggle Expense / Income */}
            <div className="inline-flex rounded-xl bg-[#FFF8EC] border border-[#EADFC8] p-1 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'expense'
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-green'
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  type === 'income'
                    ? 'bg-brand-green text-cream-bg shadow-xs'
                    : 'text-brand-muted hover:text-brand-green'
                }`}
              >
                Income
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            {/* Amount Input */}
            <div className="sm:col-span-4">
              <label htmlFor="amount-input" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-lg font-bold text-brand-green">
                  ₹
                </span>
                <input
                  id="amount-input"
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 540"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif text-lg font-bold text-brand-green outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 tabular-nums"
                />
              </div>
            </div>

            {/* Free-text field: "Where did you spend it?" */}
            <div className="sm:col-span-8">
              <label htmlFor="desc-input" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                {type === 'expense' ? 'Where did you spend it? *' : 'Where did this money come from? *'}
              </label>
              <input
                id="desc-input"
                type="text"
                required
                placeholder={type === 'expense' ? 'e.g. Zomato Biryani, Metro Card recharge, Chai with friends' : 'e.g. Freelance writing gig, Refund'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm text-brand-text outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-orange text-white font-semibold text-sm hover:bg-brand-orange-hover shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record {type === 'expense' ? 'Expense' : 'Income'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Transaction History & Search */}
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-green" />
            <h2 className="font-serif text-xl font-bold text-brand-green">
              Transaction Log ({transactions.length})
            </h2>
          </div>

          {/* Search Bar */}
          {transactions.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-brand-text outline-none focus:border-brand-orange"
              />
            </div>
          )}
        </div>

        {/* Transactions List */}
        {transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No activity recorded yet"
            description="You start with zero transactions. Log your first expense or income above to activate your daily runway calculation."
          />
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-sm text-brand-muted">
            No transactions match &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="divide-y divide-[#EADFC8]/60">
            {filteredTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isSavings = tx.type === 'savings_transfer';

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#FFF8EC]/40 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSavings
                          ? 'bg-purple-100 text-purple-700'
                          : isIncome
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-brand-orange'
                      }`}
                    >
                      {isSavings ? (
                        <PiggyBank className="w-5 h-5" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      {/* Exact title typed by user */}
                      <p className="font-semibold text-sm sm:text-base text-brand-green truncate leading-snug">
                        {tx.description}
                      </p>
                      {/* Subtitle: "Day 19 · 11 Oct" */}
                      <p className="text-xs text-brand-muted mt-0.5">
                        {formatSubtitle(tx)}
                        {isSavings && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Savings Transfer
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`font-serif text-base sm:text-lg font-bold tabular-nums ${
                        isIncome
                          ? 'text-emerald-700'
                          : isSavings
                          ? 'text-purple-700'
                          : 'text-brand-text'
                      }`}
                    >
                      {isIncome ? '+ ' : '- '}
                      {formatRupee(tx.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tx)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-brand-green hover:bg-[#FFF8EC] transition-colors"
                        aria-label="Edit transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tx.id, tx.description)}
                        className="p-1.5 rounded-lg text-brand-muted hover:text-red-700 hover:bg-red-50 transition-colors"
                        aria-label="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#EADFC8]">
              <h3 className="font-serif text-lg font-bold text-brand-green">
                Edit Transaction
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg text-brand-muted hover:text-brand-green"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={editAmountStr}
                  onChange={(e) => setEditAmountStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif font-bold text-lg text-brand-green outline-none tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm text-brand-text outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#EADFC8]">
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="px-4 py-2 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-green hover:bg-[#FFF8EC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-brand-green text-cream-bg text-xs font-semibold hover:bg-brand-green-light flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
