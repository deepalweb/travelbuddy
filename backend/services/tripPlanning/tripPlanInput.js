export function validateTripPlanInput(input = {}) {
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

export function normalizeTripPlanInput(input = {}) {
  return {
    destination: String(input.destination || '').trim(),
    origin: input.origin ? String(input.origin).trim() : undefined,
    country: input.country ? String(input.country).trim() : undefined,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    month: input.month || undefined,
    durationDays: Number(input.durationDays) || 4,
    travelerType: input.travelerType || 'couple',
    groupSize: input.groupSize ? Math.max(1, Math.min(12, Number(input.groupSize))) : undefined,
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
