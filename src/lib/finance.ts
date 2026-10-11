import type {
  Transaction,
  Commitment,
  Subscription,
  Goal,
  UserBudgetSettings,
  FinancialMetrics,
  RiskLevel,
  FinancialHealth,
  HealthFactorBreakdown,
  RunwayDayPoint,
  GoalContributionReview,
  SimulationResult,
} from '../types';

/**
 * Calculates current day in the active budget period (1..periodLength)
 */
export function calculateCurrentDay(periodStartDate: string, periodLength: number = 30, now: Date = new Date()): number {
  if (!periodStartDate) return 1;
  const start = new Date(periodStartDate);
  start.setHours(0, 0, 0, 0);
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);

  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays < 1) return 1;
  if (diffDays > periodLength) return periodLength;
  return diffDays;
}

/**
 * Calculates remaining balance:
 * remainingBalance = startingBudget + income − expenses − net savings transfers.
 * It is calculated, never stored.
 */
export function calculateRemainingBalance(
  startingBudget: number,
  transactions: Transaction[]
): {
  remainingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavingsTransfers: number;
} {
  let totalIncome = 0;
  let totalExpenses = 0;
  let netSavingsTransfers = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpenses += t.amount;
    } else if (t.type === 'savings_transfer') {
      netSavingsTransfers += t.amount;
    }
  }

  const remainingBalance = startingBudget + totalIncome - totalExpenses - netSavingsTransfers;

  return {
    remainingBalance,
    totalIncome,
    totalExpenses,
    netSavingsTransfers,
  };
}

/**
 * Safe daily allowance = (balance − upcoming commitments − subscriptions due − planned goal contributions) / daysLeft.
 */
export function calculateSafeDailyAllowance(
  balance: number,
  upcomingCommitments: number,
  upcomingSubscriptions: number,
  plannedGoalContributions: number,
  daysLeft: number
): number {
  const divisor = Math.max(1, daysLeft);
  const freeFunds = balance - upcomingCommitments - upcomingSubscriptions - plannedGoalContributions;
  const allowance = Math.floor(freeFunds / divisor);
  return allowance;
}

/**
 * Month-end forecast = balance − (average daily spend × daysLeft) − upcoming commitments.
 */
export function calculateMonthEndForecast(
  balance: number,
  averageDailySpend: number,
  daysLeft: number,
  upcomingCommitmentsTotal: number
): number {
  return Math.round(balance - (averageDailySpend * daysLeft) - upcomingCommitmentsTotal);
}

/**
 * Determines financial health score (0-100) and factor breakdowns.
 * Five factors: Runway, Savings Progress, Wants vs Needs, Subscription Load, Buffer.
 */
