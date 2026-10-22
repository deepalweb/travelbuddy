import { normalizeTripPlanInput, validateTripPlanInput } from './tripPlanInput.js';

export const SMART_EDIT_ACTION_TYPES = new Set([
  'make_cheaper',
  'reduce_walking',
  'add_food',
  'add_romantic',
  'avoid_crowds',
  'make_relaxed',
  'add_hidden_gems',
  'replace_activity',
]);

export const DEFAULT_SMART_EDIT_ACTIONS = [
  {
    label: 'Make it cheaper',
    actionType: 'make_cheaper',
    description: 'Swap paid or premium choices for lower-cost alternatives while keeping the route realistic.',
  },
  {
    label: 'Reduce walking',
    actionType: 'reduce_walking',
    description: 'Group closer stops, add rest time, and use easier transport options.',
  },
  {
    label: 'Make it relaxed',
    actionType: 'make_relaxed',
    description: 'Lower the daily intensity and create more buffer between activities.',
  },
  {
    label: 'Avoid crowds',
    actionType: 'avoid_crowds',
    description: 'Shift timing or replace crowded stops with quieter alternatives.',
  },
  {
    label: 'Add food focus',
    actionType: 'add_food',
    description: 'Add practical local dining or food experiences without overpacking the itinerary.',
  },
  {
    label: 'Add hidden gems',
    actionType: 'add_hidden_gems',
    description: 'Add credible lower-crowd local alternatives where they fit the route.',
  },
];

export function normalizeSmartEditActions(value) {
  const seen = new Set();
  const normalized = [];

  for (const action of Array.isArray(value) ? value : []) {
    const actionType = String(action?.actionType || '').trim();
    if (!SMART_EDIT_ACTION_TYPES.has(actionType) || seen.has(actionType)) {
      continue;
    }

    seen.add(actionType);
    normalized.push({
      label: String(action?.label || DEFAULT_SMART_EDIT_ACTIONS.find((item) => item.actionType === actionType)?.label || actionType).trim(),
      actionType,
      description: String(action?.description || DEFAULT_SMART_EDIT_ACTIONS.find((item) => item.actionType === actionType)?.description || 'Adjust this trip plan.').trim(),
    });
  }

  for (const action of DEFAULT_SMART_EDIT_ACTIONS) {
    if (normalized.length >= 6) break;
    if (!seen.has(action.actionType)) {
      seen.add(action.actionType);
      normalized.push(action);
    }
  }

  return normalized;
}

export function normalizeSmartEditInput(body = {}) {
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

export function validateSmartEditInput(input = {}) {
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
