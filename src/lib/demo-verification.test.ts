import { describe, it, expect } from 'vitest';
import {
  calculateFinancialMetrics,
} from './finance';
import type { UserBudgetSettings, Transaction, Commitment, Subscription, Goal } from '../types';

describe('Demo Mode End-to-End Verification Test', () => {
  it('confirms the exact user verification flow', () => {
    // 1. Initial Demo State: October 1st start date, 30 days period
    const now = new Date('2026-10-11T12:00:00Z');
    const settings: UserBudgetSettings = {
      startingBudget: 10000,
      periodStartDate: '2026-10-01',
      periodLength: 30,
      expectedIncome: 0,
      isOnboarded: true,
    };

    const commitments: Commitment[] = [
      { id: 'c1', name: 'Rent Share', amount: 2500, dueDay: 20, isPaused: false, isPaid: false, autoDeduct: true },
    ];
    const subscriptions: Subscription[] = [
      { id: 's1', name: 'Spotify Student', amount: 119, dueDay: 15, isPaused: false, isCancelled: false, autoDeduct: true },
    ];
    const goals: Goal[] = [
      { id: 'g1', name: 'Emergency Cushion', targetAmount: 3000, currentAmount: 800, deadline: '2026-10-28', createdAt: '' },
    ];

    const initialTransactions: Transaction[] = [];

    // Verify initial metrics
    const initialMetrics = calculateFinancialMetrics({
      settings,
      transactions: initialTransactions,
      commitments,
      subscriptions,
      goals,
      asOfDate: now,
    });

    // Check Day counter shows today's real day (Day 11 on 11 Oct)
    expect(initialMetrics.currentDay).toBe(11);
    expect(initialMetrics.daysLeft).toBe(19);

    // Initial starting state
    expect(initialMetrics.startingBudget).toBe(10000);
    expect(initialMetrics.remainingBalance).toBe(10000);
    expect(initialMetrics.totalExpenses).toBe(0);

    const initialAllowance = initialMetrics.safeDailyAllowance;
    // Initial Allowance: (10000 - 2500 - 119) / 19 = 7381 / 19 = 388
    expect(initialAllowance).toBe(388);

    // 2. Add ₹540 expense
    const updatedTransactions: Transaction[] = [
      {
        id: 'tx_demo_540',
        type: 'expense',
        amount: 540,
        description: 'Zomato Biryani Lunch',
        date: now.toISOString(),
        dayOfPeriod: initialMetrics.currentDay,
        createdAt: now.toISOString(),
      },
    ];

    const afterMetrics = calculateFinancialMetrics({
      settings,
      transactions: updatedTransactions,
      commitments,
      subscriptions,
      goals,
      asOfDate: now,
    });

    // Verification requirement: Available drops from ₹10,000 to ₹9,460
    expect(afterMetrics.remainingBalance).toBe(9460);

    // Verification requirement: Spent shows ₹540
    expect(afterMetrics.totalExpenses).toBe(540);

    // Verification requirement: Day counter shows today's real day
    expect(afterMetrics.currentDay).toBe(11);

    // Verification requirement: Allowance and forecast change
    // New Allowance: (9460 - 2500 - 119) / 19 = 6841 / 19 = 360
    expect(afterMetrics.safeDailyAllowance).toBe(360);
    expect(afterMetrics.safeDailyAllowance).not.toBe(initialAllowance);

    // Average daily spend changed from 0 to 540 / 11 = 49.09
    expect(afterMetrics.averageDailySpend).toBeCloseTo(49.09, 1);
    expect(afterMetrics.monthEndForecast).not.toBe(initialMetrics.monthEndForecast);
  });
});
