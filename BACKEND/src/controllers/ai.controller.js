import { aiService } from '../services/ai.service.js';
import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';

export const chatWithAssistant = asyncHandler(async (req, res) => {
  const { message, history } = req.body;
  const result = await aiService.runAgent({ message, history });

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'AI assistant response generated successfully'));
});

export const getPromptSuggestions = asyncHandler(async (req, res) => {
  const suggestions = aiService.getSuggestions();

  return res
    .status(200)
    .json(new ApiResponse(200, suggestions, 'AI prompt suggestions fetched successfully'));
});

export default {
  chatWithAssistant,
  getPromptSuggestions,
};
