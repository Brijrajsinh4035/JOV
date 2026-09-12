import React, { useEffect, useState } from 'react';
import { reportApi, projectApi } from '../../api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import { Download, RefreshCw, Calendar, Building2 } from 'lucide-react';
import { formatCrores, formatDate } from '../../utils/formatters';
import { Skeleton, SkeletonCardList } from '../../components/common/Skeleton';

const ReportsPage = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportData = async () => {
    try {
      setIsLoading(true);
      const res = await projectApi.getAll();
      const projs = Array.isArray(res) ? res : res?.data || [];
      setProjects(projs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalUtilized = projects.reduce(
    (acc, p) => acc + (Number(p.usedbudget || p.utilizedBudget) || 0),
    0
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Analytical Reports & Compliance Audits
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidated fiscal accountability and progress reports across all projects.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={loadReportData}
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={Download}
            onClick={() => reportApi.downloadCSV()}
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            Export Central CSV
          </Button>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 border-l-4 border-l-blue-600 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Monitored Projects
          </span>
          {isLoading ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3.5 w-48 mt-1" />
            </div>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {projects.length} Schemes
              </div>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
                Live MongoDB Atlas Data Synchronization
              </span>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 border-l-4 border-l-purple-600 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Cumulative Sanctioned Outlay
          </span>
          {isLoading ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3.5 w-40 mt-1" />
            </div>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCrores(totalBudget)}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                Total Sanctioned Capital Outlay
              </span>
            </>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-600 shadow-xs sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Expenditure Incurred
          </span>
          {isLoading ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-3.5 w-36 mt-1" />
            </div>
          ) : (
            <>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCrores(totalUtilized)}
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                {totalBudget ? Math.round((totalUtilized / totalBudget) * 100) : 0}% Overall Budget Burn
              </span>
            </>
          )}
        </div>
      </div>

      {/* Official Audit Summary Table: Desktop Table + Mobile Cards */}
      <Card
        title="Infrastructure Pipeline Audit Log"
        subtitle="Full registry export view with financial burn and timeline compliance"
      >
        {/* DESKTOP TABLE (hidden on < md) */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5">Scheme ID</th>
                <th className="px-4 py-3.5">Scheme Name</th>
                <th className="px-4 py-3.5">Sponsoring Client</th>
                <th className="px-4 py-3.5">Sanctioned Budget</th>
                <th className="px-4 py-3.5">Expenditure</th>
                <th className="px-4 py-3.5">Burn Rate</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Start Date</th>
                <th className="px-4 py-3.5">Target Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`report-skel-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3 w-16" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-3 w-16" /></td>
                  </tr>
                ))
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400 dark:text-slate-500">
                    No project records loaded.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const b = Number(p.budget || 0);
                  const u = Number(p.usedbudget || p.utilizedBudget || 0);
                  const burn = b > 0 ? Math.round((u / b) * 100) : 0;
                  return (
                    <tr key={p._id || p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {(p._id || p.id).slice(-8)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {p.name}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300 max-w-[140px] truncate">
                        {p.clientId?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">{formatCrores(b)}</td>
                      <td className="px-4 py-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">{formatCrores(u)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-bold text-xs ${
                            burn > 90 ? 'text-rose-600' : 'text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {burn}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={p.status} />
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(p.startDate)}</td>
                      <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(p.endDate)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE AUDIT CARDS (displayed on < md) */}
        <div className="md:hidden flex flex-col gap-3">
          {isLoading ? (
            <SkeletonCardList count={4} />
          ) : projects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No project records loaded.
            </div>
          ) : (
            projects.map((p) => {
              const b = Number(p.budget || 0);
              const u = Number(p.usedbudget || p.utilizedBudget || 0);
              const burn = b > 0 ? Math.round((u / b) * 100) : 0;

              return (
                <div
                  key={p._id || p.id}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 block mb-0.5">
                        #{(p._id || p.id).slice(-8)}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug break-words">
                        {p.name}
                      </h4>
                    </div>
                    <Badge status={p.status} className="shrink-0" />
                  </div>

                  {p.clientId?.name && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 size={12} className="text-slate-400" />
                      {p.clientId.name}
                    </span>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200/70 dark:border-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Sanctioned</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{formatCrores(b)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Incurred</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCrores(u)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                      <Calendar size={12} className="text-slate-400" />
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                    </span>
                    <span
                      className={`font-bold text-xs ${
                        burn > 90 ? 'text-rose-600' : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      Burn: {burn}%
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

export default ReportsPage;

