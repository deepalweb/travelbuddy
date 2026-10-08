import { isPlaceholderPlace, isGenericPlaceName } from './placeNameFilters.js';
import { compactList } from './textUtils.js';

function addQualityIssue(issues, severity, code, message) {
  issues.push({ severity, code, message });
}

export function evaluateTripPlanQuality(plan = {}, input = {}, grounding) {
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

  const sb = plan.scoreBreakdown;
  if (!sb || typeof sb !== 'object') {
    addQualityIssue(issues, 'major', 'score_breakdown_missing', 'scoreBreakdown is missing.');
  } else {
    const dims = ['budgetFit', 'paceComfort', 'routeLogic', 'destinationMatch', 'contentConfidence'];
    const allNumeric = dims.every((d) => Number.isFinite(Number(sb[d])));
    if (!allNumeric) {
      addQualityIssue(issues, 'major', 'score_breakdown_incomplete', 'scoreBreakdown must have numeric values for all 5 dimensions.');
    } else {
      const avg = Math.round(dims.reduce((sum, d) => sum + Number(sb[d]), 0) / dims.length);
      const reported = Number(plan.planningConfidenceScore);
      if (Math.abs(avg - reported) > 5) {
        addQualityIssue(issues, 'major', 'confidence_score_mismatch', `planningConfidenceScore (${reported}) deviates more than 5 points from scoreBreakdown average (${avg}).`);
      }
    }
    if (!sb.scoreReasoning || String(sb.scoreReasoning).length < 40) {
      addQualityIssue(issues, 'minor', 'score_reasoning_thin', 'scoreBreakdown.scoreReasoning must explain the scores in context.');
    }
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

      if (!activity?.timeWindow || String(activity.timeWindow).length < 5) {
        addQualityIssue(issues, 'minor', 'time_window_missing', `${label} needs a usable timeWindow.`);
      }

      if (!activity?.transportAdvice || String(activity.transportAdvice).length < 15) {
        addQualityIssue(issues, 'minor', 'transport_advice_thin', `${label} needs practical transportAdvice.`);
      }

      if (!activity?.costNote || String(activity.costNote).length < 8) {
        addQualityIssue(issues, 'minor', 'cost_note_missing', `${label} needs a costNote.`);
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

  // Grounding-rate rule only applies when we actually have a verified candidate pool to compare
  // against — a sparse or unavailable pool means low grounding is expected, not a plan defect.
  if (grounding?.groundingQuality === 'verified') {
    const groundedActivityRate = plan.groundingMeta?.groundedActivityRate;
    if (Number.isFinite(groundedActivityRate) && groundedActivityRate < 0.7) {
      addQualityIssue(
        issues,
        'major',
        'low_grounding_rate',
        `Only ${Math.round(groundedActivityRate * 100)}% of activities use a real, verified place from the candidate list. Match more activities to the supplied CANDIDATE_PLACES.`
      );
    }
  }

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
