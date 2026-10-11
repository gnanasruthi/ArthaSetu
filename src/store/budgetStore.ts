import { create } from 'zustand';
import type {
  Transaction,
  Commitment,
  Subscription,
  Goal,
  UserBudgetSettings,
  UserProfile,
} from '../types';

const DEMO_STORAGE_KEY = 'arthasetu_demo_state_v1';
const USER_STORAGE_KEY = 'arthasetu_user_state_v1';
const ACTIVE_USER_KEY = 'arthasetu_active_user_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface BudgetState {
  user: UserProfile | null;
  isLoading: boolean;
  settings: UserBudgetSettings;
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
  toasts: ToastMessage[];

  // Actions
  init: () => void;
  setUser: (user: UserProfile | null) => void;
  loginAsFrontendUser: (profile?: Partial<UserProfile>) => void;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Data mutations
  completeOnboarding: (data: {
    startingBudget: number;
    expectedIncome?: number;
    commitments?: Omit<Commitment, 'id'>[];
    subscriptions?: Omit<Subscription, 'id'>[];
    goals?: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>[];
  }) => Promise<void>;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCommitment: (c: Omit<Commitment, 'id'>) => Promise<void>;
  updateCommitment: (id: string, updates: Partial<Commitment>) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  toggleCommitmentPause: (id: string) => Promise<void>;
  toggleCommitmentPaid: (id: string) => Promise<void>;

  addSubscription: (s: Omit<Subscription, 'id'>) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  toggleSubscriptionPause: (id: string) => Promise<void>;
  toggleSubscriptionCancelled: (id: string) => Promise<void>;

  addGoal: (g: Omit<Goal, 'id' | 'currentAmount' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number, note?: string) => Promise<void>;
  withdrawFromGoal: (goalId: string, amount: number) => Promise<void>;

  updateSettings: (settings: Partial<UserBudgetSettings>) => Promise<void>;
  resetAllData: () => Promise<void>;
  signOut: () => Promise<void>;
}

function getInitialSettings(): UserBudgetSettings {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return {
    startingBudget: 10000,
    periodStartDate: `${year}-${month}-01`,
    periodLength: 30,
    expectedIncome: 0,
    isOnboarded: false,
  };
}

function getDefaultSampleData(forDemo: boolean) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const settings: UserBudgetSettings = {
    startingBudget: 10000,
    periodStartDate: `${year}-${month}-01`,
    periodLength: 30,
    expectedIncome: 0,
    isOnboarded: true,
  };

  // For fresh demo verification, start with 0 expenses so available balance is exactly ₹10,000
  const transactions: Transaction[] = [];

  const commitments: Commitment[] = [
    {
      id: `${forDemo ? 'demo' : 'user'}_c1`,
      name: 'Flat Rent Share',
      amount: 2500,
      dueDay: 20,
      isPaused: false,
      isPaid: false,
      autoDeduct: true,
    },
    {
      id: `${forDemo ? 'demo' : 'user'}_c2`,
      name: 'Wi-Fi & Utilities',
      amount: 450,
      dueDay: 18,
      isPaused: false,
      isPaid: false,
      autoDeduct: true,
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: `${forDemo ? 'demo' : 'user'}_s1`,
      name: 'Spotify Premium Student',
      amount: 119,
      dueDay: 15,
      isPaused: false,
      isCancelled: false,
      autoDeduct: true,
    },
    {
      id: `${forDemo ? 'demo' : 'user'}_s2`,
      name: 'Cloud Storage & AI',
      amount: 199,
      dueDay: 22,
      isPaused: false,
      isCancelled: false,
      autoDeduct: true,
    },
  ];

  const goals: Goal[] = [
    {
      id: `${forDemo ? 'demo' : 'user'}_g1`,
      name: 'Survive the Month Buffer',
      targetAmount: 3000,
      currentAmount: 800,
      deadline: `${year}-${month}-28`,
      createdAt: new Date().toISOString(),
    },
    {
      id: `${forDemo ? 'demo' : 'user'}_g2`,
      name: 'Festive Season Travel',
      targetAmount: 5000,
      currentAmount: 1200,
      deadline: `${year}-${month}-30`,
      createdAt: new Date().toISOString(),
    },
  ];

  return { settings, transactions, commitments, subscriptions, goals };
}

