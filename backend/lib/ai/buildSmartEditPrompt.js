function formatCandidatePlacesBlock(grounding) {
  const groups = grounding?.candidatesByType || [];
  if (!groups.length) {
    return '';
  }

  const lines = groups.map((group) => {
    const names = group.candidates
      .map((c) => (c.rating ? `${c.name} (${c.rating}★)` : c.name))
      .join('; ');
    return `- ${group.type}: ${names}`;
  });

  return `\nCANDIDATE_PLACES (real, verified via Google Places — prefer these for any new or swapped-in place):\n${lines.join('\n')}\n`;
}

export function buildSmartEditPrompt({ currentPlan, actionType, actionLabel, instruction, input, grounding }) {
  return `
You are TravelBuddy's Smart Trip Editing Engine.

Your job is to revise an existing trip plan without starting over.

Edit request:
- actionType: ${actionType}
- actionLabel: ${actionLabel || actionType}
- userInstruction: ${instruction || 'Apply this edit in the most practical way.'}

Traveler input:
${JSON.stringify(input, null, 2)}
${formatCandidatePlacesBlock(grounding)}
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
- Keep activity timeWindow values realistic and consistent with transfer time and estimatedDuration.
- Include transportAdvice and costNote for every activity.
- For any new or swapped-in activity, use a name from CANDIDATE_PLACES when one fits; otherwise leave placeName empty rather than inventing a venue.
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
- add_hidden_gems: add lower-crowd credible local alternatives, preferring CANDIDATE_PLACES entries not already used in the plan.
- replace_activity: replace the weakest or riskiest activity and explain why the replacement works.
`.trim();
}
