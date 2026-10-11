import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Tv,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useBudgetStore } from '../store/budgetStore';
import { simulateDecision, formatRupee } from '../lib/finance';
import { RiskBadge } from '../components/common/RiskBadge';
import type { SimulationResult } from '../types';

export const WhatIfLab: React.FC = () => {
  const settings = useBudgetStore((state) => state.settings);
  const transactions = useBudgetStore((state) => state.transactions);
  const commitments = useBudgetStore((state) => state.commitments);
  const subscriptions = useBudgetStore((state) => state.subscriptions);
  const goals = useBudgetStore((state) => state.goals);

  const addTransaction = useBudgetStore((state) => state.addTransaction);
  const toggleSubscriptionCancelled = useBudgetStore(
    (state) => state.toggleSubscriptionCancelled
  );
  const contributeToGoal = useBudgetStore((state) => state.contributeToGoal);
  const addToast = useBudgetStore((state) => state.addToast);

  // Simulation Form State - strictly empty inputs, no preset cards or default values
  const [decisionType, setDecisionType] = useState<
    'spend' | 'save' | 'income' | 'cancel_subscription'
  >('spend');
  const [description, setDescription] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  // Available active subscriptions for cancellation selector
  const activeSubs = useMemo(() => {
    return subscriptions.filter((s) => !s.isCancelled);
  }, [subscriptions]);

  // Numeric amount
  const parsedAmount = useMemo(() => {
    if (decisionType === 'cancel_subscription') {
      const sub = subscriptions.find((s) => s.id === selectedSubId);
      return sub ? sub.amount : 0;
    }
    const val = parseFloat(amountStr);
    return isNaN(val) || val <= 0 ? 0 : val;
  }, [amountStr, decisionType, selectedSubId, subscriptions]);

  const isValidInput = useMemo(() => {
    if (decisionType === 'cancel_subscription') {
      return Boolean(selectedSubId);
    }
    return parsedAmount > 0;
  }, [decisionType, selectedSubId, parsedAmount]);

  // Run simulation pure function
  const simulation: SimulationResult | null = useMemo(() => {
    if (!isValidInput) return null;

    return simulateDecision({
      type: decisionType,
      amount: parsedAmount,
      description: description.trim(),
      cancelledSubscriptionId: decisionType === 'cancel_subscription' ? selectedSubId : undefined,
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });
  }, [
    isValidInput,
    decisionType,
    parsedAmount,
    description,
    selectedSubId,
    settings,
    transactions,
    commitments,
    subscriptions,
    goals,
  ]);

  // Handle "Do it" -> Commits a real transaction
  const handleDoIt = async () => {
    if (!simulation) return;

    try {
      const now = new Date();
      if (decisionType === 'spend') {
        await addTransaction({
          type: 'expense',
          amount: parsedAmount,
          description: description.trim() || 'What-If Executed Spend',
          date: now.toISOString(),
          dayOfPeriod: simulation.beforeMetrics.currentDay,
        });
        addToast({
          type: 'success',
          title: 'Spend Executed!',
          description: `Logged ${formatRupee(parsedAmount)} for "${description || 'Spend'}".`,
        });
      } else if (decisionType === 'income') {
        await addTransaction({
          type: 'income',
          amount: parsedAmount,
          description: description.trim() || 'What-If Executed Income',
          date: now.toISOString(),
          dayOfPeriod: simulation.beforeMetrics.currentDay,
        });
        addToast({
          type: 'success',
          title: 'Income Executed!',
          description: `Added ${formatRupee(parsedAmount)} to balance.`,
        });
      } else if (decisionType === 'save') {
        if (goals.length > 0) {
          await contributeToGoal(goals[0].id, parsedAmount, description.trim() || 'What-If Goal Savings');
        } else {
          await addTransaction({
            type: 'savings_transfer',
            amount: parsedAmount,
            description: description.trim() || 'General Savings Transfer',
            date: now.toISOString(),
            dayOfPeriod: simulation.beforeMetrics.currentDay,
          });
        }
        addToast({
          type: 'success',
          title: 'Savings Executed!',
          description: `Transferred ${formatRupee(parsedAmount)} into savings.`,
        });
      } else if (decisionType === 'cancel_subscription' && selectedSubId) {
        await toggleSubscriptionCancelled(selectedSubId);
        const sub = subscriptions.find((s) => s.id === selectedSubId);
        addToast({
          type: 'info',
          title: 'Subscription Cancelled',
          description: `Cancelled "${sub?.name}". Monthly recurring load removed.`,
        });
      }

      handleClear();
    } catch (err) {
      console.error(err);
      addToast({
        type: 'error',
        title: 'Execution Failed',
      });
    }
  };

  // Handle "Don't do it" -> Clears inputs
  const handleClear = () => {
    setDescription('');
    setAmountStr('');
    setSelectedSubId('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
          What-If Lab
        </h1>
        {/* Intro */}
        <p className="text-sm text-brand-muted mt-1">
          Planning a spend? See how it changes your month before you do it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Simulation Input Card */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-orange" />
            <h2 className="font-serif text-xl font-bold text-brand-green">
              Test a Decision
            </h2>
          </div>

          {/* Type Toggle: Spend / Save / Income / Cancel Subscription */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
              Decision Type
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#FFF8EC] border border-[#EADFC8]">
              <button
                type="button"
                onClick={() => setDecisionType('spend')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  decisionType === 'spend'
                    ? 'bg-brand-orange text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-green'
                }`}
              >
                Spend
              </button>
              <button
                type="button"
                onClick={() => setDecisionType('save')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  decisionType === 'save'
                    ? 'bg-brand-green text-cream-bg shadow-xs'
                    : 'text-brand-muted hover:text-brand-green'
                }`}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setDecisionType('income')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  decisionType === 'income'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-brand-muted hover:text-brand-green'
                }`}
              >
                Income
              </button>
            </div>

            {/* Cancel Subscription Selector (hidden if none exist) */}
            {activeSubs.length > 0 && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setDecisionType('cancel_subscription')}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    decisionType === 'cancel_subscription'
                      ? 'bg-brand-green text-cream-bg border-brand-green shadow-xs'
                      : 'bg-[#FFF8EC] text-brand-text border-[#EADFC8] hover:bg-[#F5ECD7]'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Cancel one of my subscriptions</span>
                </button>
              </div>
            )}
          </div>

          {/* If cancelling subscription */}
          {decisionType === 'cancel_subscription' ? (
            <div>
              <label htmlFor="sub-select" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                Select Subscription to Cancel
              </label>
              <select
                id="sub-select"
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm font-semibold text-brand-green outline-none"
              >
                <option value="">-- Choose subscription --</option>
                {activeSubs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatRupee(s.amount)}/month)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              {/* Empty Input: "What are you thinking of?" */}
              <div>
                <label htmlFor="what-input" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                  What are you thinking of? *
                </label>
                <input
                  id="what-input"
                  type="text"
                  placeholder="e.g. Weekend getaway, buying sneakers, gig bonus"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] text-sm text-brand-text outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label htmlFor="sim-amount" className="block text-xs font-bold uppercase tracking-wider text-brand-muted mb-2">
                  Amount (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-lg font-bold text-brand-green">
                    ₹
                  </span>
                  <input
                    id="sim-amount"
                    type="number"
                    step="any"
                    min="1"
                    placeholder="e.g. 1500"
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] font-serif text-xl font-bold text-brand-green outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 tabular-nums"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Buttons: Do it and Don't do it */}
          <div className="pt-3 border-t border-[#EADFC8] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#EADFC8] text-xs font-semibold text-brand-muted hover:text-brand-green hover:bg-[#FFF8EC] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Don&apos;t do it</span>
            </button>

            <button
              type="button"
              disabled={!isValidInput}
              onClick={handleDoIt}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-orange text-white text-xs font-bold hover:bg-brand-orange-hover shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Do it (Commit)</span>
            </button>
          </div>
        </div>

        {/* Live Preview (Dark Green Card) */}
        <div className="lg:col-span-7 bg-[#1F4D3A] text-[#FFF8EC] rounded-3xl p-6 sm:p-7 shadow-xl border border-[#153629] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCEBDD]">
                Live Impact Preview
              </span>
            </div>
            {simulation && (
              <RiskBadge level={simulation.afterMetrics.riskLevel} variant="mint-pill" />
            )}
          </div>

          {!simulation ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <HelpCircle className="w-12 h-12 text-[#DCEBDD]/60 mb-3" />
              <h3 className="font-serif text-lg font-bold text-white">
                Waiting for your inputs
              </h3>
              <p className="text-xs text-[#DCEBDD]/80 max-w-sm mt-1 leading-relaxed">
                Type an amount and description on the left. The live engine will compute BEFORE vs AFTER metrics instantaneously.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* Plain-language insight sentence */}
              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-xs sm:text-sm font-medium text-white leading-relaxed">
                💡 {simulation.plainLanguageInsight}
              </div>

              {/* BEFORE vs AFTER Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Balance */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-[#DCEBDD] text-[10px] uppercase font-bold tracking-wider">
                    Balance
                  </span>
                  <div className="my-1">
                    <div className="text-white font-serif text-base sm:text-lg font-bold tabular-nums">
                      {formatRupee(simulation.afterMetrics.remainingBalance)}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-bold tabular-nums ${
                      simulation.balanceDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {simulation.balanceDelta >= 0 ? '+' : ''}
                    {formatRupee(simulation.balanceDelta)}
                  </div>
                </div>

                {/* 2. Daily Allowance */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-[#DCEBDD] text-[10px] uppercase font-bold tracking-wider">
                    Daily Allowance
                  </span>
                  <div className="my-1">
                    <div className="text-white font-serif text-base sm:text-lg font-bold tabular-nums">
                      {formatRupee(simulation.afterMetrics.safeDailyAllowance)}/d
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-bold tabular-nums ${
                      simulation.dailyAllowanceDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {simulation.dailyAllowanceDelta >= 0 ? '+' : ''}
                    {formatRupee(simulation.dailyAllowanceDelta)}/d
                  </div>
                </div>

                {/* 3. Month-End Forecast */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-[#DCEBDD] text-[10px] uppercase font-bold tracking-wider">
                    Forecast
                  </span>
                  <div className="my-1">
                    <div className="text-white font-serif text-base sm:text-lg font-bold tabular-nums">
                      {formatRupee(simulation.afterMetrics.monthEndForecast)}
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-bold tabular-nums ${
                      simulation.forecastDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {simulation.forecastDelta >= 0 ? '+' : ''}
                    {formatRupee(simulation.forecastDelta)}
                  </div>
                </div>

                {/* 4. Health Score (Displayed as "47 pts", NO ₹ sign!) */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-[#DCEBDD] text-[10px] uppercase font-bold tracking-wider">
                    Health Score
                  </span>
                  <div className="my-1">
                    <div className="text-white font-serif text-base sm:text-lg font-bold tabular-nums">
                      {simulation.afterMetrics.health.score} pts
                    </div>
                  </div>
                  <div
                    className={`text-[11px] font-bold tabular-nums ${
                      simulation.healthScoreDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {simulation.healthScoreDelta >= 0 ? '+' : ''}
                    {simulation.healthScoreDelta} pts
                  </div>
                </div>
              </div>

              {/* Side-by-side / overlay trajectory chart */}
              <div>
                <div className="flex items-center justify-between text-xs text-[#DCEBDD] mb-2 font-medium">
                  <span>Current Path (White) vs Simulated Path (Orange)</span>
                  <span className="text-[11px]">
                    {simulation.afterMetrics.runOutDay
                      ? `Simulated runs out Day ${simulation.afterMetrics.runOutDay}`
                      : 'Simulated survives month-end'}
                  </span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simulation.projectedRunwayComparison}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="day"
                        tickFormatter={(d) => `D${d}`}
                        stroke="#DCEBDD"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#DCEBDD"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length > 0) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-[#153629] text-white p-2 rounded-xl text-xs border border-white/20">
                                <p className="font-bold">Day {d.day}</p>
                                <p className="text-white">Current: {formatRupee(d.currentPath)}</p>
                                <p className="text-brand-orange font-bold">Simulated: {formatRupee(d.simulatedPath)}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="currentPath"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="simulatedPath"
                        stroke="#F28C28"
                        strokeWidth={2.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Effect on Goals */}
              {goals.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] uppercase tracking-wider text-[#DCEBDD] font-bold block mb-2">
                    Effect on Active Goals
                  </span>
                  <div className="space-y-1.5">
                    {goals.map((g) => (
                      <div
                        key={g.id}
                        className="text-xs flex items-center justify-between text-white/90 bg-white/5 px-3 py-1.5 rounded-xl"
                      >
                        <span>{g.name}</span>
                        <span className="tabular-nums font-semibold">
                          {decisionType === 'save'
                            ? `${formatRupee(g.currentAmount)} → ${formatRupee(g.currentAmount + parsedAmount)}`
                            : `${formatRupee(g.currentAmount)} (Unchanged)`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
