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

  return `\nCANDIDATE_PLACES (real, verified via Google Places — use these to fix any generic or low-grounding placeName issues):\n${lines.join('\n')}\n`;
}

export function buildQualityRepairPrompt({ currentPlan, input, quality, grounding }) {
  return `
Repair this trip plan so it passes TravelBuddy's quality gate.

Traveler input:
${JSON.stringify(input, null, 2)}
${formatCandidatePlacesBlock(grounding)}
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
- Make descriptions, timeWindow, transportAdvice, costNote, local tips, weather backups, warnings, and budget notes practical and destination-specific.
- Respect avoid preferences and requested pace.
- Lower planningConfidenceScore if important uncertainty remains.
- If a low_grounding_rate issue is listed, replace generic or invented placeName values with a matching name from CANDIDATE_PLACES where one genuinely fits; otherwise leave placeName empty.
- Do not invent exact prices, opening hours, addresses, place IDs, booking links, or guaranteed availability.
- Leave googleMapsUrl empty.
`.trim();
}
