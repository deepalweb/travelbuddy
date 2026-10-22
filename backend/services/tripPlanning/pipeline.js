import { buildTripPlanPrompt } from '../../lib/ai/buildTripPlanPrompt.js';
import { buildSmartEditPrompt } from '../../lib/ai/buildSmartEditPrompt.js';
import { buildQualityRepairPrompt } from '../../lib/ai/buildQualityRepairPrompt.js';
import {
  callTripPlanningAI,
  safeParseAIJson,
  repairTripPlanJson,
  AI_GENERATION_TIMEOUT_MS,
  AI_REPAIR_TIMEOUT_MS,
  DEFAULT_GENERATION_MAX_TOKENS,
} from './aiClient.js';
import { normalizeTripPlanResult } from './normalizeTripPlan.js';
import { evaluateTripPlanQuality } from './qualityGate.js';
import { gatherGroundingCandidates, gatherHiddenGemsTopUp } from '../googlePlaces/tripPlaceGrounding.js';
import { getAiProviderName } from '../../config/ai-provider.js';

async function generateNormalizedTripPlanFromPrompt(prompt, input, grounding, logLabel, options = {}) {
  let tripPlan;
  let quality;
  let validationError;
  const useQualityGate = options.qualityGate !== false;

  for (let generationAttempt = 1; generationAttempt <= 2; generationAttempt += 1) {
    const correction =
      generationAttempt === 1
        ? ''
        : `\n\nYour previous response failed validation: ${validationError.message}. Return a complete corrected JSON object that follows every schema rule.`;

    try {
      const generation = await callTripPlanningAI(`${prompt}${correction}`, {
        maxTokens: DEFAULT_GENERATION_MAX_TOKENS,
        timeoutMs: AI_GENERATION_TIMEOUT_MS,
      });
      if (generation.finishReason === 'length') {
        throw new Error('AI response was truncated before the trip plan was complete.');
      }

      let parsed;
      try {
        parsed = safeParseAIJson(generation.text);
      } catch (parseError) {
        parsed = await repairTripPlanJson(generation.text, parseError);
      }

      tripPlan = normalizeTripPlanResult(parsed, input, grounding);
      quality = evaluateTripPlanQuality(tripPlan, input, grounding);
      if (useQualityGate && !quality.passed) {
        throw new Error(
          `Quality gate failed with score ${quality.score}: ${quality.blockingIssues
            .map((issue) => issue.message)
            .join(' ')}`
        );
      }
      break;
    } catch (error) {
      if (error instanceof Error && /timed out/i.test(error.message)) {
        throw error;
      }
      validationError = error;
      console.warn(`${logLabel} validation attempt ${generationAttempt} failed:`, error);
    }
  }

  if (!tripPlan) {
    throw validationError || new Error('Trip planning AI returned an invalid plan.');
  }

  if (useQualityGate && quality && !quality.passed) {
    const repairPrompt = buildQualityRepairPrompt({
      currentPlan: tripPlan,
      input,
      quality,
      grounding,
    });
    const repairedGeneration = await callTripPlanningAI(repairPrompt, {
      maxTokens: DEFAULT_GENERATION_MAX_TOKENS,
      maxAttempts: 1,
      timeoutMs: AI_REPAIR_TIMEOUT_MS,
    });
    if (repairedGeneration.finishReason === 'length') {
      throw new Error('AI quality repair was truncated.');
    }

    let repairedParsed;
    try {
      repairedParsed = safeParseAIJson(repairedGeneration.text);
    } catch (parseError) {
      repairedParsed = await repairTripPlanJson(repairedGeneration.text, parseError);
    }

    tripPlan = normalizeTripPlanResult(repairedParsed, input, grounding);
    quality = evaluateTripPlanQuality(tripPlan, input, grounding);
  }

  quality = quality || evaluateTripPlanQuality(tripPlan, input, grounding);
  tripPlan.planningConfidenceScore = Math.min(
    Number(tripPlan.planningConfidenceScore) || 0,
    Math.max(45, quality.score)
  );

  return { tripPlan, quality };
}

export async function generateTripPlan(input) {
  const grounding = await gatherGroundingCandidates(input);
  const prompt = buildTripPlanPrompt(input, grounding);
  const { tripPlan, quality } = await generateNormalizedTripPlanFromPrompt(
    prompt,
    input,
    grounding,
    'Trip plan generation'
  );

  return {
    tripPlan,
    meta: {
      source: getAiProviderName(),
      quality,
      groundingQuality: grounding.groundingQuality,
      groundedActivityRate: tripPlan.groundingMeta?.groundedActivityRate ?? 0,
    },
  };
}

export async function editTripPlan(editInput) {
  const grounding = await gatherGroundingCandidates(editInput.input);

  if (['add_hidden_gems', 'replace_activity'].includes(editInput.actionType)) {
    const topUp = await gatherHiddenGemsTopUp(editInput.input.destination);
    if (topUp.length) {
      const experienceGroup = grounding.candidatesByType.find((g) => g.type === 'experience');
      const existingIds = new Set((experienceGroup?.candidates || []).map((c) => c.placeId));
      const fresh = topUp.filter((c) => c.placeId && !existingIds.has(c.placeId));
      if (experienceGroup) {
        experienceGroup.candidates = [...experienceGroup.candidates, ...fresh].slice(0, 10);
      } else if (fresh.length) {
        grounding.candidatesByType.push({ type: 'experience', candidates: fresh.slice(0, 10) });
      }
    }
  }

  const prompt = buildSmartEditPrompt({ ...editInput, grounding });
  const { tripPlan, quality } = await generateNormalizedTripPlanFromPrompt(
    prompt,
    editInput.input,
    grounding,
    `Smart edit ${editInput.actionType}`
  );

  return {
    tripPlan,
    meta: {
      source: getAiProviderName(),
      actionType: editInput.actionType,
      quality,
      groundingQuality: grounding.groundingQuality,
      groundedActivityRate: tripPlan.groundingMeta?.groundedActivityRate ?? 0,
    },
  };
}
