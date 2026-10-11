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
  Menu,
  X,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <div className="min-h-screen bg-[#F5F0EA] text-[#302630] flex flex-col antialiased selection:bg-[#F5B39B]/30 selection:text-[#542743]">
      {/* Desktop Fixed Left Sidebar (240px wide, extreme left edge) */}
      <aside
        className="hidden md:flex flex-col fixed top-0 bottom-0 left-0 w-60 bg-[#FFFFFF] border-r border-[#E8DDD5] z-30 justify-between select-none shadow-2xs"
        aria-label="Main Navigation"
      >
        <div className="flex flex-col">
          {/* Logo at the very top */}
          <div className="p-6 pb-5 border-b border-[#E8DDD5]/70">
            <NavLink
              to="/"
              className="block focus-visible:ring-2 focus-visible:ring-[#542743] rounded-xl outline-none"
            >
              <BrandLogo size={36} />
            </NavLink>
          </div>

          {/* Navigation Items Vertically */}
          <nav className="p-4 space-y-1.5" aria-label="Sidebar links">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#817780] px-3 py-1 mb-1">
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
                      ? 'bg-[#542743] text-white shadow-xs'
                      : 'text-[#817780] hover:text-[#542743] hover:bg-[#F5F0EA]/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#F5B39B]' : 'text-[#817780]'
                    }`}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-4 border-t border-[#E8DDD5]/70" ref={userMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-[#F5F0EA]/70 hover:bg-[#F5F0EA] border border-[#E8DDD5] transition-all text-left cursor-pointer"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#542743] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.displayName ? (
                    user.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#542743] truncate leading-tight">
                    {user?.displayName || (isDemo ? 'Guest' : 'User')}
                  </span>
                  <span className="text-[10px] text-[#817780] truncate">
                    {isDemo ? 'Demo Mode' : user?.email || 'Account'}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#817780] transition-transform shrink-0 ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropup / Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-[#FFFFFF] border border-[#E8DDD5] shadow-xl py-2 z-50 animate-in fade-in"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-[#E8DDD5]">
                  <p className="text-xs font-bold text-[#542743]">
                    {user?.displayName || (isDemo ? 'Guest' : 'User')}
                  </p>
                  <p className="text-[11px] text-[#817780] truncate mt-0.5">
                    {isDemo ? 'Local Sandbox' : user?.email}
                  </p>
                </div>
                <NavLink
                  to="/settings"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#302630] hover:bg-[#F5F0EA] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#817780]" />
                  <span>Settings &amp; Budget</span>
                </NavLink>
                <div className="border-t border-[#E8DDD5] pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#85274C] hover:bg-[#FBECF0] transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-[#85274C]" />
                    <span>{isDemo ? 'Exit Demo Mode' : 'Sign out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area (offset by 240px on desktop) */}
      <div className="md:pl-60 min-h-screen flex flex-col flex-1 min-w-0">
        {/* Demo Mode Banner (Peach accent) */}
        {isDemo && (
          <div className="bg-[#FDF1ED] text-[#3D1C35] px-4 py-2.5 border-b border-[#F5B39B]/60 text-xs sm:text-sm font-medium flex items-center justify-between sticky top-0 z-40 shadow-2xs">
            <div className="flex items-center gap-2 max-w-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#8A4524]" />
              <span>
                <strong>Demo mode active</strong> — Sample workspace stored in localStorage.
              </span>
            </div>
            <button
              type="button"
              onClick={exitDemoMode}
              className="px-3 py-1 bg-[#542743] text-white rounded-lg font-semibold text-xs hover:bg-[#3D1C35] transition-colors shrink-0 ml-3 cursor-pointer shadow-2xs"
            >
              Exit demo
            </button>
          </div>
        )}

        {/* Mobile Top Header */}
        <header className="md:hidden sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#E8DDD5] px-4 h-16 flex items-center justify-between shadow-2xs">
          <BrandLogo size={32} />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-[#817780] hover:text-[#542743] hover:bg-[#F5F0EA] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Slide-down Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#FFFFFF] border-b border-[#E8DDD5] p-4 space-y-2 shadow-lg animate-in slide-in-from-top-2 z-20">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#542743] text-white'
                      : 'text-[#817780] hover:text-[#542743] hover:bg-[#F5F0EA]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-[#E8DDD5] flex justify-between items-center text-xs">
              <span className="font-semibold text-[#542743]">
                {user?.displayName || 'User'}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[#85274C] font-bold"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        {/* Primary Page Container */}
        <main
          className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-10 min-w-0"
          id="main-content"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#E8DDD5] z-30 px-2 py-1.5 flex items-center justify-around shadow-lg"
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
                isActive ? 'text-[#542743]' : 'text-[#817780]'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg mb-0.5 transition-colors ${
                  isActive ? 'bg-[#FDF1ED] text-[#542743]' : 'text-[#817780]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate max-w-[60px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};
