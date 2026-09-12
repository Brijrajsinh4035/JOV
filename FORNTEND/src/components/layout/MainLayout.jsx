import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { fetchMasterData } from '../../features/master/masterSlice';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchMasterData());
  }, [dispatch]);

  // Breadcrumb generator
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased">
      {/* Indian National Tricolor Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs shrink-0 sticky top-0 z-30" />

      <div className="flex flex-1 min-h-[calc(100vh-4px)] w-full relative">
        {/* Sidebar (Desktop persistent + Mobile off-canvas drawer) */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 w-full">
          {/* Sticky Header Unit (Navbar + Breadcrumbs) */}
          <div className="sticky top-1 z-20 shadow-xs">
            <Navbar />

            {/* Breadcrumb strip with horizontal overflow handling */}
            <div className="px-3.5 sm:px-6 lg:px-8 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none transition-colors">
              <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">National PMIS</span>
              <span className="shrink-0 text-slate-400 dark:text-slate-500">/</span>
              {pathnames.length === 0 ? (
                <span className="text-blue-700 dark:text-blue-400 font-semibold shrink-0">Central Dashboard</span>
              ) : (
                pathnames.map((name, index) => {
                  const isLast = index === pathnames.length - 1;
                  const formattedName =
                    name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
                  return (
                    <React.Fragment key={name}>
                      <span
                        className={`shrink-0 ${
                          isLast
                            ? 'text-blue-700 dark:text-blue-400 font-semibold'
                            : 'text-slate-500 dark:text-slate-400 font-normal'
                        }`}
                      >
                        {formattedName}
                      </span>
                      {!isLast && <span className="shrink-0 text-slate-400 dark:text-slate-500">/</span>}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>

          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            <Outlet />
          </main>

          {/* Government Portal Footer */}
          <footer className="px-3.5 sm:px-6 lg:px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 gap-2 text-center sm:text-left transition-colors">
            <div>
              <span>Government Integrated Project Monitoring Platform • Digital India</span>
            </div>
            <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4">
              <span>Security Audited</span>
              <span>•</span>
              <span>NIC Framework Standard</span>
              <span>•</span>
              <span>REST API Connected</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
