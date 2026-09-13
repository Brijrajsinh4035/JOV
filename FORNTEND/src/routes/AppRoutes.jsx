import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ProjectsPage from '../pages/Projects/ProjectsPage';
import ProjectDetailsPage from '../pages/Projects/ProjectDetailsPage';
import CreateProjectPage from '../pages/Projects/CreateProjectPage';
import MilestonesPage from '../pages/Milestones/MilestonesPage';
import TasksPage from '../pages/Tasks/TasksPage';
import RisksPage from '../pages/Risks/RisksPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import AiAssistantPage from '../pages/AiAssistant/AiAssistantPage';
import ClientsPage from '../pages/Clients/ClientsPage';
import TeamsPage from '../pages/Teams/TeamsPage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected National Portal Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailsPage />} />
          <Route path="/projects/new" element={<CreateProjectPage />} />
          <Route path="/milestones" element={<MilestonesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/risks" element={<RisksPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;
