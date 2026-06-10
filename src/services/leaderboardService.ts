import { getDatabase } from "../database/client";
import { getUserProfile } from "../database/profileRepository";
import { calculateNutritionTargets } from "./nutrition/nutritionTargets";
import { getSupabaseClient } from "./supabaseClient";
import {
  Challenge,
  ChallengeEntry,
  ChallengeLeaderboardEntry,
  ChallengeMetric,
  LeaderboardData
} from "../types/challenges";

type ScoreSummary = {
  score: number;
  evidenceSummary: string;
};

type VolumeRow = {
  total_volume: number | null;
};

type MaxWeightRow = {
  max_weight: number | null;
};

type CountRow = {
  count: number | null;
};

type CardioScoreRow = {
  total_minutes: number | null;
  total_distance: number | null;
};

type MealProteinRow = {
  date: string;
  protein_grams: number | null;
};

type MacroProteinRow = {
  date: string;
  protein_grams: number | null;
};

type ActivityDateRow = {
  date: string;
};

type RemoteLeaderboardRow = {
  id: string;
  challenge_id: string;
  user_id: string;
  display_name: string | null;
  metric: ChallengeMetric;
  score: number | null;
  evidence_summary: string | null;
  last_updated: string | null;
};

export async function getChallengeLeaderboard(
  challenge: Challenge,
  userId?: string
): Promise<LeaderboardData> {
  const client = getSupabaseClient();
  const localEntry = userId ? await refreshMyChallengeEntry(challenge, userId) : undefined;

  if (!client || !userId) {
    return {
      rows: localEntry ? rankRows([localEntry], userId) : [],
      currentUserEntry: localEntry ? rankRows([localEntry], userId)[0] : undefined,
      errorMessage: "Sign in and configure Supabase to see social leaderboard rows."
    };
  }

  const { data, error } = await client
    .from("challenge_entries")
    .select("*")
    .eq("challenge_id", challenge.id)
    .order("score", { ascending: false });

  if (error) {
    const rows = localEntry ? rankRows([localEntry], userId) : [];
    return {
      rows,
      currentUserEntry: rows.find((row) => row.isCurrentUser),
      errorMessage: error.message
    };
  }

  const entries = ((data ?? []) as RemoteLeaderboardRow[]).map(mapRemoteLeaderboardRow);
  const rows = rankRows(mergeLocalEntry(entries, localEntry), userId);

  return {
    rows,
    currentUserEntry: rows.find((row) => row.isCurrentUser)
  };
}

export async function refreshMyChallengeEntry(
  challenge: Challenge,
  userId: string
): Promise<ChallengeEntry> {
  const client = getSupabaseClient();
  const profile = await getUserProfile();
  const displayName = profile?.name?.trim() || "Maze Athlete";
  const scoreSummary = await calculateChallengeScore(challenge);
  const now = new Date().toISOString();
  const entry: ChallengeEntry = {
    id: `${challenge.id}-${userId}`,
    challengeId: challenge.id,
    userId,
    displayName,
    metric: challenge.metric,
    score: scoreSummary.score,
    evidenceSummary: scoreSummary.evidenceSummary,
    lastUpdated: now
  };

  if (client) {
    // Recalculate from local SQLite each time the leaderboard opens. Edited logs
    // update the next score because this upsert overwrites the previous entry.
    await client.from("challenge_entries").upsert(
      {
        challenge_id: challenge.id,
        user_id: userId,
        display_name: displayName,
        metric: challenge.metric,
        score: scoreSummary.score,
        evidence_summary: scoreSummary.evidenceSummary,
        last_updated: now
      },
      { onConflict: "challenge_id,user_id" }
    );
  }

  return entry;
}

export async function calculateChallengeScore(challenge: Challenge): Promise<ScoreSummary> {
  if (challenge.metric === "total_volume") {
    return getTotalVolumeScore(challenge);
  }

  if (challenge.metric === "max_weight") {
    return getMaxWeightScore(challenge);
  }

  if (challenge.metric === "workout_count") {
    return getWorkoutCountScore(challenge);
  }

  if (challenge.metric === "cardio_minutes" || challenge.metric === "cardio_distance") {
    return getCardioScore(challenge);
  }

  if (challenge.metric === "protein_goal_days") {
    return getProteinGoalDaysScore(challenge);
  }

  return getStreakDaysScore(challenge);
}

async function getTotalVolumeScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<VolumeRow>(
    `SELECT SUM(COALESCE(lwe.sets, 0) * COALESCE(CAST(lwe.reps AS REAL), 0) * COALESCE(lwe.weight, 0)) AS total_volume
     FROM logged_workout_exercises lwe
     JOIN workout_logs wl ON wl.id = lwe.workout_log_id
     WHERE substr(wl.started_at, 1, 10) BETWEEN ? AND ?
       AND lwe.is_completed = 1`,
    [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
  );
  const score = Math.round(row?.total_volume ?? 0);

  return {
    score,
    evidenceSummary: "Sum of completed sets x reps x weight in the challenge window."
  };
}

async function getMaxWeightScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<MaxWeightRow>(
    `SELECT MAX(lwe.weight) AS max_weight
     FROM logged_workout_exercises lwe
     JOIN workout_logs wl ON wl.id = lwe.workout_log_id
     WHERE substr(wl.started_at, 1, 10) BETWEEN ? AND ?
       AND lwe.is_completed = 1`,
    [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
  );

  return {
    score: Math.round(row?.max_weight ?? 0),
    evidenceSummary: "Highest completed logged exercise weight in the challenge window."
  };
}

