import { createDailyMatch, getAvailabilityByUser, hasMatchBetweenUsersInRange, listUsersByCampus, now } from './db';

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function overlapWindow(a: { start_time: string; end_time: string }, b: { start_time: string; end_time: string }) {
  const start = new Date(Math.max(new Date(a.start_time).getTime(), new Date(b.start_time).getTime()));
  const end = new Date(Math.min(new Date(a.end_time).getTime(), new Date(b.end_time).getTime()));
  if (start >= end) return null;
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function generateDailyMatches(campusId: string): Promise<number> {
  const { start, end } = getTodayRange();

  const users = listUsersByCampus(campusId);
  if (users.length < 2) return 0;

  const shuffled = [...users].sort(() => Math.random() - 0.5);
  let pairs = 0;

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const a = shuffled[i];
    const b = shuffled[i + 1];

    if (hasMatchBetweenUsersInRange(a.id, b.id, start, end)) continue;

    const aWindows = getAvailabilityByUser(a.id).sort((x, y) => x.start_time.localeCompare(y.start_time))[0];
    const bWindows = getAvailabilityByUser(b.id).sort((x, y) => x.start_time.localeCompare(y.start_time))[0];

    let overlap = null;
    if (aWindows && bWindows) {
      overlap = overlapWindow(aWindows, bWindows);
    }

    const fallbackStart = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const fallbackEnd = new Date(fallbackStart.getTime() + 60 * 60 * 1000);
    const overlapStart = overlap?.start || fallbackStart.toISOString();
    const overlapEnd = overlap?.end || fallbackEnd.toISOString();

    const aInterests = a.interests || [];
    const bInterests = b.interests || [];
    const shared = aInterests.filter((t) => bInterests.includes(t));

    const matchScore = shared.length > 0 ? Math.min(1, 0.5 + shared.length * 0.1) : 0.45;
    const expires = new Date(new Date().setHours(23, 59, 59, 999)).toISOString();

    createDailyMatch({
      user_id: a.id,
      matched_user_id: b.id,
      match_score: matchScore,
      overlap_start: overlapStart,
      overlap_end: overlapEnd,
      shared_interests: shared,
      status: 'pending',
      expires_at: expires,
    });

    createDailyMatch({
      user_id: b.id,
      matched_user_id: a.id,
      match_score: matchScore,
      overlap_start: overlapStart,
      overlap_end: overlapEnd,
      shared_interests: shared,
      status: 'pending',
      expires_at: expires,
    });

    pairs += 1;
  }

  return pairs;
}
