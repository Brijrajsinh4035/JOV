import React, { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchMasterData } from '../../features/master/masterSlice';
import {
  fetchProjects,
  selectAllProjects,
  selectActiveProject,
} from '../../features/projects/projectSlice';
import Sidebar from './Sidebar';  
import Navbar from './Navbar';
import { Home, ChevronRight } from 'lucide-react';

const ROUTE_LABELS = {
  projects: 'Project Directory',
  new: 'New Project',
  create: 'New Project',
  tasks: 'Task Management',
  risks: 'Risk Register',
  milestones: 'Milestones & Gates',
  reports: 'Analytical Reports',
  dashboard: 'Executive Dashboard',
  login: 'Sign In',
  register: 'Officer Registration',
};

const formatBreadcrumbSegment = (segment, index, allSegments, activeProject, allProjects) => {
  const lower = segment.toLowerCase();
  if (ROUTE_LABELS[lower]) {
    return ROUTE_LABELS[lower];
  }
  // Check if it's a 24-character hexadecimal MongoDB ObjectId or project ID
  if (/^[a-f\d]{24}$/i.test(segment) || (index > 0 && allSegments[index - 1] === 'projects')) {
    if (activeProject && (activeProject._id === segment || activeProject.id === segment)) {
      return activeProject.name || 'Project Details';
    }
    const matched = allProjects?.find((p) => p._id === segment || p.id === segment);
    if (matched && matched.name) {
      return matched.name;
    }
    return 'Project Details';
  }
  return segment
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const MainLayout = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const activeProject = useAppSelector(selectActiveProject);
  const allProjects = useAppSelector(selectAllProjects);

  useEffect(() => {
    dispatch(fetchMasterData());
    dispatch(fetchProjects());
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

            {/* Interactive Breadcrumb strip */}
            <nav
              aria-label="Breadcrumb navigation"
              className="px-3.5 sm:px-6 lg:px-8 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none transition-colors"
            >
              <Link
                to="/"
                className={`flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                  pathnames.length === 0
                    ? 'text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-medium'
                }`}
                title="Go to National PMIS Dashboard"
              >
                <Home
                  size={13}
                  className={
                    pathnames.length === 0
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }
                />
                <span>National PMIS</span>
              </Link>

              {pathnames.length === 0 && (
                <>
                  <ChevronRight size={13} className="shrink-0 text-slate-400 dark:text-slate-600" />
                  <Link
                    to="/"
                    className="font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline shrink-0 cursor-pointer"
                    aria-current="page"
                    title="Executive Dashboard"
                  >
                    Executive Dashboard
                  </Link>
                </>
              )}

              {pathnames.map((name, index) => {
                const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
                const isLast = index === pathnames.length - 1;
                const formattedName = formatBreadcrumbSegment(
                  name,
                  index,
                  pathnames,
                  activeProject,
                  allProjects
                );

                return (
                  <React.Fragment key={routeTo}>
                    <ChevronRight
                      size={13}
                      className="shrink-0 text-slate-400 dark:text-slate-600"
                    />
                    <Link
                      to={routeTo}
                      className={`shrink-0 cursor-pointer transition-colors ${
                        isLast
                          ? 'font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline'
                          : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:underline font-medium'
                      }`}
                      aria-current={isLast ? 'page' : undefined}
                      title={
                        isLast
                          ? `Current location: ${formattedName}`
                          : `Navigate to ${formattedName}`
                      }
                    >
                      {formattedName}
                    </Link>
                  </React.Fragment>
                );
              })}
            </nav>
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
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
