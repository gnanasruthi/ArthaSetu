import { describe, it, expect } from 'vitest';
import {
  calculateRemainingBalance,
  calculateCurrentDay,
  calculateSafeDailyAllowance,
  calculateMonthEndForecast,
  calculateFinancialHealth,
  calculateFinancialMetrics,
  reviewGoalContribution,
  simulateDecision,
  formatRupee,
} from './finance';
import type { Transaction, Commitment, Subscription, Goal, UserBudgetSettings } from '../types';

describe('Finance Engine - Pure Functions', () => {
  it('calculates remaining balance correctly as budget - expenses - savings + income', () => {
    // Challenge requirement: budget 10000 − expense 540 = 9460; − goal contribution 500 = 8960; + income 1000 = 9960.
    const startingBudget = 10000;
    const transactions: Transaction[] = [];

    // 1. Starting budget alone
    let res = calculateRemainingBalance(startingBudget, transactions);
    expect(res.remainingBalance).toBe(10000);

    // 2. Subtract expense 540 -> 9460
    transactions.push({
      id: 'tx1',
      type: 'expense',
      amount: 540,
      description: 'Zomato Biryani',
      date: '2026-10-11T12:00:00Z',
      dayOfPeriod: 11,
      createdAt: '2026-10-11T12:00:00Z',
    });
    res = calculateRemainingBalance(startingBudget, transactions);
    expect(res.remainingBalance).toBe(9460);
    expect(res.totalExpenses).toBe(540);

    // 3. Subtract goal contribution (savings_transfer) 500 -> 8960
    transactions.push({
      id: 'tx2',
      type: 'savings_transfer',
      amount: 500,
      description: 'Transfer to Emergency Fund',
      date: '2026-10-11T13:00:00Z',
      dayOfPeriod: 11,
      goalId: 'g1',
      createdAt: '2026-10-11T13:00:00Z',
    });
    res = calculateRemainingBalance(startingBudget, transactions);
    expect(res.remainingBalance).toBe(8960);
    expect(res.netSavingsTransfers).toBe(500);

    // 4. Add income 1000 -> 9960
    transactions.push({
      id: 'tx3',
      type: 'income',
      amount: 1000,
      description: 'Freelance gig',
      date: '2026-10-11T14:00:00Z',
      dayOfPeriod: 11,
      createdAt: '2026-10-11T14:00:00Z',
    });
    res = calculateRemainingBalance(startingBudget, transactions);
    expect(res.remainingBalance).toBe(9960);
    expect(res.totalIncome).toBe(1000);
  });

  it('calculates currentDay and clamps properly within periodLength', () => {
    // 2026-10-01 start, tested on 2026-10-11 (day 11 of 30)
    const startDate = '2026-10-01';
    const day11Date = new Date('2026-10-11T12:00:00Z');
    const day = calculateCurrentDay(startDate, 30, day11Date);
    expect(day).toBe(11);

    // Clamps to min 1 if date is before start
    const beforeDate = new Date('2026-09-28T00:00:00Z');
    expect(calculateCurrentDay(startDate, 30, beforeDate)).toBe(1);

    // Clamps to periodLength (30) if date is after period
    const afterDate = new Date('2026-11-15T00:00:00Z');
    expect(calculateCurrentDay(startDate, 30, afterDate)).toBe(30);
  });

  it('calculates safe daily allowance correctly protecting upcoming commitments', () => {
    // Balance 9460, upcoming commitments 2000, upcoming subscriptions 400, days left 19
    // Safe allowance = (9460 - 2000 - 400 - 0) / 19 = 7060 / 19 = 371
    const allowance = calculateSafeDailyAllowance(9460, 2000, 400, 0, 19);
    expect(allowance).toBe(Math.floor((9460 - 2400) / 19));
    expect(allowance).toBe(371);
  });

  it('calculates month-end forecast based on average daily spend and days left', () => {
    // Balance 9460, average daily spend 540 / 11 = 49.09, days left 19, upcoming commitments 2000
    // Forecast = 9460 - (49.09 * 19) - 2000 = 9460 - 932.7 - 2000 = 6527
    const forecast = calculateMonthEndForecast(9460, 49.09, 19, 2000);
    expect(forecast).toBe(Math.round(9460 - (49.09 * 19) - 2000));
  });

  it('evaluates health score bands accurately', () => {
    const strongHealth = calculateFinancialHealth({
      startingBudget: 10000,
      remainingBalance: 9000,
      currentDay: 5,
      daysLeft: 25,
      averageDailySpend: 150,
      totalExpenses: 750,
      commitments: [{ id: 'c1', name: 'Rent share', amount: 2500, dueDay: 20, isPaused: false, isPaid: false, autoDeduct: false }],
      subscriptions: [{ id: 's1', name: 'Spotify', amount: 119, dueDay: 15, isPaused: false, isCancelled: false, autoDeduct: true }],
      goals: [{ id: 'g1', name: 'Emergency', targetAmount: 2000, currentAmount: 1800, deadline: '2026-11-01', createdAt: '' }],
      safeDailyAllowance: 250,
      monthEndForecast: 4500,
    });
    expect(strongHealth.score).toBeGreaterThanOrEqual(80);
    expect(strongHealth.band).toBe('Strong');

    const criticalHealth = calculateFinancialHealth({
      startingBudget: 10000,
      remainingBalance: 200,
      currentDay: 10,
      daysLeft: 20,
      averageDailySpend: 500,
      totalExpenses: 5000,
      commitments: [{ id: 'c1', name: 'Rent', amount: 3000, dueDay: 20, isPaused: false, isPaid: false, autoDeduct: false }],
      subscriptions: [{ id: 's1', name: 'Gym', amount: 1500, dueDay: 15, isPaused: false, isCancelled: false, autoDeduct: true }],
      goals: [],
      safeDailyAllowance: 0,
      monthEndForecast: -8000,
    });
    expect(criticalHealth.score).toBeLessThan(40);
    expect(criticalHealth.band).toBe('Critical');
  });

  it('reviews goal contribution with safety checks and extra confirmation requirement', () => {
    const settings: UserBudgetSettings = {
      startingBudget: 10000,
      periodStartDate: '2026-10-01',
      periodLength: 30,
      expectedIncome: 0,
      isOnboarded: true,
    };
    const commitments: Commitment[] = [
      { id: 'c1', name: 'Rent share', amount: 3000, dueDay: 25, isPaused: false, isPaid: false, autoDeduct: true },
    ];
    const subscriptions: Subscription[] = [
      { id: 's1', name: 'Netflix', amount: 500, dueDay: 22, isPaused: false, isCancelled: false, autoDeduct: true },
    ];
    const goals: Goal[] = [
      { id: 'g1', name: 'New Shoes', targetAmount: 4000, currentAmount: 1000, deadline: '2026-10-31', createdAt: '' },
    ];

    const metrics = calculateFinancialMetrics({
      settings,
      transactions: [],
      commitments,
      subscriptions,
      goals,
      asOfDate: new Date('2026-10-11T00:00:00Z'),
    });

    // 1. Safe contribution of ₹500 (leaves 9500 - 3500 = 6000 over 19 days -> 315/day)
    const reviewSafe = reviewGoalContribution({
      goal: goals[0],
      contributionAmount: 500,
      currentMetrics: metrics,
    });
    expect(reviewSafe.verdict).toBe('Safe');
    expect(reviewSafe.requiresExtraConfirmation).toBe(false);

    // 2. Dangerous contribution of ₹7000 (leaves 3000, but commitments + subs are 3500!)
    const reviewDanger = reviewGoalContribution({
      goal: goals[0],
      contributionAmount: 7000,
      currentMetrics: metrics,
    });
    expect(reviewDanger.verdict).toBe('Critical');
    expect(reviewDanger.requiresExtraConfirmation).toBe(true);

    // 3. Exceeds available balance (₹12,000 > 10,000)
    const reviewExceeds = reviewGoalContribution({
      goal: goals[0],
      contributionAmount: 12000,
      currentMetrics: metrics,
    });
    expect(reviewExceeds.verdict).toBe('Critical');
    expect(reviewExceeds.requiresExtraConfirmation).toBe(true);
  });

  it('simulates decisions accurately in What-If Lab without mutating base data', () => {
    const settings: UserBudgetSettings = {
      startingBudget: 10000,
      periodStartDate: '2026-10-01',
      periodLength: 30,
      expectedIncome: 0,
      isOnboarded: true,
    };
    const commitments: Commitment[] = [];
    const subscriptions: Subscription[] = [
      { id: 'sub_1', name: 'Hotstar', amount: 299, dueDay: 20, isPaused: false, isCancelled: false, autoDeduct: true },
    ];
    const goals: Goal[] = [];
    const transactions: Transaction[] = [];

    // Simulate spend of ₹1,000
    const simSpend = simulateDecision({
      type: 'spend',
      amount: 1000,
      description: 'Concert ticket',
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });

    expect(simSpend.balanceDelta).toBe(-1000);
    expect(simSpend.afterMetrics.remainingBalance).toBe(9000);
    expect(simSpend.plainLanguageInsight).toContain('reduces your daily allowance');

    // Simulate cancelling subscription
    const simCancel = simulateDecision({
      type: 'cancel_subscription',
      amount: 299,
      description: 'Cancel Hotstar',
      cancelledSubscriptionId: 'sub_1',
      settings,
      transactions,
      commitments,
      subscriptions,
      goals,
    });

    expect(simCancel.afterMetrics.upcomingSubscriptionsTotal).toBe(0);
    expect(simCancel.plainLanguageInsight).toContain('Cancelling this subscription');
  });

  it('formats rupees with en-IN number grouping and currency symbol', () => {
    expect(formatRupee(10000)).toBe('₹10,000');
    expect(formatRupee(150000)).toBe('₹1,50,000');
    expect(formatRupee(540)).toBe('₹540');
    expect(formatRupee(-540)).toBe('- ₹540');
    expect(formatRupee(2500, { showSign: true })).toBe('+ ₹2,500');
  });
});