export function calculateFinancialHealth(params: {
  startingBudget: number;
  remainingBalance: number;
  currentDay: number;
  daysLeft: number;
  averageDailySpend: number;
  totalExpenses: number;
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
  safeDailyAllowance: number;
  monthEndForecast: number;
}): FinancialHealth {
  const {
    startingBudget,
    remainingBalance,
    daysLeft,
    averageDailySpend,
    commitments,
    subscriptions,
    goals,
    safeDailyAllowance,
    monthEndForecast,
  } = params;

  // 1. Runway Factor (0..20)
  let runwayScore = 20;
  let runwayDesc = 'Full month covered';
  if (averageDailySpend > 0) {
    const daysOfRunway = Math.floor(remainingBalance / averageDailySpend);
    if (daysOfRunway < daysLeft) {
      const ratio = Math.max(0, daysOfRunway / Math.max(1, daysLeft));
      runwayScore = Math.round(ratio * 20);
      runwayDesc = `${daysOfRunway} days of runway left for ${daysLeft} days`;
    } else {
      runwayScore = 20;
      runwayDesc = `${daysOfRunway} days runway covers month-end`;
    }
  } else if (remainingBalance <= 0) {
    runwayScore = 0;
    runwayDesc = 'Balance depleted';
  }

  // 2. Savings Progress (0..20)
  let savingsScore = 10;
  let savingsDesc = 'No active savings goals';
  if (goals.length > 0) {
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    if (totalTarget > 0) {
      const pct = Math.min(1, Math.max(0, totalSaved / totalTarget));
      savingsScore = Math.round(pct * 20);
      savingsDesc = `${Math.round(pct * 100)}% of goal targets achieved`;
    }
  } else if (remainingBalance < (startingBudget * 0.2)) {
    // If balance is severely low and no savings goals exist, zero savings cushion
    savingsScore = 2;
    savingsDesc = 'No emergency savings cushion';
  }

  // 3. Wants vs Needs (0..20)
  // Essential commitments vs total starting budget
  const activeCommitments = commitments.filter(c => !c.isPaused).reduce((s, c) => s + c.amount, 0);
  const commitmentRatio = startingBudget > 0 ? (activeCommitments / startingBudget) : 0;
  let wantsNeedsScore = 18;
  let wantsNeedsDesc = `${Math.round(commitmentRatio * 100)}% committed to fixed needs`;

  if (monthEndForecast < 0 && Math.abs(monthEndForecast) > startingBudget * 0.5) {
    wantsNeedsScore = 4;
    wantsNeedsDesc = `Critical deficit: obligations exceed feasible income`;
  } else if (commitmentRatio > 0.8) {
    wantsNeedsScore = 5;
    wantsNeedsDesc = `Heavy load: ${Math.round(commitmentRatio * 100)}% locked in needs`;
  } else if (commitmentRatio > 0.6) {
    wantsNeedsScore = 11;
  } else if (commitmentRatio > 0.2) {
    wantsNeedsScore = 20;
  } else {
    wantsNeedsScore = 15;
  }

  // 4. Subscription Load (0..20)
  const activeSubs = subscriptions.filter(s => !s.isPaused && !s.isCancelled).reduce((s, sub) => s + sub.amount, 0);
  const subRatio = startingBudget > 0 ? (activeSubs / startingBudget) : 0;
  let subScore = 20;
  let subDesc = `₹${activeSubs}/mo (${Math.round(subRatio * 100)}% of budget)`;

  if (monthEndForecast < 0 && activeSubs > 500) {
    subScore = 4;
    subDesc = `₹${activeSubs}/mo subscriptions aggravate month-end deficit`;
  } else if (subRatio > 0.3) {
    subScore = 4;
    subDesc = `High load: ${Math.round(subRatio * 100)}% spent on subscriptions`;
  } else if (subRatio > 0.2) {
    subScore = 9;
  } else if (subRatio > 0.1) {
    subScore = 15;
  } else {
    subScore = 20;
  }

  // 5. Buffer & Safe Allowance (0..20)
  let bufferScore = 14;
  let bufferDesc = `Daily allowance ₹${safeDailyAllowance}`;
  if (remainingBalance <= 0 || safeDailyAllowance <= 0 || monthEndForecast < 0) {
    bufferScore = 0;
    bufferDesc = monthEndForecast < 0
      ? `Deficit forecast of -₹${Math.abs(monthEndForecast)}`
      : 'Zero spending buffer remaining';
  } else if (monthEndForecast >= startingBudget * 0.2) {
    bufferScore = 20;
    bufferDesc = `Healthy surplus forecast of ₹${monthEndForecast}`;
  } else {
    bufferScore = 12;
    bufferDesc = `Positive forecast with ₹${monthEndForecast} spare`;
  }

  const rawTotal = runwayScore + savingsScore + wantsNeedsScore + subScore + bufferScore;
  const score = Math.max(0, Math.min(100, rawTotal));

  let band: 'Strong' | 'Okay' | 'Shaky' | 'Critical';
  if (score >= 80) band = 'Strong';
  else if (score >= 60) band = 'Okay';
  else if (score >= 40) band = 'Shaky';
  else band = 'Critical';

  const factors: HealthFactorBreakdown[] = [
    {
      name: 'Runway & Velocity',
      score: runwayScore,
      maxScore: 20,
      userValueDescription: runwayDesc,
      explanation: 'Evaluates if your available funds will sustain your current daily burn rate until month-end.',
    },
    {
      name: 'Savings & Goals',
      score: savingsScore,
      maxScore: 20,
      userValueDescription: savingsDesc,
      explanation: 'Tracks meaningful progress towards your rainy day fund and savings milestones.',
    },
    {
      name: 'Needs vs Wants',
      score: wantsNeedsScore,
      maxScore: 20,
      userValueDescription: wantsNeedsDesc,
      explanation: 'Measures your non-negotiable rent/bills ratio compared to your flexible living allowance.',
    },
    {
      name: 'Subscription Weight',
      score: subScore,
      maxScore: 20,
      userValueDescription: subDesc,
      explanation: 'Checks recurring digital leaks and membership loads against total monthly budget.',
    },
    {
      name: 'Month-End Buffer',
      score: bufferScore,
      maxScore: 20,
      userValueDescription: bufferDesc,
      explanation: 'Verifies whether your safe daily allowance protects you from hitting zero before next payday.',
    },
  ];

  return {
    score,
    band,
    factors,
  };
}