async function getWorkoutCountScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CountRow>(
    `SELECT COUNT(DISTINCT wl.id) AS count
     FROM workout_logs wl
     WHERE substr(wl.started_at, 1, 10) BETWEEN ? AND ?`,
    [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
  );

  return {
    score: row?.count ?? 0,
    evidenceSummary: "Count of workout logs in the challenge window."
  };
}

async function getCardioScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<CardioScoreRow>(
    `SELECT SUM(duration_minutes) AS total_minutes,
            SUM(distance) AS total_distance
     FROM cardio_sessions
     WHERE date BETWEEN ? AND ?`,
    [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
  );
  const isDistance = challenge.metric === "cardio_distance";

  return {
    score: Math.round(isDistance ? row?.total_distance ?? 0 : row?.total_minutes ?? 0),
    evidenceSummary: isDistance
      ? "Sum of manually logged cardio distance in the challenge window."
      : "Sum of manually logged cardio minutes in the challenge window."
  };
}

async function getProteinGoalDaysScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const profile = await getUserProfile();
  const proteinTarget = calculateNutritionTargets(profile).proteinGrams;
  const [mealRows, macroRows] = await Promise.all([
    database.getAllAsync<MealProteinRow>(
      `SELECT substr(logged_at, 1, 10) AS date,
              SUM(protein_grams) AS protein_grams
       FROM meals
       WHERE substr(logged_at, 1, 10) BETWEEN ? AND ?
       GROUP BY substr(logged_at, 1, 10)`,
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    ),
    database.getAllAsync<MacroProteinRow>(
      `SELECT date, protein_grams
       FROM daily_macro_logs
       WHERE date BETWEEN ? AND ?`,
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    )
  ]);
  const proteinByDate = new Map<string, number>();

  for (const row of mealRows) {
    proteinByDate.set(row.date, row.protein_grams ?? 0);
  }

  for (const row of macroRows) {
    if (typeof row.protein_grams === "number") {
      proteinByDate.set(row.date, row.protein_grams);
    }
  }

  const score = Array.from(proteinByDate.values()).filter((protein) => protein >= proteinTarget).length;

  return {
    score,
    evidenceSummary: `Days with at least ${Math.round(proteinTarget)}g protein logged.`
  };
}

async function getStreakDaysScore(challenge: Challenge): Promise<ScoreSummary> {
  const database = await getDatabase();
  const [workoutRows, cardioRows, mealRows, macroRows] = await Promise.all([
    database.getAllAsync<ActivityDateRow>(
      `SELECT DISTINCT substr(started_at, 1, 10) AS date
       FROM workout_logs
       WHERE substr(started_at, 1, 10) BETWEEN ? AND ?`,
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    ),
    database.getAllAsync<ActivityDateRow>(
      "SELECT DISTINCT date FROM cardio_sessions WHERE date BETWEEN ? AND ?",
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    ),
    database.getAllAsync<ActivityDateRow>(
      `SELECT DISTINCT substr(logged_at, 1, 10) AS date
       FROM meals
       WHERE substr(logged_at, 1, 10) BETWEEN ? AND ?`,
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    ),
    database.getAllAsync<ActivityDateRow>(
      "SELECT DISTINCT date FROM daily_macro_logs WHERE date BETWEEN ? AND ?",
      [toDateKey(challenge.startsAt), toDateKey(challenge.endsAt)]
    )
  ]);
  const activeDates = new Set(
    [...workoutRows, ...cardioRows, ...mealRows, ...macroRows].map((row) => row.date)
  );

  return {
    score: getLongestDateStreak(activeDates),
    evidenceSummary: "Longest streak of days with a workout, cardio, meal, or macro log."
  };
}

function rankRows(entries: ChallengeEntry[], currentUserId?: string): ChallengeLeaderboardEntry[] {
  return entries
    .slice()
    .sort((a, b) => b.score - a.score || a.lastUpdated.localeCompare(b.lastUpdated))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
      isCurrentUser: entry.userId === currentUserId
    }));
}

function mergeLocalEntry(entries: ChallengeEntry[], localEntry?: ChallengeEntry) {
  if (!localEntry) {
    return entries;
  }

  const withoutCurrentUser = entries.filter((entry) => entry.userId !== localEntry.userId);
  return [...withoutCurrentUser, localEntry];
}

function mapRemoteLeaderboardRow(row: RemoteLeaderboardRow): ChallengeEntry {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    displayName: row.display_name ?? "Maze Athlete",
    metric: row.metric,
    score: row.score ?? 0,
    evidenceSummary: row.evidence_summary ?? undefined,
    lastUpdated: row.last_updated ?? new Date().toISOString()
  };
}

function getLongestDateStreak(dates: Set<string>) {
  let longest = 0;
  let current = 0;
  let cursor = new Date();
  const sortedDates = Array.from(dates).sort();

  for (const dateKey of sortedDates) {
    const date = parseDateKey(dateKey);

    if (current === 0 || daysBetween(cursor, date) === 1) {
      current += 1;
    } else if (daysBetween(cursor, date) > 1) {
      current = 1;
    }

    longest = Math.max(longest, current);
    cursor = date;
  }

  return longest;
}

function toDateKey(value: string) {
  return value.slice(0, 10);
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start: Date, end: Date) {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}
