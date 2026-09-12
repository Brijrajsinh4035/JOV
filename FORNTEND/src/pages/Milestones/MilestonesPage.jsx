import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { milestoneApi, projectApi } from '../../api';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import { SkeletonMilestones } from '../../components/common/Skeleton';
import { Calendar, ExternalLink, Clock, FolderGit2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const MilestonesPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const res = await projectApi.getAll();
        const projs = Array.isArray(res) ? res : res?.data || [];
        setProjects(projs);
        if (projs.length > 0) {
          setSelectedProjectId(projs[0]._id || projs[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    const loadMilestones = async () => {
      try {
        const res = await milestoneApi.getByProjectId(selectedProjectId);
        setMilestones(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error('Failed loading milestones', err);
      }
    };
    loadMilestones();
  }, [selectedProjectId]);

  const selectedProject = projects.find((p) => (p._id || p.id) === selectedProjectId);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Milestone Surveillance & Execution Checkpoints
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Track critical engineering, land clearance, procurement, and handover stages.
        </p>
      </div>

      {/* Project Selector Bar */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1 shrink-0">
            <FolderGit2 size={14} className="text-slate-400" />
            Scheme:
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 truncate"
          >
            {projects.map((p) => {
              const pid = p._id || p.id;
              return (
                <option key={pid} value={pid}>
                  {p.name}
                </option>
              );
            })}
          </select>
        </div>

        {selectedProject && (
          <Button
            size="sm"
            variant="secondary"
            icon={ExternalLink}
            onClick={() => navigate(`/projects/${selectedProject._id || selectedProject.id}`)}
            className="w-full sm:w-auto text-xs justify-center shrink-0"
          >
            Detailed Scheme View
          </Button>
        )}
      </div>

      {/* Milestones Timeline Gate Content */}
      <Card
        title={selectedProject ? `Checkpoints: ${selectedProject.name}` : 'Milestones'}
        subtitle="Ordered sequential deliverables and audit targets"
      >
        {isLoading ? (
          <SkeletonMilestones count={5} />
        ) : milestones.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs sm:text-sm">
            No milestones registered for this project yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {milestones.map((m, idx) => {
              const mid = m._id || m.id;
              return (
                <div
                  key={mid}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-0.5 sm:mt-0">
                      {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 break-words leading-snug">
                        {m.title}
                      </h4>
                      {m.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-10 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
                      <Calendar size={13} className="text-slate-400" />
                      <span>Due: {formatDate(m.dueDate)}</span>
                    </div>

                    <Badge status={m.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MilestonesPage;
