import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  selectSidebarCollapsed,
  selectMobileSidebarOpen,
  closeMobileSidebar,
} from '../../features/ui/uiSlice';
import { selectIsAdmin } from '../../features/auth/authSlice';
import {
  LayoutDashboard,
  FolderKanban,
  GitCommit,
  FileBarChart2,
  PlusCircle,
  Building2,
  ChevronRight,
  Shield,
  ShieldCheck,
  Bot,
  Sparkles,
  X,
  Users,
} from 'lucide-react';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const mobileOpen = useAppSelector(selectMobileSidebarOpen);
  const isAdmin = useAppSelector(selectIsAdmin);

  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects Directory', path: '/projects', icon: FolderKanban },
    { name: 'Milestones', path: '/milestones', icon: GitCommit },
    { name: 'Task Board', path: '/tasks', icon: FolderKanban },
    { name: 'Client Agencies', path: '/clients', icon: Building2 },
    { name: 'Assigned Teams', path: '/teams', icon: Users },
    { name: 'Risk Register', path: '/risks', icon: Shield },
    { name: 'Analytical Reports', path: '/reports', icon: FileBarChart2 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, isAi: true },
  ];

  const handleLinkClick = () => {
    dispatch(closeMobileSidebar());
  };

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => dispatch(closeMobileSidebar())}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-950 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shrink-0 md:static md:sticky md:top-0 md:h-screen md:z-30 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'} w-72 max-w-[85vw] h-full`}
      >
        {/* Government Emblem & Portal Header */}
        <div
          className={`h-16 flex items-center gap-3 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 px-4 sm:px-5 justify-between ${
            collapsed ? 'md:justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-900 to-slate-900 border border-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Building2 size={20} className="text-white" />
            </div>

            <div className={`flex flex-col overflow-hidden ${collapsed ? 'md:hidden' : 'flex'}`}>
              <span className="font-bold text-sm text-white tracking-tight truncate">
                PMO ProjectHub
              </span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider truncate">
                Govt. of India Platform
              </span>
            </div>
          </div>

          {/* Close Button for Mobile Drawer */}
          <button
            onClick={() => dispatch(closeMobileSidebar())}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden transition-colors cursor-pointer"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="p-3 flex-1 flex flex-col gap-1 overflow-y-auto">
          <span
            className={`text-[10px] font-bold uppercase text-slate-400 px-3 py-1.5 tracking-wider ${
              collapsed ? 'md:hidden' : 'block'
            }`}
          >
            Core Operations
          </span>

          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span
                  className={`flex-1 whitespace-nowrap truncate flex items-center justify-between ${
                    collapsed ? 'md:hidden' : 'flex'
                  }`}
                >
                  <span>{item.name}</span>
                  {item.isAi && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500 text-slate-950 font-mono tracking-wider">
                      AI
                    </span>
                  )}
                </span>
                {!item.isAi && (
                  <ChevronRight
                    size={14}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 ${
                      collapsed ? 'md:hidden' : 'block'
                    }`}
                  />
                )}
              </NavLink>
            );
          })}

          {/* Admin-only Section */}
          {isAdmin && (
            <>
              <span
                className={`text-[10px] font-bold uppercase text-amber-400 px-3 pt-3 pb-1 tracking-wider ${
                  collapsed ? 'md:hidden' : 'block'
                }`}
              >
                Administrative Controls
              </span>

              <NavLink
                to="/projects/new"
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-amber-400 hover:bg-slate-900 hover:text-amber-300'
                  }`
                }
                title={collapsed ? 'Add Project' : undefined}
              >
                <PlusCircle size={18} className="shrink-0" />
                <span
                  className={`flex-1 whitespace-nowrap truncate ${
                    collapsed ? 'md:hidden' : 'block'
                  }`}
                >
                  Add New Project
                </span>
                <span
                  className={`text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded ml-auto shrink-0 ${
                    collapsed ? 'md:hidden' : 'inline-block'
                  }`}
                >
                  ADMIN
                </span>
              </NavLink>
            </>
          )}
        </div>

        {/* Role Footer Status */}
        <div
          className={`p-3 m-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 ${
            collapsed ? 'md:hidden' : 'block'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {isAdmin ? (
              <ShieldCheck size={16} className="text-amber-400 shrink-0" />
            ) : (
              <Shield size={16} className="text-sky-400 shrink-0" />
            )}
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {isAdmin ? 'ADMIN PRIVILEGES' : 'MANAGER ACCESS'}
            </span>
          </div>
          {/* <p className="text-[11px] text-slate-400 leading-snug">
            {isAdmin
              ? 'Full management authorization: create, edit, milestone updates & status transitions.'
              : 'Read-only monitoring access: viewing analytics, project status & generating reports.'}
          </p> */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
