import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export type Prompt = { question_id: string; question: string; answer: string };
export type User = {
  id: string;
  email: string;
  first_name: string;
  university: string;
  campus_id: string;
  interests: string[];
  prompts: Prompt[];
  push_token?: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilityWindow = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  expires_at: string;
  created_at: string;
};

export type DailyMatch = {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_score: number;
  overlap_start: string;
  overlap_end: string;
  shared_interests: string[];
  status: 'pending' | 'accepted' | 'passed' | 'expired';
  responded_at?: string | null;
  expires_at: string;
  created_at: string;
};

export type Spark = {
  id: string;
  match_a_id?: string | null;
  match_b_id?: string | null;
  user_a_id: string;
  user_b_id: string;
  user_a_activity?: string | null;
  user_b_activity?: string | null;
  activity_id?: string | null;
  activity_name?: string | null;
  venue_id?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  meet_time?: string | null;
  icebreaker?: string | null;
  status: 'activity_pending' | 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
};

export type SparkRating = {
  id: string;
  spark_id: string;
  rater_id: string;
  stars: number;
  would_meet_again: boolean;
  created_at: string;
};

type DbShape = {
  users: User[];
  availability_windows: AvailabilityWindow[];
  daily_matches: DailyMatch[];
  sparks: Spark[];
  spark_ratings: SparkRating[];
};

const DB_PATH = process.env.DB_PATH || 'spark.json';
const DB_FILE = path.resolve(DB_PATH);
let dbData: DbShape = {
  users: [],
  availability_windows: [],
  daily_matches: [],
  sparks: [],
  spark_ratings: [],
};

export function now() {
  return new Date().toISOString();
}

export function newId() {
  return randomUUID();
}

function loadDb() {
  if (!fs.existsSync(DB_FILE)) return;
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  if (!raw) return;
  dbData = JSON.parse(raw) as DbShape;
}

function saveDb() {
  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2));
}

export function initDb() {
  loadDb();
  if (dbData.users.length === 0) {
    seedLocalUsers();
  }
  saveDb();
}

function seedLocalUsers() {
  const campusId = 'local-campus';
  const base = now();
  dbData.users.push(
    {
      id: newId(),
      email: 'alex@spark.local',
      first_name: 'Alex',
      university: 'Local University',
      campus_id: campusId,
      interests: ['Coffee', 'Startups', 'Photography'],
      prompts: [
        { question_id: 'q1', question: 'The last thing that genuinely excited me', answer: 'A new ramen spot on campus.' },
      ],
      created_at: base,
      updated_at: base,
    },
    {
      id: newId(),
      email: 'jamie@spark.local',
      first_name: 'Jamie',
      university: 'Local University',
      campus_id: campusId,
      interests: ['Walks', 'Design', 'Coffee'],
      prompts: [
        { question_id: 'q2', question: 'My ideal study vibe is', answer: 'Soft music and a big window.' },
      ],
      created_at: base,
      updated_at: base,
    }
  );
}

export function getUserId(request: any): string {
  const headerId = request.headers['x-user-id'];
  if (typeof headerId === 'string' && headerId.trim().length > 0) return headerId;
  const first = dbData.users[0];
  if (first?.id) return first.id;

  const id = newId();
  const created = now();
  dbData.users.push({
    id,
    email: `user-${id.slice(0, 6)}@spark.local`,
    first_name: 'Local User',
    university: 'Local University',
    campus_id: 'local-campus',
    interests: [],
    prompts: [],
    created_at: created,
    updated_at: created,
  });
  saveDb();
  return id;
}

export function getUserById(id: string) {
  return dbData.users.find((u) => u.id === id) || null;
}

export function upsertUser(user: User) {
  const idx = dbData.users.findIndex((u) => u.id === user.id);
  if (idx >= 0) dbData.users[idx] = user;
  else dbData.users.push(user);
  saveDb();
}

export function updateUser(id: string, patch: Partial<User>) {
  const user = getUserById(id);
  if (!user) return null;
  const updated = { ...user, ...patch, updated_at: now() } as User;
  upsertUser(updated);
  return updated;
}

export function replaceAvailability(userId: string, windows: Array<{ start: string; end: string }>) {
  dbData.availability_windows = dbData.availability_windows.filter((w) => w.user_id !== userId);
  const created = now();
  const rows = windows.map((w) => ({
    id: newId(),
    user_id: userId,
    start_time: w.start,
    end_time: w.end,
    expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    created_at: created,
  }));
  dbData.availability_windows.push(...rows);
  saveDb();
  return rows.length;
}

