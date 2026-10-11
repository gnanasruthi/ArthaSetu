export type TransactionType = 'expense' | 'income' | 'savings_transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string; // "Where did you spend it?"
  date: string; // ISO date string
  dayOfPeriod: number; // 1..periodLength
  goalId?: string; // If type is 'savings_transfer'
  createdAt: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1..30
  isPaused: boolean;
  isPaid: boolean;
  autoDeduct: boolean;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1..30
  isPaused: boolean;
  isCancelled: boolean;
  autoDeduct: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string or date
  createdAt: string;
}

export interface UserBudgetSettings {
  startingBudget: number; // default 10000
  periodStartDate: string; // YYYY-MM-DD
  periodLength: number; // default 30
  expectedIncome: number;
  isOnboarded: boolean;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface HealthFactorBreakdown {
  name: string;
  score: number; // 0..20 (each contributes to 100 total)
  maxScore: number;
  userValueDescription: string;
  explanation: string;
}

export interface FinancialHealth {
  score: number; // 0..100
  band: 'Strong' | 'Okay' | 'Shaky' | 'Critical';
  factors: HealthFactorBreakdown[];
}

export interface RunwayDayPoint {
  day: number;
  dateStr: string;
  actualBalance?: number;
  projectedBalance?: number;
  isRunOutDay?: boolean;
}

export interface FinancialMetrics {
  startingBudget: number;
  totalIncome: number;
  totalExpenses: number;
  netSavingsTransfers: number;
  remainingBalance: number;
  currentDay: number;
  daysLeft: number;
  upcomingCommitmentsTotal: number;
  upcomingSubscriptionsTotal: number;
  safeDailyAllowance: number;
  averageDailySpend: number;
  hasEnoughForecastData: boolean;
  monthEndForecast: number;
  runOutDay: number | null; // null if makes it through
  spareAtMonthEnd: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  health: FinancialHealth;
  runwayTrajectory: RunwayDayPoint[];
}

export type GoalVerdict = 'Safe' | 'Tight' | 'Critical';

export interface GoalContributionReview {
  goalId: string;
  goalName: string;
  contributionAmount: number;
  balanceNow: number;
  balanceAfter: number;
  remainingObligations: number; // commitments + subscriptions still due
  safeDailyAllowanceBefore: number;
  safeDailyAllowanceAfter: number;
  verdict: GoalVerdict;
  verdictExplanation: string;
  requiresExtraConfirmation: boolean;
}

export interface SimulationResult {
  beforeMetrics: FinancialMetrics;
  afterMetrics: FinancialMetrics;
  balanceDelta: number;
  dailyAllowanceDelta: number;
  forecastDelta: number;
  healthScoreDelta: number;
  plainLanguageInsight: string;
  projectedRunwayComparison: {
    day: number;
    currentPath: number;
    simulatedPath: number;
  }[];
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemo: boolean;
}
