import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import {
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useBudgetStore } from '../store/budgetStore';
import { calculateFinancialMetrics, formatRupee } from '../lib/finance';
import { RiskBadge } from '../components/common/RiskBadge';
import { HealthDonut } from '../components/common/HealthDonut';

export const Dashboard: React.FC = () => {
  const user = useBudgetStore((state) => state.user);
  const settings = useBudgetStore((state) => state.settings);
  const transactions = useBudgetStore((state) => state.transactions);
  const commitments = useBudgetStore((state) => state.commitments);
  const subscriptions = useBudgetStore((state) => state.subscriptions);
  const goals = useBudgetStore((state) => state.goals);

  // Compute single source of truth finance metrics
  const metrics = useMemo(() => {
    return calculateFinancialMetrics({
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });
  }, [settings, transactions, commitments, subscriptions, goals]);

  // Real time of day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const firstName = useMemo(() => {
    if (!user?.displayName) return 'there';
    return user.displayName.split(' ')[0];
  }, [user]);

  // Runway chart point where money runs out
  const runOutPoint = useMemo(() => {
    if (!metrics.runOutDay) return null;
    return metrics.runwayTrajectory.find((p) => p.day === metrics.runOutDay) || null;
  }, [metrics.runOutDay, metrics.runwayTrajectory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green tracking-tight">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            Day {metrics.currentDay} of {settings.periodLength || 30} · Surpass the month with confidence
          </p>
        </div>

        <div className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF7] border border-[#EADFC8] text-xs font-semibold text-brand-green shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-brand-orange" />
          <span>{metrics.daysLeft} days remaining in cycle</span>
        </div>
      </div>

      {/* Grid Row 1: Hero Card + Financial Health Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Hero Card (Forest Green Dark Card) */}
        <div className="lg:col-span-7 bg-[#1F4D3A] text-[#FFF8EC] rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between border border-[#153629]">
          <div>
            <div className="flex items-center justify-between gap-3 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#DCEBDD]">
                Survival Balance · Day {metrics.currentDay} of {settings.periodLength || 30}
              </span>
              <RiskBadge level={metrics.riskLevel} variant="mint-pill" />
            </div>

            <div>
              <p className="text-xs font-medium text-[#DCEBDD] uppercase tracking-wide">
                Available to Spend
              </p>
              <div className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white mt-1 tabular-nums">
                {formatRupee(metrics.remainingBalance)}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#DCEBDD]">
                Starting Budget
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-white tabular-nums mt-0.5">
                {formatRupee(metrics.startingBudget)}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#DCEBDD]">
                Spent So Far
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#F28C28] tabular-nums mt-0.5">
                {formatRupee(metrics.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Health Card */}
        <div className="lg:col-span-5 bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">
              Financial Health
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FFF8EC] border border-[#EADFC8] text-brand-green">
              Real-time Analysis
            </span>
          </div>

          <div className="my-auto py-4">
            <HealthDonut health={metrics.health} size={150} strokeWidth={13} />
          </div>

          <div className="text-center pt-2 border-t border-[#EADFC8]/60">
            <p className="text-xs text-brand-muted leading-relaxed">
              Based on runway velocity, savings commitments, fixed bills &amp; month-end buffer.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Three Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Stat 1: Safe daily allowance */}
        <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Safe Daily Allowance
            </span>
            <div className="p-1.5 rounded-lg bg-[#DCEBDD] text-brand-green">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-green tabular-nums">
            {formatRupee(metrics.safeDailyAllowance)}
            <span className="text-sm font-sans font-normal text-brand-muted"> / day</span>
          </div>
          <p className="text-xs text-brand-muted mt-2">
            Remaining uncommitted cash spread over {metrics.daysLeft} days.
          </p>
        </div>

        {/* Stat 2: Month-end forecast */}
        <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Month-End Forecast
            </span>
            <div className="p-1.5 rounded-lg bg-orange-100 text-brand-orange">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            {metrics.hasEnoughForecastData ? (
              <div
                className={`font-serif text-2xl sm:text-3xl font-bold tabular-nums ${
                  metrics.monthEndForecast >= 0 ? 'text-brand-green' : 'text-red-700'
                }`}
              >
                {formatRupee(metrics.monthEndForecast)}
              </div>
            ) : (
              <div className="text-sm font-medium text-brand-muted">
                Add a few expenses to see your forecast
              </div>
            )}
          </div>
          <p className="text-xs text-brand-muted mt-2">
            {metrics.hasEnoughForecastData
              ? `Projected closing balance based on ₹${Math.round(metrics.averageDailySpend)}/day burn.`
              : 'Requires 3 days of recorded activity to extrapolate burn rate.'}
          </p>
        </div>

        {/* Stat 3: Protected commitments */}
        <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-brand-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              Protected Commitments
            </span>
            <div className="p-1.5 rounded-lg bg-[#DCEBDD] text-brand-green">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-brand-green tabular-nums">
            {formatRupee(metrics.upcomingCommitmentsTotal + metrics.upcomingSubscriptionsTotal)}
          </div>
          <p className="text-xs text-brand-muted mt-2">
            Reserved for {commitments.filter(c => !c.isPaid && !c.isPaused).length} bills &amp;{' '}
            {subscriptions.filter(s => !s.isPaused && !s.isCancelled).length} active subscriptions due soon.
          </p>
        </div>
      </div>

      {/* Grid Row 3: Runway Forecast Chart */}
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-green">
              30-Day Runway Trajectory
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted mt-0.5">
              Solid line: actual balance · Dashed line: projected burn with scheduled obligations
            </p>
          </div>

          {/* Badge: "Runs out day X" or "You'll make it with ₹X to spare" */}
          <div>
            {metrics.runOutDay ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Runs out day {metrics.runOutDay}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>You&apos;ll make it with {formatRupee(metrics.spareAtMonthEnd)} to spare</span>
              </span>
            )}
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics.runwayTrajectory}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                tickFormatter={(d) => `D${d}`}
                stroke="#6B7A70"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7A70"
                fontSize={12}
                tickLine={false}
                tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    const val = data.actualBalance ?? data.projectedBalance ?? 0;
                    return (
                      <div className="bg-[#1F4D3A] text-white px-3 py-1.5 rounded-xl shadow-lg border border-[#153629] text-xs">
                        <span className="font-semibold">{data.dateStr || `Day ${data.day}`}</span>
                        <span className="mx-1.5 text-[#DCEBDD]">·</span>
                        <span className="font-bold tabular-nums text-white">{formatRupee(val)}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Actual Line: solid */}
              <Line
                type="monotone"
                dataKey="actualBalance"
                stroke="#1F4D3A"
                strokeWidth={3}
                dot={{ r: 3, fill: '#1F4D3A' }}
                activeDot={{ r: 6, fill: '#F28C28' }}
                connectNulls={false}
              />
              {/* Projected Line: dashed */}
              <Line
                type="monotone"
                dataKey="projectedBalance"
                stroke="#F28C28"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 5, fill: '#F28C28' }}
                connectNulls={false}
              />
              {/* Marker where money runs out */}
              {runOutPoint && (
                <ReferenceDot
                  x={runOutPoint.day}
                  y={0}
                  r={7}
                  fill="#DC2626"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Row 4: Real-Number Driven Insights */}
      <div className="bg-[#FFFDF7] border border-[#EADFC8] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-brand-orange" />
          <h2 className="font-serif text-lg sm:text-xl font-bold text-brand-green">
            Survival Insights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.riskReasons.map((reason, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#EADFC8] flex items-start gap-3"
            >
              <div className="w-2 h-2 rounded-full bg-brand-orange mt-1.5 shrink-0" />
              <p className="text-xs sm:text-sm text-brand-text leading-relaxed">
                {reason}
              </p>
            </div>
          ))}

          {/* Contextual advice */}
          <div className="p-4 rounded-2xl bg-[#FFF8EC] border border-[#EADFC8] flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-green mt-1.5 shrink-0" />
            <p className="text-xs sm:text-sm text-brand-text leading-relaxed">
              {metrics.safeDailyAllowance > 300
                ? `You have a comfortable daily buffer of ${formatRupee(metrics.safeDailyAllowance)}. Consider allocating a slice to your savings goals.`
                : `Aim to cap discretionary spending below ${formatRupee(metrics.safeDailyAllowance)} today to safeguard upcoming fixed bills.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
