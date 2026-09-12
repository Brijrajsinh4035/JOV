import { projectDao } from '../dao/project.dao.js';
import { taskDao } from '../dao/task.dao.js';
import { riskDao } from '../dao/risk.dao.js';

export const dashboardService = {
  getStats: async () => {
    const result = await projectDao.findAll({ limit: 500 });
    const projects = result.data || [];

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'active').length;
    const planningProjects = projects.filter((p) => p.status === 'planning').length;
    const onHoldProjects = projects.filter((p) => p.status === 'on-hold').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const cancelledProjects = projects.filter((p) => p.status === 'cancelled').length;

    const totalBudget = Number(
      projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0).toFixed(2)
    );
    const utilizedBudget = Number(
      projects.reduce((acc, p) => acc + (Number(p.usedbudget) || 0), 0).toFixed(2)
    );
    const remainingBudget = Math.max(0, Number((totalBudget - utilizedBudget).toFixed(2)));
    const overallUtilizationPercent =
      totalBudget > 0 ? Number(((utilizedBudget / totalBudget) * 100).toFixed(1)) : 0;

    // Status Distribution
    const statusKeys = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
    const statusColors = {
      planning: '#64748b',
      active: '#2563eb',
      'on-hold': '#eab308',
      completed: '#16a34a',
      cancelled: '#dc2626',
    };

    const statusDistribution = statusKeys.map((status) => ({
      status,
      count: projects.filter((p) => p.status === status).length,
      color: statusColors[status],
    }));

    // Risks & Tasks quick counts
    const tasks = await taskDao.findAll();
    const risks = await riskDao.findAll();

    const criticalRisks = risks.filter((r) => r.severity === 'critical' || r.severity === 'high');

    return {
      kpis: {
        totalProjects,
        activeProjects,
        planningProjects,
        onHoldProjects,
        completedProjects,
        cancelledProjects,
        totalBudget,
        utilizedBudget,
        usedbudget: utilizedBudget,
        remainingBudget,
        overallUtilizationPercent,
        totalTasks: tasks.length,
        openRisks: risks.filter((r) => r.status === 'open').length,
      },
      statusDistribution,
      criticalRisks,
      recentProjects: projects.slice(0, 5),
    };
  },
};

export default dashboardService;
