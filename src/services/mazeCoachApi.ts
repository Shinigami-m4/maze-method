import { FitnessGoal, MazeCoachTone, UserProfile } from "../types/models";

export type MazeCoachApiRequest = {
  profile: Partial<UserProfile> | null;
  fitnessGoal: FitnessGoal;
  recentWorkoutLogs: unknown[];
  recentNutritionLogs: unknown[];
  recentWeightTrend: unknown;
  cardioHistorySummary: unknown;
  preferredMazeCoachTone: MazeCoachTone;
};

export type MazeCoachApiRecommendation = {
  caloriesTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatsTarget: number;
  suggestedWorkout: string;
  suggestedMeals: string[];
  recoveryAdvice: string;
  explanation: string;
  safetyNote: string;
};

type MazeCoachApiResponse = {
  source?: "openai" | "backend_fallback";
  error?: string;
  recommendation?: MazeCoachApiRecommendation;
};

const mazeCoachBackendUrl = process.env.EXPO_PUBLIC_MAZE_COACH_API_URL ?? "";

export const isMazeCoachBackendConfigured = mazeCoachBackendUrl.trim().length > 0;

export async function requestBackendMazeCoachRecommendation(
  payload: MazeCoachApiRequest
): Promise<{ recommendation: MazeCoachApiRecommendation; source: "backend" | "backend_fallback"; error?: string }> {
  if (!isMazeCoachBackendConfigured) {
    throw new Error("Maze Coach backend URL is not configured.");
  }

  // The mobile app calls only the trusted backend URL. OpenAI keys and service
  // role secrets remain server-side in the backend environment.
  const response = await fetch(`${mazeCoachBackendUrl.replace(/\/$/, "")}/api/maze-coach/recommendation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = (await response.json().catch(() => null)) as MazeCoachApiResponse | null;

  if (!response.ok) {
    throw new Error(body?.error ?? `Maze Coach backend failed with status ${response.status}.`);
  }

  if (!body?.recommendation) {
    throw new Error("Maze Coach backend did not return a recommendation.");
  }

  return {
    recommendation: body.recommendation,
    source: body.source === "backend_fallback" ? "backend_fallback" : "backend",
    error: body.error
  };
}
