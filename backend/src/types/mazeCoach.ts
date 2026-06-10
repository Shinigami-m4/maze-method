export type MazeCoachTone =
  | "friendly_beginner"
  | "serious_gym"
  | "professional_trainer"
  | "motivational_not_corny";

export type MazeCoachProfile = {
  name?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  goalWeight?: number;
  units?: "imperial" | "metric";
  fitnessGoal?: string;
  activityLevel?: string;
  daysPerWeek?: number;
  dietaryPreference?: string;
  experienceLevel?: string;
  trainingLocation?: string;
};

export type MazeCoachRequest = {
  profile: MazeCoachProfile | null;
  fitnessGoal: string;
  recentWorkoutLogs: unknown[];
  recentNutritionLogs: unknown[];
  recentWeightTrend: unknown;
  cardioHistorySummary: unknown;
  preferredMazeCoachTone: MazeCoachTone;
};

export type MazeCoachRecommendation = {
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