/**
 * Calculates complete financial metrics for the active period.
 */
export function calculateFinancialMetrics(params: {
  settings: UserBudgetSettings;
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
  asOfDate?: Date;
}): FinancialMetrics {
  const { settings, transactions, commitments, subscriptions, goals, asOfDate = new Date() } = params;

  const startingBudget = settings.startingBudget || 0;
  const periodLength = settings.periodLength || 30;
  const currentDay = calculateCurrentDay(settings.periodStartDate, periodLength, asOfDate);
  const daysLeft = periodLength - currentDay;

  const { remainingBalance, totalIncome, totalExpenses, netSavingsTransfers } =
    calculateRemainingBalance(startingBudget, transactions);

  // Filter upcoming commitments (dueDay >= currentDay and not paid and not paused)
  const upcomingCommitmentsList = commitments.filter(
    c => !c.isPaused && !c.isPaid && c.dueDay >= currentDay
  );
  const upcomingCommitmentsTotal = upcomingCommitmentsList.reduce((s, c) => s + c.amount, 0);

  // Subscriptions due (dueDay >= currentDay and not paused and not cancelled)
  const upcomingSubscriptionsList = subscriptions.filter(
    s => !s.isPaused && !s.isCancelled && s.dueDay >= currentDay
  );
  const upcomingSubscriptionsTotal = upcomingSubscriptionsList.reduce((s, sItem) => s + sItem.amount, 0);

  const plannedGoalContributions = 0; // Handled dynamically

  const safeDailyAllowance = calculateSafeDailyAllowance(
    remainingBalance,
    upcomingCommitmentsTotal,
    upcomingSubscriptionsTotal,
    plannedGoalContributions,
    daysLeft
  );

  // Daily spend velocity
  // Count transactions and distinct days with expenses
  const expenseDays = new Set(
    transactions.filter(t => t.type === 'expense').map(t => t.dayOfPeriod)
  );
  const hasEnoughForecastData = expenseDays.size >= 3 || transactions.filter(t => t.type === 'expense').length >= 3;

  const averageDailySpend = currentDay > 0 ? (totalExpenses / currentDay) : 0;

  const monthEndForecast = calculateMonthEndForecast(
    remainingBalance,
    averageDailySpend,
    daysLeft,
    upcomingCommitmentsTotal
  );

  // Calculate Run-out Day and Runway Trajectory
  let runOutDay: number | null = null;
  const runwayTrajectory: RunwayDayPoint[] = [];

  // Reconstruct historical actual balances day-by-day
  // Group transactions by day
  const txByDay = new Map<number, number>();
  for (const t of transactions) {
    const netDelta = t.type === 'income' ? t.amount : -t.amount;
    txByDay.set(t.dayOfPeriod, (txByDay.get(t.dayOfPeriod) || 0) + netDelta);
  }

  let runningActualBalance = startingBudget;
  const startDate = new Date(settings.periodStartDate || new Date());

  for (let day = 1; day <= periodLength; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + (day - 1));
    const dateStr = dayDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    if (day <= currentDay) {
      runningActualBalance += txByDay.get(day) || 0;
      runwayTrajectory.push({
        day,
        dateStr,
        actualBalance: Math.round(runningActualBalance),
      });
    } else {
      // Future projection starting from current balance
      // Projected daily decrement is averageDailySpend + any commitments on this day
      const dayOffsetFromCurrent = day - currentDay;
      const commitmentsOnThisDay = commitments
        .filter(c => !c.isPaused && !c.isPaid && c.dueDay === day)
        .reduce((sum, c) => sum + c.amount, 0);
      const subsOnThisDay = subscriptions
        .filter(s => !s.isPaused && !s.isCancelled && s.dueDay === day)
        .reduce((sum, s) => sum + s.amount, 0);

      // Linear burn projection
      const projected = Math.round(
        remainingBalance - (averageDailySpend * dayOffsetFromCurrent) - commitmentsOnThisDay - subsOnThisDay
      );

      if (projected <= 0 && runOutDay === null) {
        runOutDay = day;
      }

      runwayTrajectory.push({
        day,
        dateStr,
        projectedBalance: projected,
        isRunOutDay: day === runOutDay,
      });
    }
  }

  // Connect currentDay point to projection line
  const currentPoint = runwayTrajectory.find(p => p.day === currentDay);
  if (currentPoint) {
    currentPoint.projectedBalance = currentPoint.actualBalance;
  }

  // Risk Level determination
  const riskReasons: string[] = [];
  let riskLevel: RiskLevel = 'Low';

  if (remainingBalance <= 0) {
    riskLevel = 'Critical';
    riskReasons.push('Your balance has hit ₹0. Essential survival actions required.');
  } else if (runOutDay !== null && runOutDay <= currentDay + 3) {
    riskLevel = 'Critical';
    riskReasons.push(`At current spend velocity, money runs out in ${runOutDay - currentDay} days (Day ${runOutDay}).`);
  } else if (runOutDay !== null && runOutDay <= periodLength) {
    riskLevel = 'High';
    riskReasons.push(`Projected to run out on Day ${runOutDay} before month-end.`);
  } else if (monthEndForecast < 0) {
    riskLevel = 'High';
    riskReasons.push(`Month-end forecast shows a deficit of -₹${Math.abs(monthEndForecast)}.`);
  } else if (safeDailyAllowance < 150) {
    riskLevel = 'Medium';
    riskReasons.push(`Safe daily allowance is tight at ₹${safeDailyAllowance}/day.`);
  } else {
    riskLevel = 'Low';
    riskReasons.push('Your spending velocity is within safe limits for month-end survival.');
  }

  if (upcomingCommitmentsTotal > remainingBalance * 0.5) {
    riskReasons.push(`Upcoming commitments (₹${upcomingCommitmentsTotal}) require over 50% of remaining balance.`);
  }

  const spareAtMonthEnd = Math.max(0, monthEndForecast);

  const health = calculateFinancialHealth({
    startingBudget,
    remainingBalance,
    currentDay,
    daysLeft,
    averageDailySpend,
    totalExpenses,
    commitments,
    subscriptions,
    goals,
    safeDailyAllowance,
    monthEndForecast,
  });

  return {
    startingBudget,
    totalIncome,
    totalExpenses,
    netSavingsTransfers,
    remainingBalance,
    currentDay,
    daysLeft,
    upcomingCommitmentsTotal,
    upcomingSubscriptionsTotal,
    safeDailyAllowance,
    averageDailySpend,
    hasEnoughForecastData,
    monthEndForecast,
    runOutDay,
    spareAtMonthEnd,
    riskLevel,
    riskReasons,
    health,
    runwayTrajectory,
  };
}

