import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  toggleSidebar,
  toggleMobileSidebar,
  selectSidebarCollapsed,
} from '../../features/ui/uiSlice';
import { selectIsAdmin, selectCurrentUser } from '../../features/auth/authSlice';
import { setSearchQuery, selectProjectsFilters } from '../../features/projects/projectSlice';
import { Sun, Moon, Menu, Search, LogOut, Bell, ShieldCheck, X } from 'lucide-react';
import { getInitials } from '../../utils/formatters';

const Navbar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAdmin = useAppSelector(selectIsAdmin);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const { search } = useAppSelector(selectProjectsFilters);

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="w-full h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Hamburger Toggle (< md) */}
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
          title="Open Mobile Navigation Menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Sidebar Toggle (>= md) */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer items-center justify-center"
          title={sidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
        >
          <Menu size={19} />
        </button>

        {/* Brand Text */}
        <div className="flex flex-col">
          <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight leading-none">
            Project Monitor
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden xs:inline mt-0.5">
            Central Infrastructure Portal
          </span>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchOpen && (
        <div className="md:hidden absolute inset-x-0 top-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3.5 flex items-center gap-2 z-30 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search schemes or departments..."
            value={search}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Right: Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Toggle Icon */}
        <button
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center"
          title="Search"
        >
          <Search size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          onClick={toggleTheme}
          className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer flex items-center justify-center ${
            isDark
              ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 ring-1 ring-slate-700'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {isDark ? (
            <Sun size={17} className="text-amber-400 transition-transform hover:rotate-45" />
          ) : (
            <Moon size={17} className="text-blue-900 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative p-1.5 sm:p-2 rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer hidden xs:flex items-center justify-center"
          title="Project Alerts"
        >
          <Bell size={17} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Official User Card */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 py-1 px-1.5 sm:px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-800 dark:border-slate-700 rounded-lg border border-slate-200 transition-colors">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0"
            title={user?.name || user?.username || 'Officer'}
          >
            {getInitials(user?.name || user?.username || 'Officer')}
          </div>

          <div className="hidden sm:flex flex-col leading-tight max-w-[110px] truncate">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user?.name || user?.username || 'Officer'}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                }`}
              >
                {user?.role || 'VIEWER'}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center"
            title="Terminate Session"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
