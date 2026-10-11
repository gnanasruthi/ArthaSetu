import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Target,
  Sparkles,
  CalendarClock,
  Settings,
  LogOut,
  ChevronDown,
  User,
  AlertCircle,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { ToastContainer } from '../common/ToastContainer';
import { useBudgetStore } from '../../store/budgetStore';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/activity', label: 'Activity', icon: Receipt },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/what-if', label: 'What-If Lab', icon: Sparkles },
  { to: '/commitments', label: 'Commitments', icon: CalendarClock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const user = useBudgetStore((state) => state.user);
  const signOut = useBudgetStore((state) => state.signOut);
  const exitDemoMode = useBudgetStore((state) => state.exitDemoMode);
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const isDemo = Boolean(user?.isDemo);

  return (
    <div className="min-h-screen bg-[#FFF8EC] text-[#1B2A22] flex flex-col selection:bg-brand-orange/20 selection:text-brand-green">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 border-b border-amber-600/20 text-xs sm:text-sm font-medium flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-2 max-w-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-900" />
            <span>
              <strong>Demo mode active</strong> — Sample workspace stored in localStorage only. No changes affect cloud data.
            </span>
          </div>
          <button
            type="button"
            onClick={exitDemoMode}
            className="px-2.5 py-1 bg-amber-950 text-amber-100 rounded-md font-semibold text-xs hover:bg-black transition-colors shrink-0 ml-3"
          >
            Exit demo
          </button>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[#EADFC8] bg-[#FFFDF7]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <NavLink to="/" className="shrink-0 focus-visible:ring-2 focus-visible:ring-brand-orange rounded-xl">
            <BrandLogo />
          </NavLink>

          {/* User Profile & Sign Out dropdown */}
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#EADFC8] bg-[#FFF8EC] hover:bg-[#F5ECD7] transition-colors focus-visible:ring-2 focus-visible:ring-brand-orange"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              aria-label="User account menu"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-[#EADFC8]"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-green text-cream-bg flex items-center justify-center text-xs font-bold">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-brand-green leading-tight">
                  {user?.displayName || (isDemo ? 'Guest' : 'User')}
                </span>
                <span className="text-[10px] text-brand-muted truncate max-w-[120px]">
                  {isDemo ? 'Sample workspace' : (user?.email || 'Account')}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-brand-muted transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFDF7] border border-[#EADFC8] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-[#EADFC8]">
                  <p className="text-xs font-bold text-brand-green">
                    {user?.displayName || (isDemo ? 'Guest' : 'User')}
                  </p>
                  <p className="text-[11px] text-brand-muted truncate mt-0.5">
                    {isDemo ? 'Sample workspace' : user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <NavLink
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand-text hover:bg-[#FFF8EC] transition-colors"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-brand-muted" />
                    <span>Settings &amp; Budget</span>
                  </NavLink>
                </div>

                <div className="border-t border-[#EADFC8] pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4 text-red-600" />
                    <span>{isDemo ? 'Exit Demo Mode' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8 flex flex-col md:flex-row gap-6 min-w-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1.5" aria-label="Main Navigation">
          <div className="sticky top-24 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-brand-muted px-3 py-1 mb-1">
              Menu
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-green text-cream-bg shadow-sm'
                      : 'text-brand-text hover:bg-[#FFFDF7] hover:text-brand-green'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cream-bg' : 'text-brand-muted'}`} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </aside>

        {/* Dynamic Route Body */}
        <main className="flex-1 min-w-0" id="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFDF7]/95 backdrop-blur-md border-t border-[#EADFC8] z-30 px-2 py-1.5 flex items-center justify-around shadow-lg"
        aria-label="Mobile Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-semibold transition-all ${
                isActive
                  ? 'text-brand-green'
                  : 'text-brand-muted hover:text-brand-green'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg mb-0.5 transition-colors ${
                  isActive ? 'bg-[#DCEBDD] text-brand-green' : 'text-brand-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Global Toast Container */}
      <ToastContainer />
    </div>
  );
};
