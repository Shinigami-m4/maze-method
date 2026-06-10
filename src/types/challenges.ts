export type ChallengeCategory = "lifting" | "cardio" | "nutrition" | "consistency";

export type ChallengeMetric =
  | "total_volume"
  | "max_weight"
  | "workout_count"
  | "cardio_minutes"
  | "cardio_distance"
  | "protein_goal_days"
  | "streak_days";

export type ChallengeVisibility = "public" | "friends_only" | "invite_only";

export type ChallengeStatus = "upcoming" | "active" | "completed";

export type ChallengeParticipantStatus = "joined" | "left" | "completed";

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  category: ChallengeCategory;
  metric: ChallengeMetric;
  visibility: ChallengeVisibility;
  creatorUserId: string;
  startsAt: string;
  endsAt: string;
  status: ChallengeStatus;
  participantCount: number;
  isJoined?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChallengeParticipant {
  id: string;
  challengeId: string;
  userId: string;
  displayName?: string;
  status: ChallengeParticipantStatus;
  joinedAt: string;
  leftAt?: string;
}

export interface ChallengeEntry {
  id: string;
  challengeId: string;
  userId: string;
  displayName: string;
  metric: ChallengeMetric;
  score: number;
  evidenceSummary?: string;
  lastUpdated: string;
}

export interface ChallengeLeaderboardEntry extends ChallengeEntry {
  rank: number;
  isCurrentUser?: boolean;
}

export type CreateChallengeInput = {
  title: string;
  description?: string;
  category: ChallengeCategory;
  metric: ChallengeMetric;
  visibility: ChallengeVisibility;
  startsAt: string;
  endsAt: string;
};

export type ChallengeDashboardData = {
  activeChallenges: Challenge[];
  discoverChallenges: Challenge[];
  completedChallenges: Challenge[];
  errorMessage?: string;
};

export type LeaderboardData = {
  rows: ChallengeLeaderboardEntry[];
  currentUserEntry?: ChallengeLeaderboardEntry;
  errorMessage?: string;
};