export function getAvailabilityByUser(userId: string) {
  return dbData.availability_windows.filter((w) => w.user_id === userId);
}

export function getMatchById(matchId: string) {
  return dbData.daily_matches.find((m) => m.id === matchId) || null;
}

export function getMatchByIdForUser(matchId: string, userId: string) {
  return dbData.daily_matches.find((m) => m.id === matchId && m.user_id === userId) || null;
}

export function getTodayMatchForUser(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return dbData.daily_matches
    .filter((m) => m.user_id === userId)
    .filter((m) => m.status === 'pending')
    .filter((m) => m.created_at >= today.toISOString() && m.created_at < tomorrow.toISOString())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
}

export function updateMatch(matchId: string, patch: Partial<DailyMatch>) {
  const idx = dbData.daily_matches.findIndex((m) => m.id === matchId);
  if (idx < 0) return null;
  dbData.daily_matches[idx] = { ...dbData.daily_matches[idx], ...patch } as DailyMatch;
  saveDb();
  return dbData.daily_matches[idx];
}

export function findAcceptedOtherMatch(userId: string, matchedUserId: string) {
  return dbData.daily_matches.find(
    (m) => m.user_id === matchedUserId && m.matched_user_id === userId && m.status === 'accepted'
  ) || null;
}

export function createDailyMatch(match: Omit<DailyMatch, 'id' | 'created_at'>) {
  const row: DailyMatch = { ...match, id: newId(), created_at: now() };
  dbData.daily_matches.push(row);
  saveDb();
  return row;
}

export function createSpark(spark: Omit<Spark, 'id' | 'created_at'>) {
  const row: Spark = { ...spark, id: newId(), created_at: now() };
  dbData.sparks.push(row);
  saveDb();
  return row;
}

export function updateSpark(sparkId: string, patch: Partial<Spark>) {
  const idx = dbData.sparks.findIndex((s) => s.id === sparkId);
  if (idx < 0) return null;
  dbData.sparks[idx] = { ...dbData.sparks[idx], ...patch } as Spark;
  saveDb();
  return dbData.sparks[idx];
}

export function getSparkByMatchIdForUser(matchId: string, userId: string) {
  return dbData.sparks.find(
    (s) => (s.match_a_id === matchId || s.match_b_id === matchId) && (s.user_a_id === userId || s.user_b_id === userId)
  ) || null;
}

export function getSparkByIdForUser(sparkId: string, userId: string) {
  return dbData.sparks.find(
    (s) => s.id === sparkId && (s.user_a_id === userId || s.user_b_id === userId)
  ) || null;
}

export function getSparkById(sparkId: string) {
  return dbData.sparks.find((s) => s.id === sparkId) || null;
}

export function listSparksForUser(userId: string) {
  return dbData.sparks
    .filter((s) => s.user_a_id === userId || s.user_b_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
}

export function upsertSparkRating(sparkId: string, raterId: string, stars: number, wouldMeetAgain: boolean) {
  const idx = dbData.spark_ratings.findIndex((r) => r.spark_id === sparkId && r.rater_id === raterId);
  const row: SparkRating = {
    id: idx >= 0 ? dbData.spark_ratings[idx].id : newId(),
    spark_id: sparkId,
    rater_id: raterId,
    stars,
    would_meet_again: wouldMeetAgain,
    created_at: now(),
  };
  if (idx >= 0) dbData.spark_ratings[idx] = row;
  else dbData.spark_ratings.push(row);
  saveDb();
  return row;
}

export function getSparkRating(sparkId: string, raterId: string) {
  return dbData.spark_ratings.find((r) => r.spark_id === sparkId && r.rater_id === raterId) || null;
}

export function listCampuses() {
  return [...new Set(dbData.users.map((u) => u.campus_id || 'local-campus'))];
}

export function listUsersByCampus(campusId: string) {
  return dbData.users.filter((u) => (u.campus_id || 'local-campus') === campusId);
}

export function listPendingMatchesSince(dateIso: string) {
  return dbData.daily_matches.filter((m) => m.created_at >= dateIso && m.status === 'pending');
}

export function hasMatchBetweenUsersInRange(userId: string, otherUserId: string, start: string, end: string) {
  return dbData.daily_matches.some(
    (m) =>
      m.user_id === userId &&
      m.matched_user_id === otherUserId &&
      m.created_at >= start &&
      m.created_at < end
  );
}
