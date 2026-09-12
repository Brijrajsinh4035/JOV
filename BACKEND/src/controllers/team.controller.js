import { teamService } from '../services/team.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getTeams = asyncHandler(async (req, res) => {
  const teams = await teamService.getAll(req.query);
  return res.status(200).json(new ApiResponse(200, teams, 'Teams retrieved successfully'));
});

export const getTeamById = asyncHandler(async (req, res) => {
  const team = await teamService.getById(req.params.id);
  return res.status(200).json(new ApiResponse(200, team, 'Team retrieved successfully'));
});

export const createTeam = asyncHandler(async (req, res) => {
  const team = await teamService.create(req.body);
  return res.status(201).json(new ApiResponse(201, team, 'Team created successfully'));
});

export const updateTeam = asyncHandler(async (req, res) => {
  const team = await teamService.update(req.params.id, req.body);
  return res.status(200).json(new ApiResponse(200, team, 'Team updated successfully'));
});

export const deleteTeam = asyncHandler(async (req, res) => {
  await teamService.delete(req.params.id);
  return res.status(200).json(new ApiResponse(200, {}, 'Team deleted successfully'));
});

export default {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
};
