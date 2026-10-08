// Simple in-memory per-user daily counter for trip-plan generate/edit calls.
// Does not survive restarts or coordinate across instances — acceptable for now,
// matches the risk profile of other in-memory caches already used in this backend.

const DAILY_LIMIT = Number(process.env.TRIP_PLAN_DAILY_LIMIT) || 20;

const dailyCountsByUid = new Map();
let currentDayKey = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function resetIfNewDay() {
  const key = todayKey();
  if (key !== currentDayKey) {
    currentDayKey = key;
    dailyCountsByUid.clear();
  }
}

export function checkAndConsume(uid) {
  resetIfNewDay();
  const used = dailyCountsByUid.get(uid) || 0;

  if (used >= DAILY_LIMIT) {
    return { allowed: false, limit: DAILY_LIMIT, used };
  }

  dailyCountsByUid.set(uid, used + 1);
  return { allowed: true, limit: DAILY_LIMIT, used: used + 1 };
}
