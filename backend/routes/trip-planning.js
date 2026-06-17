import express from 'express';
import fetch from 'node-fetch';
import {
  buildTripPlanPrompt,
  TRIP_PLAN_SYSTEM_PROMPT,
} from '../lib/ai/buildTripPlanPrompt.js';

const router = express.Router();

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_API_VERSION = '2024-02-01';
const AI_GENERATION_TIMEOUT_MS = Math.max(
  60000,
  Number(process.env.TRIP_PLAN_AI_TIMEOUT_MS) || 120000
);
const AI_REPAIR_TIMEOUT_MS = Math.max(
  30000,
  Number(process.env.TRIP_PLAN_REPAIR_TIMEOUT_MS) || 60000
);
const AI_REQUEST_ATTEMPTS = 2;

function validateTripPlanInput(input = {}) {
  const errors = [];

  if (!input.destination || !String(input.destination).trim()) {
    errors.push('Destination is required.');
  }

  if (!input.durationDays || Number(input.durationDays) < 1) {
    errors.push('durationDays must be at least 1.');
  }

  if (!input.travelerType) {
    errors.push('travelerType is required.');
  }

  if (!input.budgetLevel) {
    errors.push('budgetLevel is required.');
  }

  if (!input.pace) {
    errors.push('pace is required.');
  }

  return errors;
}

const SMART_EDIT_ACTION_TYPES = new Set([
  'make_cheaper',
  'reduce_walking',
  'add_food',
  'add_romantic',
  'avoid_crowds',
  'make_relaxed',
  'add_hidden_gems',
  'replace_activity',
]);

function normalizeTripPlanInput(input = {}) {
  return {
    destination: String(input.destination || '').trim(),
    origin: input.origin ? String(input.origin).trim() : undefined,
    country: input.country ? String(input.country).trim() : undefined,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    month: input.month || undefined,
    durationDays: Number(input.durationDays) || 4,
    travelerType: input.travelerType || 'couple',
    budgetLevel: input.budgetLevel || 'mid_range',
    budgetAmount: input.budgetAmount ? Number(input.budgetAmount) : undefined,
    currency: input.currency || 'USD',
    pace: input.pace || 'balanced',
    interests: Array.isArray(input.interests) ? input.interests.filter(Boolean).map((item) => String(item).toLowerCase()) : [],
    avoid: Array.isArray(input.avoid) ? input.avoid.filter(Boolean).map((item) => String(item).toLowerCase()) : [],
    accommodationArea: input.accommodationArea || undefined,
    arrivalTime: input.arrivalTime || undefined,
    departureTime: input.departureTime || undefined,
    notes: input.notes || undefined,
  };
}

function normalizeSmartEditInput(body = {}) {
  const currentPlan = body.currentPlan && typeof body.currentPlan === 'object' ? body.currentPlan : null;
  const rawActionType = String(body.actionType || '').trim();
  const actionType = SMART_EDIT_ACTION_TYPES.has(rawActionType) ? rawActionType : '';
  const baseInput = normalizeTripPlanInput({
    ...(body.input || {}),
    destination: body.input?.destination || currentPlan?.destination,
    durationDays: body.input?.durationDays || currentPlan?.durationDays,
    travelerType: body.input?.travelerType || currentPlan?.travelerType || 'couple',
    budgetLevel: body.input?.budgetLevel || 'mid_range',
    pace: body.input?.pace || 'balanced',
    interests: body.input?.interests || currentPlan?.tripStyle || [],
  });

  return {
    currentPlan,
    actionType,
    actionLabel: String(body.actionLabel || body.label || rawActionType).trim(),
    instruction: String(body.instruction || body.description || '').trim(),
    input: baseInput,
  };
}

function validateSmartEditInput(input = {}) {
  const errors = [];

  if (!input.currentPlan || typeof input.currentPlan !== 'object') {
    errors.push('currentPlan is required.');
  }

  if (!input.actionType) {
    errors.push('A valid actionType is required.');
  }

  errors.push(...validateTripPlanInput(input.input));

  return errors;
}

function safeParseAIJson(raw) {
  if (!raw) {
    throw new Error('Empty AI response');
  }

  const cleaned = String(raw)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in AI response');
  }

  const candidate = jsonMatch[0];

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = candidate
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\u00a0/g, ' ');

    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw new Error(`Failed to parse AI JSON: ${repairError.message}`);
    }
  }
}

