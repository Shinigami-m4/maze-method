import { getUserProfile } from "../database/profileRepository";
import { createLocalId } from "../utils/id";
import { getSupabaseClient } from "./supabaseClient";
import {
  Challenge,
  ChallengeCategory,
  ChallengeDashboardData,
  ChallengeMetric,
  ChallengeParticipant,
  ChallengeStatus,
  ChallengeVisibility,
  CreateChallengeInput
} from "../types/challenges";

type RemoteChallengeRow = {
  id: string;
  title: string;
  description: string | null;
  category: ChallengeCategory;
  metric: ChallengeMetric;
  visibility: ChallengeVisibility;
  creator_user_id: string;
  starts_at: string;
  ends_at: string;
  status: ChallengeStatus | null;
  participant_count: number | null;
  created_at: string;
  updated_at: string;
};

type RemoteParticipantRow = {
  id: string;
  challenge_id: string;
  user_id: string;
  display_name: string | null;
  status: "joined" | "left" | "completed";
  joined_at: string;
  left_at: string | null;
};

type RemoteParticipantWithChallengeRow = RemoteParticipantRow & {
  challenges?: RemoteChallengeRow | null;
};

export const challengeCategoryLabels: Record<ChallengeCategory, string> = {
  lifting: "Lifting",
  cardio: "Cardio",
  nutrition: "Nutrition",
  consistency: "Consistency"
};

export const challengeMetricLabels: Record<ChallengeMetric, string> = {
  total_volume: "Total volume",
  max_weight: "Max weight",
  workout_count: "Workout count",
  cardio_minutes: "Cardio minutes",
  cardio_distance: "Cardio distance",
  protein_goal_days: "Protein goal days",
  streak_days: "Streak days"
};

export const challengeVisibilityLabels: Record<ChallengeVisibility, string> = {
  public: "Public",
  friends_only: "Friends-only",
  invite_only: "Invite-only"
};

export async function getChallengeDashboard(userId?: string): Promise<ChallengeDashboardData> {
  const client = getSupabaseClient();

  if (!client || !userId) {
    return {
      activeChallenges: [],
      discoverChallenges: [],
      completedChallenges: [],
      errorMessage: "Sign in and sync data before using social challenges."
    };
  }

  const [challengeResult, participantResult] = await Promise.all([
    client
      .from("challenges")
      .select("*")
      .or(`visibility.eq.public,creator_user_id.eq.${userId}`)
      .order("starts_at", { ascending: false }),
    client.from("challenge_participants").select("*").eq("user_id", userId)
  ]);

  if (challengeResult.error || participantResult.error) {
    return {
      activeChallenges: [],
      discoverChallenges: [],
      completedChallenges: [],
      errorMessage: challengeResult.error?.message ?? participantResult.error?.message
    };
  }

  const participantRows = (participantResult.data ?? []) as RemoteParticipantRow[];
  const joinedChallengeIds = new Set(
    participantRows
      .filter((participant) => participant.status === "joined")
      .map((participant) => participant.challenge_id)
  );
  const challenges = ((challengeResult.data ?? []) as RemoteChallengeRow[]).map((row) =>
    mapRemoteChallenge(row, joinedChallengeIds.has(row.id))
  );

  return {
    activeChallenges: challenges.filter((challenge) => challenge.isJoined && challenge.status !== "completed"),
    discoverChallenges: challenges.filter((challenge) => !challenge.isJoined && challenge.status !== "completed"),
    completedChallenges: challenges.filter((challenge) => challenge.isJoined && challenge.status === "completed")
  };
}

export async function getChallengeById(challengeId: string, userId?: string): Promise<Challenge | null> {
  const client = getSupabaseClient();

  if (!client) {
    return null;
  }

  const [{ data, error }, participantResult] = await Promise.all([
    client.from("challenges").select("*").eq("id", challengeId).single(),
    userId
      ? client
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);

  if (error || !data) {
    return null;
  }

  const participant = participantResult.data as RemoteParticipantRow | null;
  return mapRemoteChallenge(data as RemoteChallengeRow, participant?.status === "joined");
}

export async function createChallenge(input: CreateChallengeInput, userId: string): Promise<Challenge> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const now = new Date().toISOString();
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    metric: input.metric,
    visibility: input.visibility,
    creator_user_id: userId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    status: getChallengeStatus(input.startsAt, input.endsAt),
    participant_count: 1,
    created_at: now,
    updated_at: now
  };
  const { data, error } = await client.from("challenges").insert(payload).select("*").single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not create challenge.");
  }

  await joinChallenge(String((data as RemoteChallengeRow).id), userId);
  return mapRemoteChallenge(data as RemoteChallengeRow, true);
}

export async function joinChallenge(challengeId: string, userId: string) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const profile = await getUserProfile();
  const now = new Date().toISOString();
  const { error } = await client.from("challenge_participants").upsert(
    {
      id: createLocalId("challenge-participant"),
      challenge_id: challengeId,
      user_id: userId,
      display_name: profile?.name?.trim() || "Maze Athlete",
      status: "joined",
      joined_at: now,
      left_at: null
    },
    { onConflict: "challenge_id,user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  await refreshChallengeParticipantCount(challengeId);
}

export async function leaveChallenge(challengeId: string, userId: string) {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await client
    .from("challenge_participants")
    .update({
      status: "left",
      left_at: new Date().toISOString()
    })
    .eq("challenge_id", challengeId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  await refreshChallengeParticipantCount(challengeId);
}

export async function getMyChallengeHistory(userId: string): Promise<Challenge[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("challenge_participants")
    .select("*, challenges(*)")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RemoteParticipantWithChallengeRow[])
    .filter((row) => {
      if (!row.challenges) {
        return false;
      }

      const status = row.challenges.status ?? getChallengeStatus(row.challenges.starts_at, row.challenges.ends_at);
      return row.status === "left" || row.status === "completed" || status === "completed";
    })
    .map((row) => (row.challenges ? mapRemoteChallenge(row.challenges, row.status !== "left") : null))
    .filter((challenge): challenge is Challenge => Boolean(challenge));
}

function mapRemoteChallenge(row: RemoteChallengeRow, isJoined: boolean): Challenge {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.category,
    metric: row.metric,
    visibility: row.visibility,
    creatorUserId: row.creator_user_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status ?? getChallengeStatus(row.starts_at, row.ends_at),
    participantCount: row.participant_count ?? 0,
    isJoined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function getChallengeStatus(startsAt: string, endsAt: string): ChallengeStatus {
  const now = Date.now();
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);

  if (Number.isFinite(start) && now < start) {
    return "upcoming";
  }

  if (Number.isFinite(end) && now > end) {
    return "completed";
  }

  return "active";
}

async function refreshChallengeParticipantCount(challengeId: string) {
  const client = getSupabaseClient();

  if (!client) {
    return;
  }

  const { count, error } = await client
    .from("challenge_participants")
    .select("id", { count: "exact", head: true })
    .eq("challenge_id", challengeId)
    .eq("status", "joined");

  if (error || typeof count !== "number") {
    return;
  }

  // Participant counts are denormalized for fast cards. If RLS blocks this for
  // non-creators, the app still works and a database trigger can own it later.
  await client
    .from("challenges")
    .update({ participant_count: count, updated_at: new Date().toISOString() })
    .eq("id", challengeId);
}
