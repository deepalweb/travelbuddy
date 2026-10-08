import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { normalizeTripPlanInput, validateTripPlanInput } from '../services/tripPlanning/tripPlanInput.js';
import { normalizeSmartEditInput, validateSmartEditInput } from '../services/tripPlanning/smartEdit.js';
import { isAIConfigured } from '../services/tripPlanning/aiClient.js';
import { generateTripPlan, editTripPlan } from '../services/tripPlanning/pipeline.js';
import { checkAndConsume } from '../services/tripPlanning/rateLimiter.js';

const router = express.Router();

const KNOWN_ERROR_MESSAGE_PATTERN = /timed out|truncated|at least two activities|placeholder|JSON|day objects|safety filter/i;

function rateLimitGuard(req, res, next) {
  const { allowed, limit } = checkAndConsume(req.user.uid);
  if (!allowed) {
    return res.status(429).json({
      success: false,
      error: `Daily trip-plan generation limit (${limit}) reached. Try again tomorrow.`,
    });
  }
  next();
}

router.post('/generate', requireAuth, rateLimitGuard, async (req, res) => {
  try {
    const input = normalizeTripPlanInput(req.body || {});
    const validationErrors = validateTripPlanInput(input);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(' '),
      });
    }

    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Trip planning AI is not configured.',
      });
    }

    const { tripPlan, meta } = await generateTripPlan(input);

    return res.json({
      success: true,
      tripPlan,
      meta,
    });
  } catch (error) {
    console.error('Trip plan generation failed:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error && KNOWN_ERROR_MESSAGE_PATTERN.test(error.message)
          ? error.message
          : 'Failed to generate trip plan.',
    });
  }
});

router.post('/edit', requireAuth, rateLimitGuard, async (req, res) => {
  try {
    const editInput = normalizeSmartEditInput(req.body || {});
    const validationErrors = validateSmartEditInput(editInput);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(' '),
      });
    }

    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        error: 'Trip planning AI is not configured.',
      });
    }

    const { tripPlan, meta } = await editTripPlan(editInput);

    return res.json({
      success: true,
      tripPlan,
      meta,
    });
  } catch (error) {
    console.error('Smart trip edit failed:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error && KNOWN_ERROR_MESSAGE_PATTERN.test(error.message)
          ? error.message
          : 'Failed to edit trip plan.',
    });
  }
});

export default router;