function extractMessageText(message) {
  if (!message) {
    return '';
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('');
  }

  return '';
}

function isPlaceholderPlace(value = '') {
  return /(signature highlight|food stop|scenic moment|culture highlight|cultural core|local dining area|sunset viewpoint|secondary museum or viewpoint|local market detour|highlight$| stop$)/i.test(
    String(value).trim()
  );
}

function isGenericPlaceName(value = '') {
  return /(local dinner|local dining|dinner|lunch|breakfast|food experience|food tasting|nearby restaurant|restaurant nearby|city center|town center|old town|downtown|waterfront|neighbou?rhood|market area|shopping area|hotel area|scenic area|cultural area|local area)/i.test(
    String(value).trim()
  );
}

function toStringArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
}

function canOpenExactPlace(activity = {}) {
  if (!activity.placeName || isPlaceholderPlace(activity.placeName) || isGenericPlaceName(activity.placeName)) {
    return false;
  }

  return ['attraction', 'food', 'nature', 'culture'].includes(String(activity.type || '').toLowerCase());
}

function buildGoogleMapsUrl(placeName, destination) {
  if (!placeName || isPlaceholderPlace(placeName) || isGenericPlaceName(placeName)) {
    return undefined;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${String(placeName).trim()}, ${destination}`
  )}`;
}

function buildNearbySearchUrl(activity, destination) {
  const type = String(activity?.type || '').toLowerCase();
  if (!['food', 'shopping', 'experience'].includes(type)) {
    return undefined;
  }

  const query = type === 'food' ? `restaurants near ${destination}` : `${type} near ${destination}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalizeRange(value) {
  const text = String(value || '').trim();
  const match = text.match(/(\d[\d,]*(?:\.\d+)?)\s*[-–—]\s*(?:[A-Z]{3}\s*|[$€£]\s*)?(\d[\d,]*(?:\.\d+)?)/);
  if (!match) {
    return text;
  }

  const first = Number(match[1].replace(/,/g, ''));
  const second = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= second) {
    return text;
  }

  return `${text.slice(0, match.index)}${match[2]}-${match[1]}${text.slice(
    Number(match.index) + match[0].length
  )}`;
}

function normalizePlaceList(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).filter((place) => {
    const key = String(place?.name || '').trim().toLowerCase();
    if (!key || isPlaceholderPlace(key) || isGenericPlaceName(key) || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeActivityTitle(activity, placeName) {
  const title = String(activity?.title || '').trim();
  if (title && !isPlaceholderPlace(title)) {
    return title;
  }

  if (placeName) {
    return `Visit ${placeName}`;
  }

  const titlesByType = {
    food: 'Meal break',
    rest: 'Rest and recharge',
    transport: 'Travel and check-in',
    shopping: 'Browse local shops',
    experience: 'Local experience',
    nature: 'Outdoor time',
    culture: 'Cultural visit',
    attraction: 'Sightseeing visit',
  };

  return titlesByType[String(activity?.type || '').toLowerCase()] || 'Flexible trip time';
}

function normalizeTripPlanResult(result, input) {
  const source = result && typeof result === 'object' ? result : {};
  const sourceDays = Array.isArray(source.days) ? source.days : [];
  const sourceHasWeakDays = sourceDays.some((day) => !Array.isArray(day?.activities) || day.activities.length < 2);
  if (sourceDays.length !== input.durationDays) {
    throw new Error(`AI trip plan must include exactly ${input.durationDays} day objects.`);
  }

  if (sourceHasWeakDays) {
    throw new Error('AI trip plan must include at least two activities for every day.');
  }

  const normalizedDays = sourceDays
    .sort((left, right) => Number(left?.day) - Number(right?.day))
    .map((day, index) => ({
      ...day,
      day: index + 1,
      estimatedCostRange: normalizeRange(day.estimatedCostRange),
      dayWarnings: toStringArray(day.dayWarnings),
      editSuggestions: toStringArray(day.editSuggestions),
      activities: day.activities.map((activity) => {
        const placeName =
          activity.placeName &&
          !isPlaceholderPlace(activity.placeName) &&
          !isGenericPlaceName(activity.placeName)
            ? String(activity.placeName).trim()
            : undefined;
        const exactPlace = canOpenExactPlace({ ...activity, placeName });

        return {
          ...activity,
          title: normalizeActivityTitle(activity, placeName),
          placeName,
          googleMapsUrl: exactPlace
            ? buildGoogleMapsUrl(placeName, input.destination)
            : undefined,
          nearbySearchUrl: !exactPlace
            ? buildNearbySearchUrl(activity, input.destination)
            : undefined,
          tips: toStringArray(activity.tips),
        };
      }),
    }));

  const mustDo = normalizePlaceList(source.mustDo);
  const mustDoNames = new Set(mustDo.map((place) => place.name.toLowerCase()));
  const optional = normalizePlaceList(source.optional).filter(
    (place) => !mustDoNames.has(place.name.toLowerCase())
  );
  const reservedNames = new Set([
    ...mustDoNames,
    ...optional.map((place) => place.name.toLowerCase()),
  ]);
  const skipIfShortOnTime = normalizePlaceList(source.skipIfShortOnTime).filter(
    (place) => !reservedNames.has(place.name.toLowerCase())
  );
  const sourceBudget = source.budget && typeof source.budget === 'object' ? source.budget : {};

  return {
    ...source,
    destination: source.destination || input.destination,
    durationDays: Number(source.durationDays) || input.durationDays,
    planningConfidenceScore: Math.max(
      0,
      Math.min(100, Number(source.planningConfidenceScore) || 0)
    ),
    tripStyle: Array.isArray(source.tripStyle) ? source.tripStyle : [],
    days: normalizedDays,
    mustDo,
    optional,
    skipIfShortOnTime,
    budget: {
      ...sourceBudget,
      estimatedTotalRange: normalizeRange(sourceBudget.estimatedTotalRange),
      breakdown: Array.isArray(sourceBudget.breakdown)
        ? sourceBudget.breakdown.map((item) => ({
            ...item,
            range: normalizeRange(item.range),
          }))
        : [],
    },
    commonMistakes: Array.isArray(source.commonMistakes) ? source.commonMistakes : [],
    smartEditActions: Array.isArray(source.smartEditActions) ? source.smartEditActions : [],
    practicalInfo: {
      transportationAdvice: toStringArray(source.practicalInfo?.transportationAdvice),
      culturalEtiquette: toStringArray(source.practicalInfo?.culturalEtiquette),
      packingTips: toStringArray(source.practicalInfo?.packingTips),
      sustainabilityTips: toStringArray(source.practicalInfo?.sustainabilityTips),
    },
  };
}

function compactList(items = [], limit = 8) {
  return items.filter(Boolean).slice(0, limit);
}

function addQualityIssue(issues, severity, code, message) {
  issues.push({ severity, code, message });
}

function evaluateTripPlanQuality(plan = {}, input = {}) {
  const issues = [];
  const days = Array.isArray(plan.days) ? plan.days : [];
  const avoidText = (input.avoid || []).join(' ').toLowerCase();
  const requestedPace = String(input.pace || '').toLowerCase();

  if (days.length !== input.durationDays) {
    addQualityIssue(
      issues,
      'critical',
      'day_count',
      `Plan has ${days.length} days but input requires ${input.durationDays}.`
    );
  }

  if (!Number.isFinite(Number(plan.planningConfidenceScore))) {
    addQualityIssue(issues, 'major', 'confidence_missing', 'planningConfidenceScore is missing or not numeric.');
  }

  if (Number(plan.planningConfidenceScore) > 89 && plan.tripHealth?.overall === 'risky') {
    addQualityIssue(
      issues,
      'major',
      'confidence_inconsistent',
      'Risky plans cannot have very high planning confidence.'
    );
  }

  if (plan.realityCheck?.isRealistic === false && Number(plan.planningConfidenceScore) > 74) {
    addQualityIssue(
      issues,
      'major',
      'realism_conflict',
      'Unrealistic plans must lower confidence and explain safer changes.'
    );
  }

  if (!plan.tripSummary?.shortDescription || String(plan.tripSummary.shortDescription).length < 35) {
    addQualityIssue(issues, 'minor', 'summary_thin', 'Trip summary is too thin.');
  }

  if (!plan.realityCheck?.summary || String(plan.realityCheck.summary).length < 25) {
    addQualityIssue(issues, 'major', 'reality_check_thin', 'Reality check needs a useful summary.');
  }

  if (!Array.isArray(plan.commonMistakes) || plan.commonMistakes.length < 2) {
    addQualityIssue(issues, 'minor', 'mistakes_thin', 'Common mistakes should include at least two useful items.');
  }

  if (!Array.isArray(plan.smartEditActions) || plan.smartEditActions.length < 3) {
    addQualityIssue(issues, 'minor', 'smart_edits_thin', 'Smart edit actions should include at least three relevant edits.');
  }

  const budgetBreakdown = plan.budget?.breakdown;
  if (!plan.budget?.estimatedTotalRange || !Array.isArray(budgetBreakdown) || budgetBreakdown.length < 3) {
    addQualityIssue(issues, 'major', 'budget_incomplete', 'Budget needs a total range and at least three breakdown categories.');
  }

  const priorityNames = [
    ...(Array.isArray(plan.mustDo) ? plan.mustDo : []),
    ...(Array.isArray(plan.optional) ? plan.optional : []),
    ...(Array.isArray(plan.skipIfShortOnTime) ? plan.skipIfShortOnTime : []),
  ]
    .map((item) => String(item?.name || '').trim().toLowerCase())
    .filter(Boolean);
  if (new Set(priorityNames).size !== priorityNames.length) {
    addQualityIssue(issues, 'major', 'priority_duplicates', 'Priority lists contain duplicate place names.');
  }

  const seenPlaceNames = new Map();
  days.forEach((day, dayIndex) => {
    const dayNumber = Number(day?.day) || dayIndex + 1;
    const activities = Array.isArray(day?.activities) ? day.activities : [];

    if (activities.length < 2) {
      addQualityIssue(issues, 'critical', 'day_underpacked', `Day ${dayNumber} has fewer than two activities.`);
    }

    if (activities.length > 4) {
      addQualityIssue(issues, 'major', 'day_overpacked', `Day ${dayNumber} has more than four activities.`);
    }

    if (requestedPace === 'relaxed' && activities.length > 3) {
      addQualityIssue(issues, 'major', 'relaxed_too_busy', `Day ${dayNumber} is too busy for a relaxed pace.`);
    }

    if (!day?.routeLogic || String(day.routeLogic).length < 30) {
      addQualityIssue(issues, 'major', 'route_logic_missing', `Day ${dayNumber} needs clearer route logic.`);
    }

    if (!day?.whyThisDayWorks || String(day.whyThisDayWorks).length < 30) {
      addQualityIssue(issues, 'minor', 'day_reason_thin', `Day ${dayNumber} needs a stronger reason why it works.`);
    }

    if (!day?.weatherBackup || String(day.weatherBackup).length < 20) {
      addQualityIssue(issues, 'minor', 'weather_backup_thin', `Day ${dayNumber} needs a practical weather backup.`);
    }

    if (avoidText.includes('walking') && day.walkingLevel === 'high') {
      addQualityIssue(issues, 'major', 'avoid_walking_conflict', `Day ${dayNumber} conflicts with avoiding heavy walking.`);
    }

    if (avoidText.includes('crowd') && !String(day.routeLogic || '').match(/early|late|quieter|crowd|busy/i)) {
      addQualityIssue(issues, 'minor', 'avoid_crowds_unhandled', `Day ${dayNumber} should address crowd avoidance.`);
    }

    const timeOrder = ['morning', 'afternoon', 'evening', 'night'];
    let previousTimeIndex = -1;
    activities.forEach((activity, activityIndex) => {
      const label = `Day ${dayNumber}, activity ${activityIndex + 1}`;
      const title = String(activity?.title || '').trim();
      const description = String(activity?.description || '').trim();
      const placeName = String(activity?.placeName || '').trim();
      const timeIndex = timeOrder.indexOf(String(activity?.timeOfDay || '').toLowerCase());

      if (timeIndex !== -1 && timeIndex < previousTimeIndex) {
        addQualityIssue(issues, 'major', 'activity_order', `${label} is not in chronological order.`);
      }
      if (timeIndex !== -1) previousTimeIndex = timeIndex;

      if (!title || title.length < 8 || isPlaceholderPlace(title)) {
        addQualityIssue(issues, 'major', 'weak_activity_title', `${label} has a weak activity title.`);
      }

      if (!description || description.length < 25) {
        addQualityIssue(issues, 'minor', 'weak_activity_description', `${label} needs a more practical description.`);
      }

      if (!activity?.estimatedDuration) {
        addQualityIssue(issues, 'major', 'duration_missing', `${label} is missing estimatedDuration.`);
      }

      if (!activity?.localTip || String(activity.localTip).length < 12) {
        addQualityIssue(issues, 'minor', 'local_tip_thin', `${label} needs a destination-specific local tip.`);
      }

      if (placeName && (isPlaceholderPlace(placeName) || isGenericPlaceName(placeName))) {
        addQualityIssue(issues, 'major', 'generic_place_name', `${label} has a generic or placeholder placeName.`);
      }

      if (placeName) {
        const key = placeName.toLowerCase();
        const existingDay = seenPlaceNames.get(key);
        if (existingDay && existingDay !== dayNumber) {
          addQualityIssue(issues, 'minor', 'duplicate_place', `${placeName} appears on multiple days.`);
        }
        seenPlaceNames.set(key, dayNumber);
      }
    });
  });

  const penaltyBySeverity = {
    critical: 18,
    major: 8,
    minor: 3,
  };
  const score = Math.max(
    0,
    100 - issues.reduce((total, issue) => total + penaltyBySeverity[issue.severity], 0)
  );
  const blockingIssues = issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'major');

  return {
    score,
    passed: score >= 82 && blockingIssues.length === 0,
    issues: compactList(issues, 16),
    blockingIssues: compactList(blockingIssues, 10),
  };
}

function buildQualityRepairPrompt({ currentPlan, input, quality }) {
  return `
Repair this trip plan so it passes TravelBuddy's quality gate.

Traveler input:
${JSON.stringify(input, null, 2)}

Quality issues to fix:
${JSON.stringify(quality.issues, null, 2)}

Current trip plan:
${JSON.stringify(currentPlan, null, 2)}

Rules:
- Return ONLY the full corrected trip plan JSON object using the same schema.
- Preserve destination, durationDays, day numbers, and the useful parts of the plan.
- Fix every quality issue concretely; do not only mention the fix.
- Keep every day at 2-4 activities.
- Make routeLogic specific and geographically sensible for every day.
- Make descriptions, local tips, weather backups, warnings, and budget notes practical and destination-specific.
- Respect avoid preferences and requested pace.
- Lower planningConfidenceScore if important uncertainty remains.
- Do not invent exact prices, opening hours, addresses, place IDs, booking links, or guaranteed availability.
- Leave googleMapsUrl empty.
`.trim();
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function callTripPlanningAI(prompt, options = {}) {
  const requestBody = {
    messages: [
      {
        role: 'system',
        content: TRIP_PLAN_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_completion_tokens: options.maxTokens || 6500,
    response_format: {
      type: 'json_object',
    },
  };

  const maxAttempts = options.maxAttempts || AI_REQUEST_ATTEMPTS;
  const timeoutMs = options.timeoutMs || AI_GENERATION_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const choice = data?.choices?.[0];
        return {
          text: extractMessageText(choice?.message),
          finishReason: choice?.finish_reason || null,
        };
      }

      const errorText = await response.text();
      if (response.status === 400 && /content_filter|ResponsibleAIPolicyViolation/i.test(errorText)) {
        const error = new Error(
          'The trip request was blocked by the AI safety filter. Remove unusual instructions from the notes and try again.'
        );
        error.code = 'AI_CONTENT_FILTER';
        throw error;
      }
      const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxAttempts) {
        throw new Error(`AI request failed with status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`Trip planning AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }

      if (attempt === maxAttempts) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    const backoff = 750 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
    await wait(backoff);
  }

  throw new Error('Trip planning AI request failed.');
}

async function repairTripPlanJson(rawJson, parseError) {
  const repairPrompt = `Repair the malformed JSON below.

Rules:
- Return one valid JSON object only.
- Preserve all existing travel content and keys.
- Fix syntax only: missing commas, quotes, brackets, braces, or truncated endings.
- Do not add markdown or commentary.
- If the ending is truncated, close the current object and all open arrays/objects with the smallest valid completion.

Parser error:
${parseError.message}

Malformed JSON:
${rawJson}`;

  const repaired = await callTripPlanningAI(repairPrompt, {
    maxTokens: 4500,
    maxAttempts: 1,
    timeoutMs: AI_REPAIR_TIMEOUT_MS,
  });
  if (repaired.finishReason === 'length') {
    throw new Error('AI JSON repair was truncated.');
  }

  return safeParseAIJson(repaired.text);
}

function buildSmartEditPrompt({ currentPlan, actionType, actionLabel, instruction, input }) {
  return `
You are TravelBuddy's Smart Trip Editing Engine.

Your job is to revise an existing trip plan without starting over.

Edit request:
- actionType: ${actionType}
- actionLabel: ${actionLabel || actionType}
- userInstruction: ${instruction || 'Apply this edit in the most practical way.'}

Traveler input:
${JSON.stringify(input, null, 2)}

Current trip plan:
${JSON.stringify(currentPlan, null, 2)}

Rules:
- Return ONLY the full updated trip plan JSON object using the exact same schema as the current plan.
- Preserve the destination, durationDays, day count, and day numbers.
- Preserve good parts of the existing itinerary unless they conflict with the edit.
- Apply the edit concretely to activities, warnings, routeLogic, budget, tripHealth, realityCheck, and smartEditActions where relevant.
- Do not merely say the plan changed; actually change the plan.
- Keep every day at 2-4 activities.
- Keep route order geographically sensible.
- Use specific real place names only when highly confident.
- Leave googleMapsUrl empty; the server will recreate safe map links.
- Do not invent exact prices, opening hours, or booking links.
- One short sentence per description, warning, recommendation, reason, and tip.

Action-specific guidance:
- make_cheaper: reduce paid attractions, luxury dining, taxis, and premium options; add free/low-cost alternatives.
- reduce_walking: group closer stops, add rest/transport breaks, reduce high-walking activities.
- add_food: add practical food stops or food-focused experiences without overpacking.
- add_romantic: add calmer scenic, sunset, boutique, or couple-friendly moments.
- avoid_crowds: shift timing, swap crowded stops, add quieter alternatives.
- make_relaxed: reduce activity count or intensity and improve rest time.
- add_hidden_gems: add lower-crowd credible local alternatives.
- replace_activity: replace the weakest or riskiest activity and explain why the replacement works.
`.trim();
}

async function generateNormalizedTripPlanFromPrompt(prompt, input, logLabel, options = {}) {
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
        maxTokens: 6500,
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

      tripPlan = normalizeTripPlanResult(parsed, input);
      quality = evaluateTripPlanQuality(tripPlan, input);
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
    });
    const repairedGeneration = await callTripPlanningAI(repairPrompt, {
      maxTokens: 6500,
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

    tripPlan = normalizeTripPlanResult(repairedParsed, input);
    quality = evaluateTripPlanQuality(tripPlan, input);
  }

  quality = quality || evaluateTripPlanQuality(tripPlan, input);
  tripPlan.planningConfidenceScore = Math.min(
    Number(tripPlan.planningConfidenceScore) || 0,
    Math.max(45, quality.score)
  );

  return {
    tripPlan,
    quality,
  };
}

router.post('/generate', async (req, res) => {
  try {
    const input = normalizeTripPlanInput(req.body || {});
    const validationErrors = validateTripPlanInput(input);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(' '),
      });
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return res.status(503).json({
        success: false,
        error: 'Trip planning AI is not configured.',
      });
    }

    const prompt = buildTripPlanPrompt(input);
    const { tripPlan, quality } = await generateNormalizedTripPlanFromPrompt(
      prompt,
      input,
      'Trip plan generation'
    );

    return res.json({
      success: true,
      tripPlan,
      meta: {
        source: 'azure_openai',
        quality,
      },
    });
  } catch (error) {
    console.error('Trip plan generation failed:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error && /timed out|truncated|at least two activities|placeholder|JSON|day objects|safety filter/i.test(error.message)
          ? error.message
          : 'Failed to generate trip plan.',
    });
  }
});

router.post('/edit', async (req, res) => {
  try {
    const editInput = normalizeSmartEditInput(req.body || {});
    const validationErrors = validateSmartEditInput(editInput);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(' '),
      });
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return res.status(503).json({
        success: false,
        error: 'Trip planning AI is not configured.',
      });
    }

    const prompt = buildSmartEditPrompt(editInput);
    const { tripPlan, quality } = await generateNormalizedTripPlanFromPrompt(
      prompt,
      editInput.input,
      `Smart edit ${editInput.actionType}`
    );

    return res.json({
      success: true,
      tripPlan,
      meta: {
        source: 'azure_openai',
        actionType: editInput.actionType,
        quality,
      },
    });
  } catch (error) {
    console.error('Smart trip edit failed:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error && /timed out|truncated|at least two activities|placeholder|JSON|day objects|safety filter/i.test(error.message)
          ? error.message
          : 'Failed to edit trip plan.',
    });
  }
});

export default router;