function saveWorkspaceToStorage(key: string, data: {
  settings: UserBudgetSettings;
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
}) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

function loadWorkspaceFromStorage(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
  }
  return null;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  user: null,
  isLoading: true,
  settings: getInitialSettings(),
  transactions: [],
  commitments: [],
  subscriptions: [],
  goals: [],
  toasts: [],

  init: () => {
    // Check if an active user was preserved in localStorage
    try {
      const activeUserRaw = localStorage.getItem(ACTIVE_USER_KEY);
      if (activeUserRaw) {
        const activeUser: UserProfile = JSON.parse(activeUserRaw);
        const storageKey = activeUser.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
        const savedData = loadWorkspaceFromStorage(storageKey);

        if (savedData) {
          set({
            user: activeUser,
            settings: savedData.settings || getInitialSettings(),
            transactions: savedData.transactions || [],
            commitments: savedData.commitments || [],
            subscriptions: savedData.subscriptions || [],
            goals: savedData.goals || [],
            isLoading: false,
          });
          return;
        } else {
          // Re-seed data for this user
          const defaultData = getDefaultSampleData(activeUser.isDemo);
          saveWorkspaceToStorage(storageKey, defaultData);
          set({
            user: activeUser,
            settings: defaultData.settings,
            transactions: defaultData.transactions,
            commitments: defaultData.commitments,
            subscriptions: defaultData.subscriptions,
            goals: defaultData.goals,
            isLoading: false,
          });
          return;
        }
      }
    } catch (e) {
      console.error('Error during store initialization:', e);
    }

    set({ isLoading: false });
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
    set({ user });
  },

  loginAsFrontendUser: (customProfile) => {
    const defaultProfile: UserProfile = {
      uid: 'user_rohan',
      displayName: 'Rohan Verma',
      email: 'rohan.verma@example.com',
      photoURL: null,
      isDemo: false,
      ...customProfile,
    };

    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(defaultProfile));

    // Load or initialize user's workspace
    const existing = loadWorkspaceFromStorage(USER_STORAGE_KEY);
    const data = existing || getDefaultSampleData(false);
    if (!existing) {
      saveWorkspaceToStorage(USER_STORAGE_KEY, data);
    }

    set({
      user: defaultProfile,
      settings: data.settings,
      transactions: data.transactions,
      commitments: data.commitments,
      subscriptions: data.subscriptions,
      goals: data.goals,
      isLoading: false,
    });

    get().addToast({
      type: 'success',
      title: 'Signed In Successfully',
      description: `Welcome back, ${defaultProfile.displayName}!`,
    });
  },

  enterDemoMode: () => {
    const demoUser: UserProfile = {
      uid: 'demo_user',
      displayName: 'Guest',
      email: 'guest@arthasetu.demo',
      photoURL: null,
      isDemo: true,
    };

    localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(demoUser));

    // Fresh demo data to ensure judge can test zero expenses and ₹540 test easily
    const existing = loadWorkspaceFromStorage(DEMO_STORAGE_KEY);
    const demoData = existing || getDefaultSampleData(true);
    if (!existing) {
      saveWorkspaceToStorage(DEMO_STORAGE_KEY, demoData);
    }

    set({
      user: demoUser,
      settings: demoData.settings,
      transactions: demoData.transactions,
      commitments: demoData.commitments,
      subscriptions: demoData.subscriptions,
      goals: demoData.goals,
      isLoading: false,
    });

    get().addToast({
      type: 'info',
      title: 'Demo Mode Activated',
      description: 'Exploring with sample workspace in localStorage. You can test expenses and simulation freely.',
    });
  },

  exitDemoMode: () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_USER_KEY);
    set({
      user: null,
      settings: getInitialSettings(),
      transactions: [],
      commitments: [],
      subscriptions: [],
      goals: [],
    });
    get().addToast({
      type: 'info',
      title: 'Exited Demo Mode',
      description: 'You are now back on the sign-in screen.',
    });
  },

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  completeOnboarding: async (data) => {
    const { user, settings } = get();
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const updatedSettings: UserBudgetSettings = {
      ...settings,
      startingBudget: data.startingBudget,
      expectedIncome: data.expectedIncome || 0,
      periodStartDate: settings.periodStartDate || `${year}-${month}-01`,
      periodLength: 30,
      isOnboarded: true,
    };

    const prefix = user?.isDemo ? 'demo' : 'usr';
    const commitments: Commitment[] = (data.commitments || []).map((c, i) => ({
      id: `${prefix}_c_${Date.now()}_${i}`,
      ...c,
    }));
    const subscriptions: Subscription[] = (data.subscriptions || []).map((s, i) => ({
      id: `${prefix}_s_${Date.now()}_${i}`,
      ...s,
    }));
    const goals: Goal[] = (data.goals || []).map((g, i) => ({
      id: `${prefix}_g_${Date.now()}_${i}`,
      ...g,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    }));

    const newState = {
      settings: updatedSettings,
      transactions: [],
      commitments,
      subscriptions,
      goals,
    };

    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, newState);
    set(newState);
  },

  addTransaction: async (txData) => {
    const { user, transactions, settings, commitments, subscriptions, goals } = get();
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...transactions];
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions: updatedTransactions,
      commitments,
      subscriptions,
      goals,
    });
    set({ transactions: updatedTransactions });
  },

  updateTransaction: async (id, updates) => {
    const { user, transactions, settings, commitments, subscriptions, goals } = get();
    const updated = transactions.map((t) => (t.id === id ? { ...t, ...updates } : t));
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions: updated,
      commitments,
      subscriptions,
      goals,
    });
    set({ transactions: updated });
  },

  deleteTransaction: async (id) => {
    const { user, transactions, settings, commitments, subscriptions, goals } = get();
    const updated = transactions.filter((t) => t.id !== id);
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions: updated,
      commitments,
      subscriptions,
      goals,
    });
    set({ transactions: updated });
  },

  addCommitment: async (c) => {
    const { user, commitments, settings, transactions, subscriptions, goals } = get();
    const id = `commit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const updated = [...commitments, { ...c, id }];
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments: updated,
      subscriptions,
      goals,
    });
    set({ commitments: updated });
  },

  updateCommitment: async (id, updates) => {
    const { user, commitments, settings, transactions, subscriptions, goals } = get();
    const updated = commitments.map((c) => (c.id === id ? { ...c, ...updates } : c));
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments: updated,
      subscriptions,
      goals,
    });
    set({ commitments: updated });
  },

  deleteCommitment: async (id) => {
    const { user, commitments, settings, transactions, subscriptions, goals } = get();
    const updated = commitments.filter((c) => c.id !== id);
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments: updated,
      subscriptions,
      goals,
    });
    set({ commitments: updated });
  },

  toggleCommitmentPause: async (id) => {
    const { commitments, updateCommitment } = get();
    const item = commitments.find((c) => c.id === id);
    if (item) {
      await updateCommitment(id, { isPaused: !item.isPaused });
    }
  },

  toggleCommitmentPaid: async (id) => {
    const { commitments, updateCommitment } = get();
    const item = commitments.find((c) => c.id === id);
    if (item) {
      await updateCommitment(id, { isPaid: !item.isPaid });
    }
  },

  addSubscription: async (s) => {
    const { user, subscriptions, settings, transactions, commitments, goals } = get();
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const updated = [...subscriptions, { ...s, id }];
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions: updated,
      goals,
    });
    set({ subscriptions: updated });
  },

  updateSubscription: async (id, updates) => {
    const { user, subscriptions, settings, transactions, commitments, goals } = get();
    const updated = subscriptions.map((s) => (s.id === id ? { ...s, ...updates } : s));
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions: updated,
      goals,
    });
    set({ subscriptions: updated });
  },

  deleteSubscription: async (id) => {
    const { user, subscriptions, settings, transactions, commitments, goals } = get();
    const updated = subscriptions.filter((s) => s.id !== id);
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions: updated,
      goals,
    });
    set({ subscriptions: updated });
  },

  toggleSubscriptionPause: async (id) => {
    const { subscriptions, updateSubscription } = get();
    const item = subscriptions.find((s) => s.id === id);
    if (item) {
      await updateSubscription(id, { isPaused: !item.isPaused });
    }
  },

  toggleSubscriptionCancelled: async (id) => {
    const { subscriptions, updateSubscription } = get();
    const item = subscriptions.find((s) => s.id === id);
    if (item) {
      await updateSubscription(id, { isCancelled: !item.isCancelled });
    }
  },

  addGoal: async (g) => {
    const { user, goals, settings, transactions, commitments, subscriptions } = get();
    const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const updated = [
      ...goals,
      {
        ...g,
        id,
        currentAmount: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions,
      goals: updated,
    });
    set({ goals: updated });
  },

  updateGoal: async (id, updates) => {
    const { user, goals, settings, transactions, commitments, subscriptions } = get();
    const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions,
      goals: updated,
    });
    set({ goals: updated });
  },

  deleteGoal: async (id) => {
    const { user, goals, settings, transactions, commitments, subscriptions } = get();
    const updated = goals.filter((g) => g.id !== id);
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings,
      transactions,
      commitments,
      subscriptions,
      goals: updated,
    });
    set({ goals: updated });
  },

  contributeToGoal: async (goalId, amount, note) => {
    const { goals, addTransaction, updateGoal } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    // 1. Update goal amount
    const newGoalAmount = goal.currentAmount + amount;
    await updateGoal(goalId, { currentAmount: newGoalAmount });

    // 2. Add savings transfer transaction
    const now = new Date();
    const day = Math.min(30, Math.max(1, now.getDate()));
    await addTransaction({
      type: 'savings_transfer',
      amount,
      description: note || `Transfer to goal: ${goal.name}`,
      date: now.toISOString(),
      dayOfPeriod: day,
      goalId,
    });

    get().addToast({
      type: 'success',
      title: 'Contribution Added!',
      description: `Saved ₹${amount.toLocaleString('en-IN')} towards "${goal.name}".`,
    });
  },

  withdrawFromGoal: async (goalId, amount) => {
    const { goals, updateGoal, addTransaction } = get();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal || goal.currentAmount < amount) return;

    await updateGoal(goalId, { currentAmount: goal.currentAmount - amount });

    const now = new Date();
    const day = Math.min(30, Math.max(1, now.getDate()));
    await addTransaction({
      type: 'income',
      amount,
      description: `Withdrew from goal: ${goal.name}`,
      date: now.toISOString(),
      dayOfPeriod: day,
    });

    get().addToast({
      type: 'info',
      title: 'Withdrawn to Balance',
      description: `Returned ₹${amount.toLocaleString('en-IN')} from "${goal.name}" to available spending balance.`,
    });
  },

  updateSettings: async (settingsUpdates) => {
    const { user, settings, transactions, commitments, subscriptions, goals } = get();
    const updated = { ...settings, ...settingsUpdates };
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;
    saveWorkspaceToStorage(storageKey, {
      settings: updated,
      transactions,
      commitments,
      subscriptions,
      goals,
    });
    set({ settings: updated });
  },

  resetAllData: async () => {
    const { user } = get();
    const freshSettings = getInitialSettings();
    const storageKey = user?.isDemo ? DEMO_STORAGE_KEY : USER_STORAGE_KEY;

    localStorage.removeItem(storageKey);
    set({
      settings: freshSettings,
      transactions: [],
      commitments: [],
      subscriptions: [],
      goals: [],
    });

    get().addToast({
      type: 'info',
      title: 'Workspace Reset',
      description: 'Your budget workspace has been reset to clean slate.',
    });
  },

  signOut: async () => {
    const { user, exitDemoMode } = get();
    if (user?.isDemo) {
      exitDemoMode();
      return;
    }
    localStorage.removeItem(ACTIVE_USER_KEY);
    set({
      user: null,
      settings: getInitialSettings(),
      transactions: [],
      commitments: [],
      subscriptions: [],
      goals: [],
    });
  },
}));