/**
 * Reviews a proposed goal contribution against the financial engine.
 */
export function reviewGoalContribution(params: {
  goal: Goal;
  contributionAmount: number;
  currentMetrics: FinancialMetrics;
}): GoalContributionReview {
  const { goal, contributionAmount, currentMetrics } = params;

  const balanceNow = currentMetrics.remainingBalance;
  const balanceAfter = balanceNow - contributionAmount;
  const remainingObligations = currentMetrics.upcomingCommitmentsTotal + currentMetrics.upcomingSubscriptionsTotal;

  const daysLeft = Math.max(1, currentMetrics.daysLeft);
  const safeDailyAllowanceBefore = currentMetrics.safeDailyAllowance;
  const safeDailyAllowanceAfter = Math.floor((balanceAfter - remainingObligations) / daysLeft);

  let verdict: 'Safe' | 'Tight' | 'Critical';
  let verdictExplanation: string;
  let requiresExtraConfirmation = false;

  if (contributionAmount > balanceNow) {
    verdict = 'Critical';
    verdictExplanation = `Amount exceeds your available balance of ₹${balanceNow.toLocaleString('en-IN')}.`;
    requiresExtraConfirmation = true;
  } else if (balanceAfter < remainingObligations) {
    verdict = 'Critical';
    verdictExplanation = `Not enough for the rest of the month! Leaves ₹${balanceAfter.toLocaleString('en-IN')}, but you have ₹${remainingObligations.toLocaleString('en-IN')} in due commitments.`;
    requiresExtraConfirmation = true;
  } else if (safeDailyAllowanceAfter < 150) {
    verdict = 'Tight';
    verdictExplanation = `Leaves your safe daily allowance tight at ₹${safeDailyAllowanceAfter}/day for the remaining ${daysLeft} days.`;
    requiresExtraConfirmation = false;
  } else {
    verdict = 'Safe';
    verdictExplanation = `Healthy transfer! Leaves ₹${safeDailyAllowanceAfter}/day safe allowance with all obligations protected.`;
    requiresExtraConfirmation = false;
  }

  return {
    goalId: goal.id,
    goalName: goal.name,
    contributionAmount,
    balanceNow,
    balanceAfter,
    remainingObligations,
    safeDailyAllowanceBefore,
    safeDailyAllowanceAfter,
    verdict,
    verdictExplanation,
    requiresExtraConfirmation,
  };
}

