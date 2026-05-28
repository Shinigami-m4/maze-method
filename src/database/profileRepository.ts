import { UserProfile } from "../types/models";
import { getDatabase } from "./client";

type UserProfileRow = {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goal_weight?: number;
  units: UserProfile["units"];
  fitness_goal: UserProfile["fitnessGoal"];
  experience_level: UserProfile["experienceLevel"];
  training_location: UserProfile["trainingLocation"];
  days_per_week: number;
  dietary_preference: string;
  activity_level: UserProfile["activityLevel"];
  maze_coach_tone: UserProfile["mazeCoachTone"];
  created_at: string;
  updated_at: string;
};

const LOCAL_PROFILE_ID = "local-user";

export function getLocalProfileId() {
  return LOCAL_PROFILE_ID;
}

export async function saveUserProfile(profile: UserProfile) {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO user_profiles (
      id,
      name,
      age,
      gender,
      height,
      weight,
      goal_weight,
      units,
      fitness_goal,
      experience_level,
      training_location,
      days_per_week,
      dietary_preference,
      activity_level,
      maze_coach_tone,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      age = excluded.age,
      gender = excluded.gender,
      height = excluded.height,
      weight = excluded.weight,
      goal_weight = excluded.goal_weight,
      units = excluded.units,
      fitness_goal = excluded.fitness_goal,
      experience_level = excluded.experience_level,
      training_location = excluded.training_location,
      days_per_week = excluded.days_per_week,
      dietary_preference = excluded.dietary_preference,
      activity_level = excluded.activity_level,
      maze_coach_tone = excluded.maze_coach_tone,
      updated_at = excluded.updated_at`,
    [
      profile.id,
      profile.name,
      profile.age ?? null,
      profile.gender ?? null,
      profile.height ?? null,
      profile.weight ?? null,
      profile.goalWeight ?? null,
      profile.units,
      profile.fitnessGoal,
      profile.experienceLevel,
      profile.trainingLocation,
      profile.daysPerWeek,
      profile.dietaryPreference,
      profile.activityLevel,
      profile.mazeCoachTone,
      profile.createdAt,
      profile.updatedAt
    ]
  );
}

export async function getUserProfile() {
  const database = await getDatabase();
  const row = await database.getFirstAsync<UserProfileRow>(
    "SELECT * FROM user_profiles WHERE id = ? LIMIT 1",
    [LOCAL_PROFILE_ID]
  );

  if (!row) {
    return null;
  }

  return mapProfileRow(row);
}

function mapProfileRow(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? undefined,
    gender: row.gender ?? undefined,
    height: row.height ?? undefined,
    weight: row.weight ?? undefined,
    goalWeight: row.goal_weight ?? undefined,
    units: row.units,
    fitnessGoal: row.fitness_goal,
    experienceLevel: row.experience_level,
    trainingLocation: row.training_location,
    daysPerWeek: row.days_per_week,
    dietaryPreference: row.dietary_preference,
    activityLevel: row.activity_level,
    mazeCoachTone: row.maze_coach_tone,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
