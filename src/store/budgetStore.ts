import { create } from 'zustand';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, signOutFirebase, isFirebaseConfigured } from '../lib/firebase';
import type {
  Transaction,
  Commitment,
  Subscription,
  Goal,
  UserBudgetSettings,
  UserProfile,
} from '../types';

const DEMO_STORAGE_KEY = 'arthasetu_demo_state_v1';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface BudgetState {
  user: UserProfile | null;
  isLoading: boolean;
  authError: string | null;
  settings: UserBudgetSettings;
  transactions: Transaction[];
  commitments: Commitment[];
  subscriptions: Subscription[];
  goals: Goal[];
  toasts: ToastMessage[];

  // Actions
  init: () => void;
  setUser: (user: UserProfile | null) => void;
  setAuthError: (error: string | null) => void;
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

function getDemoInitialData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = Math.min(30, Math.max(1, now.getDate()));

  const settings: UserBudgetSettings = {
    startingBudget: 10000,
    periodStartDate: `${year}-${month}-01`,
    periodLength: 30,
    expectedIncome: 0,
    isOnboarded: true,
  };

  // Sample data for demo mode
  // Note: initially starts with 0 expenses so available balance is full ₹10,000,
  // enabling immediate verification of "add a ₹540 expense and confirm Available drops from ₹10,000 to ₹9,460"
  const transactions: Transaction[] = [];

  const commitments: Commitment[] = [
    {
      id: 'demo_c1',
      name: 'Flat Rent Share',
      amount: 2500,
      dueDay: 20,
      isPaused: false,
      isPaid: false,
      autoDeduct: true,
    },
    {
      id: 'demo_c2',
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
      id: 'demo_s1',
      name: 'Spotify Premium Student',
      amount: 119,
      dueDay: 15,
      isPaused: false,
      isCancelled: false,
      autoDeduct: true,
    },
    {
      id: 'demo_s2',
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
      id: 'demo_g1',
      name: 'Survive the Month Buffer',
      targetAmount: 3000,
      currentAmount: 800,
      deadline: `${year}-${month}-28`,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo_g2',
      name: 'Festive Season Travel',
      targetAmount: 5000,
      currentAmount: 1200,
      deadline: `${year}-${month}-30`,
      createdAt: new Date().toISOString(),
    },
  ];

  return { settings, transactions, commitments, subscriptions, goals, todayDay };
}

let firestoreUnsubscribers: Unsubscribe[] = [];

