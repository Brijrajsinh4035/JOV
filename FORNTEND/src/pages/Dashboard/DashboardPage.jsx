import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import {
  fetchDashboardStats,
  selectDashboardData,
  selectDashboardLoading,
} from '../../features/dashboard/dashboardSlice';
import { selectIsAdmin } from '../../features/auth/authSlice';
import { addToast } from '../../features/ui/uiSlice';
import { reportApi } from '../../api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import { Skeleton, SkeletonKpi, SkeletonTable } from '../../components/common/Skeleton';
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  IndianRupee,
  TrendingUp,
  PlusCircle,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCrores, formatDate } from '../../utils/formatters';

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dashboardData = useAppSelector(selectDashboardData);
  const isLoading = useAppSelector(selectDashboardLoading);
  const isAdmin = useAppSelector(selectIsAdmin);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchDashboardStats());
    setRefreshing(false);
    dispatch(addToast({ type: 'info', message: 'Dashboard analytics refreshed' }));
  };

  const handleExportCSV = () => {
    reportApi.downloadCSV();
    dispatch(addToast({ type: 'success', message: 'Downloading projects CSV report...' }));
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Executive Banner Skeleton */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl sm:rounded-2xl p-5 sm:p-7 shadow-md flex flex-col gap-3">
          <Skeleton className="h-4 w-40 bg-slate-800" />
          <Skeleton className="h-7 w-3/5 bg-slate-800" />
          <Skeleton className="h-4 w-2/5 bg-slate-800" />
        </div>

        {/* 6 KPI Cards Skeleton */}
        <SkeletonKpi count={6} />

        {/* Analytics Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-4">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-60" />
            <div className="h-56 flex items-center justify-center">
              <Skeleton className="h-44 w-44 rounded-full" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col gap-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-52" />
            <div className="h-56 flex flex-col justify-center gap-4">
              <Skeleton className="h-6 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Schemes Table Skeleton */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-48" />
          <SkeletonTable rows={4} columns={7} />
        </div>
      </div>
    );
  }

  const kpis = dashboardData?.kpis || {
    totalProjects: 0,
    activeProjects: 0,
    planningProjects: 0,
    onHoldProjects: 0,
    completedProjects: 0,
    totalBudget: 0,
    utilizedBudget: 0,
    remainingBudget: 0,
    overallUtilizationPercent: 0,
    totalTasks: 0,
    openRisks: 0,
  };

  const statusDistribution = dashboardData?.statusDistribution || [];
  const criticalRisks = dashboardData?.criticalRisks || [];
  const recentProjects = dashboardData?.recentProjects || [];

  const kpiCards = [
    {
      title: 'Total Projects',
      value: kpis.totalProjects,
      subtext: 'Central Project Repository',
      icon: Building2,
      borderClass: 'border-l-blue-600',
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      title: 'Active Schemes',
      value: kpis.activeProjects || 0,
      subtext: 'Currently in execution',
      icon: Clock,
      borderClass: 'border-l-sky-500',
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    {
      title: 'On-Hold Schemes',
      value: kpis.onHoldProjects || 0,
      subtext: 'Awaiting clearance / unblocking',
      icon: AlertTriangle,
      borderClass: 'border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      title: 'Completed Schemes',
      value: kpis.completedProjects || 0,
      subtext: 'Fully commissioned',
      icon: CheckCircle2,
      borderClass: 'border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Sanctioned Budget',
      value: formatCrores(kpis.totalBudget),
      subtext: 'Total Financial Outlay',
      icon: IndianRupee,
      borderClass: 'border-l-indigo-500',
      iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'Expenditure Incurred',
      value: formatCrores(kpis.utilizedBudget || kpis.usedbudget),
      subtext: `${kpis.overallUtilizationPercent}% Budget Burn`,
      icon: TrendingUp,
      borderClass: 'border-l-amber-500',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Platform Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-7 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-slate-950">
              PMO Integrated Hub
            </span>
            <span className="text-[11px] sm:text-xs text-slate-300">
              Live Telemetry & Surveillance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
            Project Monitoring Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Surveillance across schemes, milestones, tasks, risks, and audited expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={refreshing}
            onClick={handleRefresh}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-initial"
          >
            Refresh
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 flex-1 sm:flex-initial"
          >
            Export CSV
          </Button>

          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/projects/new')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none w-full sm:w-auto"
            >
              Register Project
            </Button>
          )}
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 border-l-4 ${kpi.borderClass} shadow-xs flex items-start justify-between hover:shadow-md transition-shadow gap-2`}
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-slate-600 truncate block">
                  {kpi.title}
                </span>
                <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1 break-words">
                  {kpi.value}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {kpi.subtext}
                </span>
              </div>
              <div className={`p-2 rounded-lg border shrink-0 ${kpi.iconBg}`}>
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Analytics Row: Status Distribution + Budget Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Project Status Distribution Donut Chart */}
        <Card title="Project Lifecycle Breakdown" subtitle="Distribution by active status stage">
          <div className="w-full h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#1d467a'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} Schemes`, name?.toUpperCase()]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => value.toUpperCase()}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Budget Allocation & Utilization */}
        <Card title="Fiscal Outlay & Burn" subtitle="Financial allocation versus audited execution">
          <div className="flex flex-col justify-center gap-4 sm:gap-5 h-full">
            <div className="flex justify-between items-center gap-2">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Sanctioned Budget
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                  {formatCrores(kpis.totalBudget)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-slate-500">
                  Expenditure Incurred
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5">
                  {formatCrores(kpis.utilizedBudget || kpis.usedbudget)}
                </h3>
              </div>
            </div>

            {/* Visual Budget Bar */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                <span>Budget Consumption</span>
                <span className="font-bold text-blue-700">
                  {kpis.overallUtilizationPercent}% Utilized
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-blue-700 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(kpis.overallUtilizationPercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs text-slate-500 block">
                  Remaining Unutilized
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-800">
                  {formatCrores(kpis.remainingBudget)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">
                  Open Risks / Issues
                </span>
                <span
                  className={`text-sm sm:text-base font-bold ${
                    kpis.openRisks > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {kpis.openRisks} Flags
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Critical Risks Alert Section */}
      <Card
        title="High & Critical Risk Register Alerts"
        subtitle="Surveillance flags requiring intervention"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            onClick={() => navigate('/risks')}
          >
            View Register
          </Button>
        }
      >
        {criticalRisks.length === 0 ? (
          <div className="p-4 sm:p-6 text-center text-emerald-600">
            <CheckCircle2 size={24} className="mx-auto mb-2" />
            <p className="font-semibold text-xs sm:text-sm">
              All schemes currently adhering to risk compliance tolerances.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {criticalRisks.map((risk) => (
              <div
                key={risk._id || risk.id}
                className="p-3 sm:p-3.5 rounded-xl border border-rose-200 bg-rose-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge status={risk.severity} />
                    <span className="font-bold text-xs sm:text-sm text-rose-900 break-words">
                      {risk.title}
                    </span>
                  </div>
                  {risk.description && (
                    <p className="text-xs text-rose-700 mt-1 line-clamp-2">
                      {risk.description}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate('/risks')}
                  className="self-start sm:self-center shrink-0 text-xs"
                >
                  Review
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Infrastructure Schemes: Desktop Table + Mobile Cards */}
      <Card
        title="Recent Infrastructure Schemes"
        subtitle="Active projects in the surveillance pipeline"
        headerAction={
          <Button
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            onClick={() => navigate('/projects')}
          >
            Directory
          </Button>
        }
      >
        {/* Desktop / Tablet Table View (hidden on small mobile) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Scheme Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sanctioned Budget</th>
                <th className="px-4 py-3">Used Budget</th>
                <th className="px-4 py-3">Start Date</th>
                <th className="px-4 py-3">End Date</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentProjects.map((p) => {
                const pid = p._id || p.id;
                return (
                  <tr key={pid} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs truncate">
                      {p.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={p.status} />
                    </td>
                    <td className="px-4 py-3">{formatCrores(p.budget)}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">
                      {formatCrores(p.usedbudget)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(p.startDate)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(p.endDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/projects/${pid}`)}>
                        View
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (displayed only on < md) */}
        <div className="md:hidden flex flex-col gap-3">
          {recentProjects.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No recent schemes found.</p>
          ) : (
            recentProjects.map((p) => {
              const pid = p._id || p.id;
              return (
                <div
                  key={pid}
                  onClick={() => navigate(`/projects/${pid}`)}
                  className="p-3.5 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 transition-all flex flex-col gap-2.5 cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
                      {p.name}
                    </h4>
                    <Badge status={p.status} className="shrink-0" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/70">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Sanctioned</span>
                      <span className="font-bold text-slate-800">{formatCrores(p.budget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Incurred</span>
                      <span className="font-bold text-emerald-600">{formatCrores(p.usedbudget)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </span>
                    <span className="text-blue-700 font-semibold flex items-center gap-0.5">
                      View <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
