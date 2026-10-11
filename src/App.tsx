import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useBudgetStore } from './store/budgetStore';
import { AppLayout } from './components/layout/AppLayout';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';

// Route-level code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Activity = lazy(() => import('./pages/Activity').then(m => ({ default: m.Activity })));
const Goals = lazy(() => import('./pages/Goals').then(m => ({ default: m.Goals })));
const WhatIfLab = lazy(() => import('./pages/WhatIfLab').then(m => ({ default: m.WhatIfLab })));
const Commitments = lazy(() => import('./pages/Commitments').then(m => ({ default: m.Commitments })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));

// Loading skeleton fallback
const PageLoadingSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse p-4">
    <div className="h-10 bg-[#EADFC8]/50 rounded-xl w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="h-56 bg-[#EADFC8]/40 rounded-3xl" />
      <div className="h-56 bg-[#EADFC8]/40 rounded-3xl" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="h-32 bg-[#EADFC8]/40 rounded-2xl" />
      <div className="h-32 bg-[#EADFC8]/40 rounded-2xl" />
      <div className="h-32 bg-[#EADFC8]/40 rounded-2xl" />
    </div>
  </div>
);

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useBudgetStore((state) => state.user);
  const isLoading = useBudgetStore((state) => state.isLoading);
  const settings = useBudgetStore((state) => state.settings);

  if (isLoading) {
    return <PageLoadingSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in (or in demo) but not yet onboarded, show onboarding wizard
  if (!settings.isOnboarded) {
    return (
      <div className="relative">
        <OnboardingWizard onFinished={() => {}} />
        <div className="opacity-20 pointer-events-none">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const init = useBudgetStore((state) => state.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/what-if" element={<WhatIfLab />} />
            <Route path="/commitments" element={<Commitments />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