export const useBudgetStore = create<BudgetState>((set, get) => ({
  user: null,
  isLoading: true,
  authError: null,
  settings: getInitialSettings(),
  transactions: [],
  commitments: [],
  subscriptions: [],
  goals: [],
  toasts: [],

  init: () => {
    // Check if demo mode was active
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        set({
          user: {
            uid: 'demo_user',
            displayName: 'Guest',
            email: 'guest@arthasetu.demo',
            photoURL: null,
            isDemo: true,
          },
          settings: parsed.settings || getInitialSettings(),
          transactions: parsed.transactions || [],
          commitments: parsed.commitments || [],
          subscriptions: parsed.subscriptions || [],
          goals: parsed.goals || [],
          isLoading: false,
        });
        return;
      } catch (e) {
        console.error('Failed to parse demo state from localStorage', e);
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    if (auth && isFirebaseConfigured) {
      onAuthStateChanged(auth, (firebaseUser) => {
        // Clear previous firestore listeners if user changes
        firestoreUnsubscribers.forEach(unsub => unsub());
        firestoreUnsubscribers = [];

        if (firebaseUser) {
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName,
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            isDemo: false,
          };
          set({ user: profile, isLoading: true, authError: null });

          // Attach real-time listeners for users/{uid}
          if (db) {
            const uid = firebaseUser.uid;

            // 1. Settings listener
            const settingsUnsub = onSnapshot(doc(db, 'users', uid, 'settings', 'budget'), (docSnap) => {
              if (docSnap.exists()) {
                set({ settings: docSnap.data() as UserBudgetSettings, isLoading: false });
              } else {
                set({ settings: getInitialSettings(), isLoading: false });
              }
            }, (error) => {
              console.error('Firestore settings listener error:', error);
              set({ isLoading: false });
            });

            // 2. Transactions listener
            const txUnsub = onSnapshot(collection(db, 'users', uid, 'transactions'), (snapshot) => {
              const list: Transaction[] = [];
              snapshot.forEach((d) => {
                list.push({ id: d.id, ...d.data() } as Transaction);
              });
              // Sort descending by date
              list.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
              set({ transactions: list });
            });

            // 3. Commitments listener
            const commitUnsub = onSnapshot(collection(db, 'users', uid, 'commitments'), (snapshot) => {
              const list: Commitment[] = [];
              snapshot.forEach((d) => {
                list.push({ id: d.id, ...d.data() } as Commitment);
              });
              set({ commitments: list });
            });

            // 4. Subscriptions listener
            const subUnsub = onSnapshot(collection(db, 'users', uid, 'subscriptions'), (snapshot) => {
              const list: Subscription[] = [];
              snapshot.forEach((d) => {
                list.push({ id: d.id, ...d.data() } as Subscription);
              });
              set({ subscriptions: list });
            });

            // 5. Goals listener
            const goalUnsub = onSnapshot(collection(db, 'users', uid, 'goals'), (snapshot) => {
              const list: Goal[] = [];
              snapshot.forEach((d) => {
                list.push({ id: d.id, ...d.data() } as Goal);
              });
              set({ goals: list });
            });

            firestoreUnsubscribers = [settingsUnsub, txUnsub, commitUnsub, subUnsub, goalUnsub];
          }
        } else {
          set({
            user: null,
            isLoading: false,
            settings: getInitialSettings(),
            transactions: [],
            commitments: [],
            subscriptions: [],
            goals: [],
          });
        }
      });
    } else {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  setAuthError: (error) => set({ authError: error }),

  enterDemoMode: () => {
    firestoreUnsubscribers.forEach(unsub => unsub());
    firestoreUnsubscribers = [];

    const demoData = getDemoInitialData();
    const demoUser: UserProfile = {
      uid: 'demo_user',
      displayName: 'Guest',
      email: 'guest@arthasetu.demo',
      photoURL: null,
      isDemo: true,
    };

    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoData));

    set({
      user: demoUser,
      settings: demoData.settings,
      transactions: demoData.transactions,
      commitments: demoData.commitments,
      subscriptions: demoData.subscriptions,
      goals: demoData.goals,
      isLoading: false,
      authError: null,
    });

    get().addToast({
      type: 'info',
      title: 'Demo Mode Activated',
      description: 'Exploring with sample workspace in localStorage. No real data is saved to cloud.',
    });
  },

  exitDemoMode: () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
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
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
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

    if (user?.isDemo) {
      const commitments: Commitment[] = (data.commitments || []).map((c, i) => ({
        id: `demo_c_${Date.now()}_${i}`,
        ...c,
      }));
      const subscriptions: Subscription[] = (data.subscriptions || []).map((s, i) => ({
        id: `demo_s_${Date.now()}_${i}`,
        ...s,
      }));
      const goals: Goal[] = (data.goals || []).map((g, i) => ({
        id: `demo_g_${Date.now()}_${i}`,
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
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newState));
      set(newState);
      return;
    }

    if (user && db) {
      const uid = user.uid;
      await setDoc(doc(db, 'users', uid, 'settings', 'budget'), updatedSettings);

      if (data.commitments && data.commitments.length > 0) {
        for (const c of data.commitments) {
          const id = `commit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await setDoc(doc(db, 'users', uid, 'commitments', id), { ...c, id });
        }
      }

      if (data.subscriptions && data.subscriptions.length > 0) {
        for (const s of data.subscriptions) {
          const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await setDoc(doc(db, 'users', uid, 'subscriptions', id), { ...s, id });
        }
      }

      if (data.goals && data.goals.length > 0) {
        for (const g of data.goals) {
          const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await setDoc(doc(db, 'users', uid, 'goals', id), {
            ...g,
            id,
            currentAmount: 0,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  },

  addTransaction: async (txData) => {
    const { user, transactions } = get();
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: new Date().toISOString(),
    };

    if (user?.isDemo) {
      const updated = [newTx, ...transactions];
      set({ transactions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.transactions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'transactions', id), newTx);
    }
  },

  updateTransaction: async (id, updates) => {
    const { user, transactions } = get();
    if (user?.isDemo) {
      const updated = transactions.map(t => (t.id === id ? { ...t, ...updates } : t));
      set({ transactions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.transactions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'transactions', id), updates, { merge: true });
    }
  },

  deleteTransaction: async (id) => {
    const { user, transactions } = get();
    if (user?.isDemo) {
      const updated = transactions.filter(t => t.id !== id);
      set({ transactions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.transactions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
    }
  },

  addCommitment: async (c) => {
    const { user, commitments } = get();
    const id = `commit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newCommitment: Commitment = { ...c, id };

    if (user?.isDemo) {
      const updated = [...commitments, newCommitment];
      set({ commitments: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.commitments = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'commitments', id), newCommitment);
    }
  },

  updateCommitment: async (id, updates) => {
    const { user, commitments } = get();
    if (user?.isDemo) {
      const updated = commitments.map(c => (c.id === id ? { ...c, ...updates } : c));
      set({ commitments: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.commitments = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'commitments', id), updates, { merge: true });
    }
  },

  deleteCommitment: async (id) => {
    const { user, commitments } = get();
    if (user?.isDemo) {
      const updated = commitments.filter(c => c.id !== id);
      set({ commitments: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.commitments = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await deleteDoc(doc(db, 'users', user.uid, 'commitments', id));
    }
  },

  toggleCommitmentPause: async (id) => {
    const { commitments, updateCommitment } = get();
    const item = commitments.find(c => c.id === id);
    if (item) {
      await updateCommitment(id, { isPaused: !item.isPaused });
    }
  },

  toggleCommitmentPaid: async (id) => {
    const { commitments, updateCommitment } = get();
    const item = commitments.find(c => c.id === id);
    if (item) {
      await updateCommitment(id, { isPaid: !item.isPaid });
    }
  },

  addSubscription: async (s) => {
    const { user, subscriptions } = get();
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newSub: Subscription = { ...s, id };

    if (user?.isDemo) {
      const updated = [...subscriptions, newSub];
      set({ subscriptions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.subscriptions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'subscriptions', id), newSub);
    }
  },

  updateSubscription: async (id, updates) => {
    const { user, subscriptions } = get();
    if (user?.isDemo) {
      const updated = subscriptions.map(s => (s.id === id ? { ...s, ...updates } : s));
      set({ subscriptions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.subscriptions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'subscriptions', id), updates, { merge: true });
    }
  },

  deleteSubscription: async (id) => {
    const { user, subscriptions } = get();
    if (user?.isDemo) {
      const updated = subscriptions.filter(s => s.id !== id);
      set({ subscriptions: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.subscriptions = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', id));
    }
  },

  toggleSubscriptionPause: async (id) => {
    const { subscriptions, updateSubscription } = get();
    const item = subscriptions.find(s => s.id === id);
    if (item) {
      await updateSubscription(id, { isPaused: !item.isPaused });
    }
  },

  toggleSubscriptionCancelled: async (id) => {
    const { subscriptions, updateSubscription } = get();
    const item = subscriptions.find(s => s.id === id);
    if (item) {
      await updateSubscription(id, { isCancelled: !item.isCancelled });
    }
  },

  addGoal: async (g) => {
    const { user, goals } = get();
    const id = `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newGoal: Goal = {
      ...g,
      id,
      currentAmount: 0,
      createdAt: new Date().toISOString(),
    };

    if (user?.isDemo) {
      const updated = [...goals, newGoal];
      set({ goals: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.goals = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'goals', id), newGoal);
    }
  },

  updateGoal: async (id, updates) => {
    const { user, goals } = get();
    if (user?.isDemo) {
      const updated = goals.map(g => (g.id === id ? { ...g, ...updates } : g));
      set({ goals: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.goals = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'goals', id), updates, { merge: true });
    }
  },

  deleteGoal: async (id) => {
    const { user, goals } = get();
    if (user?.isDemo) {
      const updated = goals.filter(g => g.id !== id);
      set({ goals: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.goals = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
    }
  },

  contributeToGoal: async (goalId, amount, note) => {
    const { goals, addTransaction, updateGoal } = get();
    const goal = goals.find(g => g.id === goalId);
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
    const goal = goals.find(g => g.id === goalId);
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
    const { user, settings } = get();
    const updated = { ...settings, ...settingsUpdates };

    if (user?.isDemo) {
      set({ settings: updated });
      const currentStored = JSON.parse(localStorage.getItem(DEMO_STORAGE_KEY) || '{}');
      currentStored.settings = updated;
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(currentStored));
      return;
    }

    if (user && db) {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'budget'), updated, { merge: true });
    }
  },

  resetAllData: async () => {
    const { user } = get();
    const freshSettings = getInitialSettings();

    if (user?.isDemo) {
      localStorage.removeItem(DEMO_STORAGE_KEY);
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
        description: 'All demo data has been cleared.',
      });
      return;
    }

    if (user && db) {
      const uid = user.uid;
      // Delete docs
      await setDoc(doc(db, 'users', uid, 'settings', 'budget'), freshSettings);
      get().addToast({
        type: 'info',
        title: 'Account Reset',
        description: 'Your budget workspace has been reset to clean slate.',
      });
    }
  },

  signOut: async () => {
    const { user, exitDemoMode } = get();
    if (user?.isDemo) {
      exitDemoMode();
      return;
    }
    await signOutFirebase();
    firestoreUnsubscribers.forEach(unsub => unsub());
    firestoreUnsubscribers = [];
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
