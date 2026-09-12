import { reportDao } from '../dao/report.dao.js';
import { projectDao } from '../dao/project.dao.js';
import { ApiError } from '../utils/apiError.util.js';

export const reportService = {
  getAllReports: async (query = {}) => {
    return await reportDao.findAll(query);
  },

  getReportById: async (id) => {
    const report = await reportDao.findById(id);
    if (!report) throw new ApiError(404, 'Report not found');
    return report;
  },

  createReport: async (data, userId) => {
    if (!data.projectId || !data.type) {
      throw new ApiError(400, 'projectId and type are required');
    }
    const project = await projectDao.findById(data.projectId);
    if (!project) throw new ApiError(404, 'Project not found');

    return await reportDao.create({
      ...data,
      generatedBy: userId || data.generatedBy,
      generatedAt: new Date(),
    });
  },

  deleteReport: async (id) => {
    const report = await reportDao.findById(id);
    if (!report) throw new ApiError(404, 'Report not found');
    return await reportDao.delete(id);
  },

  getSummaryReport: async () => {
    const result = await projectDao.findAll();
    const projects = result.data || [];
    return {
      generatedAt: new Date().toISOString(),
      totalProjects: projects.length,
      projects: projects.map((p) => ({
        id: p._id || p.id,
        name: p.name,
        status: p.status,
        budget: p.budget,
        usedbudget: p.usedbudget,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
    };
  },

  getProjectsCSV: async () => {
    const result = await projectDao.findAll();
    const projects = result.data || [];
    const headers = [
      'Project ID',
      'Project Name',
      'Status',
      'Budget (INR)',
      'Used Budget (INR)',
      'Start Date',
      'End Date',
    ];

    const rows = projects.map((p) => [
      `"${p._id || p.id}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.status}"`,
      p.budget || 0,
      p.usedbudget || 0,
      `"${p.startDate || ''}"`,
      `"${p.endDate || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};

export default reportService;
