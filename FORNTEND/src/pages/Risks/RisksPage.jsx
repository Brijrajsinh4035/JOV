import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskApi, projectApi } from '../../api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/ui/uiSlice';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import ConfirmationModal from '../../components/common/ConfirmationModal/ConfirmationModal';
import Pagination from '../../components/common/Pagination/Pagination';
import { Skeleton, SkeletonCardList } from '../../components/common/Skeleton';
import { Plus, RefreshCw, Trash2, ShieldAlert, FolderGit2, Calendar, Download } from 'lucide-react';
import { formatCrores, formatDate, exportToExcelReadOnly } from '../../utils/formatters';

const RisksPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [risks, setRisks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingRiskId, setUpdatingRiskId] = useState(null);
  const [riskToDelete, setRiskToDelete] = useState(null);
  const [isDeletingRisk, setIsDeletingRisk] = useState(false);

  // Filters & Modals
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [riskTitle, setRiskTitle] = useState('');
  const [riskDesc, setRiskDesc] = useState('');
  const [riskSeverity, setRiskSeverity] = useState('medium');
  const [riskStatus, setRiskStatus] = useState('open');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [rRes, pRes] = await Promise.all([riskApi.getAll(), projectApi.getAll()]);
      setRisks(Array.isArray(rRes) ? rRes : rRes?.data || []);
      const projs = Array.isArray(pRes) ? pRes : pRes?.data || [];
      setProjects(projs);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed loading risks' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateModal = () => {
    setRiskTitle('');
    setRiskDesc('');
    setRiskSeverity('medium');
    setRiskStatus('open');
    setSelectedProjectId('');
    setIsModalOpen(true);
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!riskTitle.trim() || !selectedProjectId) {
      dispatch(addToast({ type: 'error', message: 'Scheme and risk title are required' }));
      return;
    }

    try {
      setIsSubmitting(true);
      await riskApi.create({
        projectId: selectedProjectId,
        title: riskTitle.trim(),
        description: riskDesc.trim(),
        severity: riskSeverity,
        status: riskStatus,
      });
      dispatch(addToast({ type: 'success', message: 'Risk incident registered' }));
      setIsModalOpen(false);
      setRiskTitle('');
      setRiskDesc('');
      setSelectedProjectId('');
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to create risk' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (riskId, nextStatus) => {
    if (updatingRiskId === riskId) return;
    try {
      setUpdatingRiskId(riskId);
      await riskApi.update(riskId, { status: nextStatus });
      dispatch(addToast({ type: 'info', message: `Risk status updated to ${nextStatus}` }));
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed updating risk status' }));
    } finally {
      setUpdatingRiskId(null);
    }
  };

  const handleDeleteRisk = (risk) => {
    if (typeof risk === 'object' && risk !== null) {
      setRiskToDelete({ id: risk._id || risk.id, title: risk.title || 'Untitled Risk' });
    } else {
      const found = risks.find((r) => (r._id || r.id) === risk);
      setRiskToDelete({ id: risk, title: found?.title || 'Untitled Risk' });
    }
  };

  const handleConfirmDeleteRisk = async () => {
    if (!riskToDelete || isDeletingRisk) return;
    try {
      setIsDeletingRisk(true);
      await riskApi.delete(riskToDelete.id);
      dispatch(addToast({ type: 'info', message: 'Risk record removed' }));
      setRiskToDelete(null);
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed deleting risk' }));
    } finally {
      setIsDeletingRisk(false);
    }
  };

  const filteredRisks = risks.filter((r) => {
    const projId = r.projectId?._id || r.projectId;
    const matchesProj = projectFilter === 'ALL' || String(projId) === String(projectFilter);
    const matchesSev = severityFilter === 'ALL' || r.severity === severityFilter;
    return matchesProj && matchesSev;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [projectFilter, severityFilter]);

  // Paginated risks
  const paginatedRisks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRisks.slice(startIndex, startIndex + pageSize);
  }, [filteredRisks, currentPage, pageSize]);

  const handleExportExcel = () => {
    if (!filteredRisks || filteredRisks.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'No risks match the current filter to export.' }));
      return;
    }

    const headers = [
      { label: 'Risk Incident', key: 'title', value: (r) => r.title || 'Untitled' },
      { label: 'Severity Level', key: 'severity', value: (r) => (r.severity || 'Medium').toUpperCase() },
      { label: 'Current Status', key: 'status', value: (r) => (r.status || 'open').toUpperCase() },
      { label: 'Linked Infrastructure Scheme', key: 'project', value: (r) => r.projectId?.name || r.projectId?.title || 'General' },
      { label: 'Vulnerability Description', key: 'description', value: (r) => r.description || 'N/A' },
      { label: 'Mitigation Workflow / Action', key: 'mitigation', value: (r) => r.mitigation || r.mitigationPlan || 'Active Surveillance' },
      { label: 'Date Logged', key: 'date', value: (r) => formatDate(r.createdAt || r.dateIdentified) },
    ];

    const projName = projectFilter === 'ALL' ? 'all_schemes' : 'filtered_scheme';
    const sevName = severityFilter === 'ALL' ? 'all_severities' : severityFilter.toLowerCase();
    const filename = `risk_register_${projName}_${sevName}_${new Date().toISOString().slice(0, 10)}.xls`;

    const success = exportToExcelReadOnly(filteredRisks, headers, filename, 'Risk Register');
    if (success) {
      dispatch(
        addToast({
          type: 'success',
          message: `Exported ${filteredRisks.length} risk incident(s) to Read-Only Excel`,
        })
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            National Risk Register & Surveillance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audited vulnerability logs, contractor bottlenecks, and mitigation workflows
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            isLoading={isLoading}
            onClick={loadData}
            className="flex-1 sm:flex-initial"
          >
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportExcel}
            className="flex-1 sm:flex-initial"
            title={`Export ${filteredRisks.length} filtered risks to Read-Only Excel`}
          >
            Export Excel (Read-Only) ({filteredRisks.length})
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleOpenCreateModal}
            className="flex-1 sm:flex-initial"
          >
            Log New Risk
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 shrink-0">
            <FolderGit2 size={13} className="text-slate-400" />
            Scheme:
          </span>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 truncate"
          >
            <option value="ALL">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p._id || p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 shrink-0">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW (hidden on < md) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5">Risk Summary</th>
              <th className="px-4 py-3.5">Associated Scheme</th>
              <th className="px-4 py-3.5">Severity</th>
              <th className="px-4 py-3.5">Current Status</th>
              <th className="px-4 py-3.5">Logged On</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-risk-${i}`} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-3 w-36" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-32" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3.5"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3.5 text-right"><Skeleton className="h-7 w-20 ml-auto rounded-lg" /></td>
                </tr>
              ))
            ) : filteredRisks.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No risks recorded under the selected criteria.
                </td>
              </tr>
            ) : (
              paginatedRisks.map((r) => {
              const rId = r._id || r.id;
              const projId =
                r.projectId?._id ||
                r.projectId?.id ||
                (typeof r.projectId === 'string' ? r.projectId : null);
              const projName = r.projectId?.name || 'Assigned Project';

              return (
                <tr
                  key={rId}
                  onClick={() => {
                    if (projId) navigate(`/projects/${projId}`);
                  }}
                  className={`hover:bg-blue-50/40 dark:hover:bg-slate-700/40 transition-colors group ${
                    projId ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="px-4 py-3.5 max-w-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors break-words">
                        {r.title}
                      </span>
                      {r.description && (
                        <span className="text-xs text-slate-400 truncate">{r.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs max-w-[170px] truncate">
                    {projId ? (
                      <span
                        className="font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 inline-flex items-center gap-1.5 transition-colors"
                        title={`View scheme details for ${projName}`}
                      >
                        <FolderGit2 size={13} className="shrink-0 text-blue-500/80" />
                        <span className="truncate">{projName}</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400">{projName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge status={r.severity} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge status={r.status} />
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.status === 'open' && (
                        <>
                          <button
                            type="button"
                            disabled={updatingRiskId === rId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(rId, 'mitigated');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Mark as Mitigated"
                          >
                            Mitigate
                          </button>
                          <button
                            type="button"
                            disabled={updatingRiskId === rId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(rId, 'closed');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Mark as Closed"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {r.status === 'mitigated' && (
                        <>
                          <button
                            type="button"
                            disabled={updatingRiskId === rId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(rId, 'closed');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Mark as Closed"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            disabled={updatingRiskId === rId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(rId, 'open');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Reopen Risk"
                          >
                            Reopen
                          </button>
                        </>
                      )}
                      {r.status === 'closed' && (
                        <button
                          type="button"
                          disabled={updatingRiskId === rId}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(rId, 'open');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Reopen Risk"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isDeletingRisk}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRisk(r);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Delete Risk Record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* MOBILE: High-Fidelity Responsive Risk Cards (displayed on < md) */}
    <div className="md:hidden flex flex-col gap-3">
      {isLoading ? (
        <SkeletonCardList count={4} />
      ) : filteredRisks.length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs">
          No risks recorded under the selected criteria.
        </div>
      ) : (
        paginatedRisks.map((r) => {
          const rId = r._id || r.id;
          const projId =
            r.projectId?._id ||
            r.projectId?.id ||
            (typeof r.projectId === 'string' ? r.projectId : null);
          const projName = r.projectId?.name || 'Assigned Project';

          return (
            <div
              key={rId}
              onClick={() => {
                if (projId) navigate(`/projects/${projId}`);
              }}
              className={`bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-2.5 transition-all group ${
                projId ? 'cursor-pointer hover:border-blue-300' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {projId ? (
                    <span
                      className="text-[10px] font-bold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/40 px-2 py-0.5 rounded-md uppercase tracking-wider inline-flex items-center gap-1 w-fit mb-1 truncate max-w-[220px]"
                      title={`View scheme details for ${projName}`}
                    >
                      <FolderGit2 size={11} className="shrink-0" />
                      <span className="truncate">{projName}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-1 truncate max-w-[200px]">
                      {projName}
                    </span>
                  )}
                  <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors leading-snug break-words">
                    {r.title}
                  </h4>
                  {r.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {r.description}
                    </p>
                  )}
                </div>
                <Badge status={r.severity} className="shrink-0" />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge status={r.status} />
                  <span className="text-[11px] text-slate-400">
                    {formatDate(r.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {r.status === 'open' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingRiskId === rId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rId, 'mitigated');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer border border-amber-200"
                      >
                        Mitigate
                      </button>
                      <button
                        type="button"
                        disabled={updatingRiskId === rId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rId, 'closed');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                      >
                        Close
                      </button>
                    </>
                  )}
                  {r.status === 'mitigated' && (
                    <>
                      <button
                        type="button"
                        disabled={updatingRiskId === rId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rId, 'closed');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={updatingRiskId === rId}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(rId, 'open');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                      >
                        Reopen
                      </button>
                    </>
                  )}
                  {r.status === 'closed' && (
                    <button
                      type="button"
                      disabled={updatingRiskId === rId}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(rId, 'open');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isDeletingRisk}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRisk(r);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && filteredRisks.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredRisks.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50]}
        />
      )}

      {/* CREATE RISK MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title="Log New Project Risk"
      >
        <form onSubmit={handleCreateRisk} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Scheme *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
              required
              disabled={isSubmitting}
            >
              <option value="">-- Select Sponsoring Infrastructure Scheme --</option>
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Risk Incident Title *"
            placeholder="e.g. Land compensation court stay in segment B"
            value={riskTitle}
            onChange={(e) => setRiskTitle(e.target.value)}
            required
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Incident / Vulnerability Description
            </label>
            <textarea
              rows={3}
              placeholder="Outline potential impact on timelines and costs..."
              value={riskDesc}
              onChange={(e) => setRiskDesc(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* BUTTON-BASED SEVERITY SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Severity Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'low',
                  label: 'Low',
                  activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
                {
                  id: 'medium',
                  label: 'Medium',
                  activeClass: 'bg-yellow-500 text-slate-950 font-bold border-yellow-500 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
                {
                  id: 'high',
                  label: 'High',
                  activeClass: 'bg-orange-600 text-white border-orange-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
                {
                  id: 'critical',
                  label: 'Critical',
                  activeClass: 'bg-rose-600 text-white border-rose-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
              ].map((sev) => (
                <button
                  key={sev.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setRiskSeverity(sev.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    riskSeverity === sev.id ? sev.activeClass : sev.idleClass
                  }`}
                >
                  {sev.label}
                </button>
              ))}
            </div>
          </div>

          {/* BUTTON-BASED STATUS SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Initial Operational Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'open',
                  label: 'Open',
                  activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
                {
                  id: 'mitigated',
                  label: 'Mitigated',
                  activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
                {
                  id: 'closed',
                  label: 'Closed',
                  activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
                  idleClass: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setRiskStatus(st.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                    riskStatus === st.id ? st.activeClass : st.idleClass
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={isSubmitting || !riskTitle.trim() || !selectedProjectId}
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Log Risk Incident
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal for Risk Removal */}
      <ConfirmationModal
        isOpen={!!riskToDelete}
        onClose={() => !isDeletingRisk && setRiskToDelete(null)}
        onConfirm={handleConfirmDeleteRisk}
        title="Remove Risk Incident"
        message="Are you sure you want to remove this risk entry from the project register?"
        itemName={riskToDelete?.title}
        confirmText="Delete Risk"
        cancelText="Cancel"
        confirmVariant="danger"
        icon={Trash2}
        isLoading={isDeletingRisk}
      />
    </div>
  );
};

export default RisksPage;