/**
 * Simulates a "What-If" decision (Spend, Save, Income, or Cancel Subscription)
 * without touching real data.
 */
export function simulateDecision(params: {
  type: 'spend' | 'save' | 'income' | 'cancel_subscription';
  amount: number;
  description: string;
  cancelledSubscriptionId?: string;
  settings: UserBudgetSettings;
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
}): SimulationResult {
  const {
    type,
    amount,
    description,
    cancelledSubscriptionId,
    settings,
    transactions,
    commitments,
    subscriptions,
    goals,
  } = params;

  const beforeMetrics = calculateFinancialMetrics({
    settings,
    transactions,
    commitments,
    subscriptions,
    goals,
  });

  // Create simulated clones
  const simulatedTransactions: Transaction[] = [...transactions];
  let simulatedSubscriptions: Subscription[] = [...subscriptions];
  const simulatedGoals: Goal[] = goals.map(g => ({ ...g }));

  if (type === 'spend' && amount > 0) {
    simulatedTransactions.push({
      id: 'sim_spend',
      type: 'expense',
      amount,
      description: description || 'Simulated Spend',
      date: new Date().toISOString(),
      dayOfPeriod: beforeMetrics.currentDay,
      createdAt: new Date().toISOString(),
    });
  } else if (type === 'income' && amount > 0) {
    simulatedTransactions.push({
      id: 'sim_income',
      type: 'income',
      amount,
      description: description || 'Simulated Income',
      date: new Date().toISOString(),
      dayOfPeriod: beforeMetrics.currentDay,
      createdAt: new Date().toISOString(),
    });
  } else if (type === 'save' && amount > 0) {
    simulatedTransactions.push({
      id: 'sim_save',
      type: 'savings_transfer',
      amount,
      description: description || 'Simulated Goal Contribution',
      date: new Date().toISOString(),
      dayOfPeriod: beforeMetrics.currentDay,
      createdAt: new Date().toISOString(),
    });
    if (simulatedGoals.length > 0) {
      simulatedGoals[0].currentAmount += amount;
    }
  } else if (type === 'cancel_subscription' && cancelledSubscriptionId) {
    simulatedSubscriptions = subscriptions.map(s =>
      s.id === cancelledSubscriptionId ? { ...s, isCancelled: true } : s
    );
  }

  const afterMetrics = calculateFinancialMetrics({
    settings,
    transactions: simulatedTransactions,
    commitments,
    subscriptions: simulatedSubscriptions,
    goals: simulatedGoals,
  });

  const balanceDelta = afterMetrics.remainingBalance - beforeMetrics.remainingBalance;
  const dailyAllowanceDelta = afterMetrics.safeDailyAllowance - beforeMetrics.safeDailyAllowance;
  const forecastDelta = afterMetrics.monthEndForecast - beforeMetrics.monthEndForecast;
  const healthScoreDelta = afterMetrics.health.score - beforeMetrics.health.score;

  // Plain-language insight sentence
  let plainLanguageInsight = '';
  if (type === 'spend') {
    if (afterMetrics.safeDailyAllowance < 0) {
      plainLanguageInsight = `This purchase will push you into deficit and wipe out your month-end allowance.`;
    } else if (dailyAllowanceDelta < 0) {
      plainLanguageInsight = `Spending ₹${amount.toLocaleString('en-IN')} reduces your daily allowance by ₹${Math.abs(dailyAllowanceDelta)}/day for the next ${beforeMetrics.daysLeft} days.`;
    } else {
      plainLanguageInsight = `This expense can be accommodated within your available budget.`;
    }
  } else if (type === 'save') {
    plainLanguageInsight = `Allocating ₹${amount.toLocaleString('en-IN')} boosts your savings health score while lowering daily flexible spend by ₹${Math.abs(dailyAllowanceDelta)}/day.`;
  } else if (type === 'income') {
    plainLanguageInsight = `Adding ₹${amount.toLocaleString('en-IN')} expands your daily runway by +₹${dailyAllowanceDelta}/day and improves your month-end forecast by +₹${forecastDelta.toLocaleString('en-IN')}.`;
  } else if (type === 'cancel_subscription') {
    const cancelledSub = subscriptions.find(s => s.id === cancelledSubscriptionId);
    const subCost = cancelledSub ? cancelledSub.amount : amount;
    plainLanguageInsight = `Cancelling this subscription reclaims ₹${subCost.toLocaleString('en-IN')} monthly, increasing your buffer and boosting your Health Score.`;
  }

  // Trajectory comparison
  const projectedRunwayComparison = beforeMetrics.runwayTrajectory.map(bPoint => {
    const aPoint = afterMetrics.runwayTrajectory.find(p => p.day === bPoint.day);
    return {
      day: bPoint.day,
      currentPath: bPoint.projectedBalance ?? bPoint.actualBalance ?? 0,
      simulatedPath: aPoint ? (aPoint.projectedBalance ?? aPoint.actualBalance ?? 0) : 0,
    };
  });

  return {
    beforeMetrics,
    afterMetrics,
    balanceDelta,
    dailyAllowanceDelta,
    forecastDelta,
    healthScoreDelta,
    plainLanguageInsight,
    projectedRunwayComparison,
  };
}

/**
 * Currency formatter conforming to Indian number grouping (en-IN)
 * and tabular-nums styling.
 */
export function formatRupee(amount: number, options: { hideSymbol?: boolean; showSign?: boolean } = {}): string {
  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const abs = Math.abs(rounded);
  const formatted = new Intl.NumberFormat('en-IN').format(abs);

  let prefix = '';
  if (options.showSign) {
    prefix = isNegative ? '- ' : '+ ';
  } else if (isNegative) {
    prefix = '- ';
  }

  const symbol = options.hideSymbol ? '' : '₹';
  return `${prefix}${symbol}${formatted}`;
}
