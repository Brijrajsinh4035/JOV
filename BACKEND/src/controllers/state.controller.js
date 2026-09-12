import { stateService } from '../services/state.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const getStates = asyncHandler(async (req, res) => {
  const states = await stateService.getAllStates();
  return res
    .status(200)
    .json(new ApiResponse(200, states, 'States fetched successfully'));
});

export const getStateById = asyncHandler(async (req, res) => {
  const state = await stateService.getStateById(req.params.id);
  return res
    .status(200)
    .json(new ApiResponse(200, state, 'State fetched successfully'));
});

export default {
  getStates,
  getStateById,
};
