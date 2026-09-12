import { Router } from 'express';
import { chatWithAssistant, getPromptSuggestions } from '../controllers/ai.controller.js';

const router = Router();

// Chat with Government Project Management Assistant AI
router.post('/chat', chatWithAssistant);

// Get suggested queries
router.get('/suggestions', getPromptSuggestions);

export default router;
