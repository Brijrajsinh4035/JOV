import React, { useEffect, useState } from 'react';
import { riskApi, projectApi } from '../../api';
import { useAppDispatch } from '../../app/hooks';
import { addToast } from '../../features/ui/uiSlice';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import { Skeleton, SkeletonCardList } from '../../components/common/Skeleton';
import { Plus, RefreshCw, Trash2, ShieldAlert, FolderGit2, Calendar } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const RisksPage = () => {
  const dispatch = useAppDispatch();
  const [risks, setRisks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Modals
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      if (projs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projs[0]._id || projs[0].id);
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed loading risks' }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (!riskTitle.trim() || !selectedProjectId) return;

    try {
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
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to create risk' }));
    }
  };

  const handleStatusChange = async (riskId, nextStatus) => {
    try {
      await riskApi.update(riskId, { status: nextStatus });
      dispatch(addToast({ type: 'info', message: `Risk marked as ${nextStatus}` }));
      loadData();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed updating risk status' }));
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (window.confirm('Remove this risk item from register?')) {
      try {
        await riskApi.delete(riskId);
        dispatch(addToast({ type: 'info', message: 'Risk record removed' }));
        loadData();
      } catch (err) {
        dispatch(addToast({ type: 'error', message: err.message || 'Failed deleting risk' }));
      }
    }
  };

  const filteredRisks = risks.filter((r) => {
    const projId = r.projectId?._id || r.projectId;
    const matchesProj = projectFilter === 'ALL' || String(projId) === String(projectFilter);
    const matchesSev = severityFilter === 'ALL' || r.severity === severityFilter;
    return matchesProj && matchesSev;
  });

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
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
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
              filteredRisks.map((r) => {
                const rId = r._id || r.id;
                const projName = r.projectId?.name || 'Assigned Project';
                return (
                  <tr key={rId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 break-words">{r.title}</span>
                        {r.description && (
                          <span className="text-xs text-slate-400 truncate">{r.description}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 max-w-[160px] truncate">{projName}</td>
                    <td className="px-4 py-3.5">
                      <Badge status={r.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex gap-1.5 justify-end">
                        {r.status === 'open' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(rId, 'mitigated')}
                            className="text-xs"
                          >
                            Mark Mitigated
                          </Button>
                        )}
                        {r.status === 'mitigated' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(rId, 'closed')}
                            className="text-xs"
                          >
                            Close
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDeleteRisk(rId)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE RISK CARDS VIEW (displayed on < md) */}
      <div className="md:hidden flex flex-col gap-3">
        {isLoading ? (
          <SkeletonCardList count={4} />
        ) : filteredRisks.length === 0 ? (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-400 text-xs">
            No risks recorded under the selected criteria.
          </div>
        ) : (
          filteredRisks.map((r) => {
            const rId = r._id || r.id;
            const projName = r.projectId?.name || 'Assigned Project';

            return (
              <div
                key={rId}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit mb-1 truncate max-w-[200px]">
                      {projName}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug break-words">
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

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge status={r.status} />
                    <span className="text-[11px] text-slate-400">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {r.status === 'open' && (
                      <button
                        onClick={() => handleStatusChange(rId, 'mitigated')}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Mitigate
                      </button>
                    )}
                    {r.status === 'mitigated' && (
                      <button
                        onClick={() => handleStatusChange(rId, 'closed')}
                        className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteRisk(rId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Risk"
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

      {/* CREATE RISK MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Project Risk">
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
            >
              {projects.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Risk Title *"
            placeholder="e.g. Land compensation court stay in segment B"
            value={riskTitle}
            onChange={(e) => setRiskTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Incident / Risk Description
            </label>
            <textarea
              rows={3}
              placeholder="Outline potential impact on timelines and costs..."
              value={riskDesc}
              onChange={(e) => setRiskDesc(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Severity
              </label>
              <select
                value={riskSeverity}
                onChange={(e) => setRiskSeverity(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
              >
                <option value="low">LOW</option>
                <option value="medium">MEDIUM</option>
                <option value="high">HIGH</option>
                <option value="critical">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Initial Status
              </label>
              <select
                value={riskStatus}
                onChange={(e) => setRiskStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 uppercase"
              >
                <option value="open">OPEN</option>
                <option value="mitigated">MITIGATED</option>
                <option value="closed">CLOSED</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              className="w-full sm:w-auto"
            >
              Log Risk Incident
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RisksPage;
