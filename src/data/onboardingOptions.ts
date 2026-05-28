import {
  ActivityLevel,
  ExperienceLevel,
  FitnessGoal,
  MazeCoachTone,
  TrainingLocation,
  UnitPreference
} from "../types/models";

export const unitOptions: Array<{ label: string; value: UnitPreference }> = [
  { label: "lb / in", value: "imperial" },
  { label: "kg / cm", value: "metric" }
];

export const fitnessGoalOptions: Array<{ label: string; value: FitnessGoal }> = [
  { label: "Lose weight", value: "lose_weight" },
  { label: "Build muscle", value: "build_muscle" },
  { label: "Maintain", value: "maintain" },
  { label: "Improve endurance", value: "improve_endurance" }
];

export const experienceOptions: Array<{ label: string; value: ExperienceLevel }> = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" }
];

export const trainingLocationOptions: Array<{ label: string; value: TrainingLocation }> = [
  { label: "Gym", value: "gym" },
  { label: "Home", value: "home" },
  { label: "Both", value: "both" }
];

export const dietaryPreferenceOptions = [
  "None",
  "High-protein",
  "Vegetarian",
  "Vegan",
  "Low-carb",
  "Mediterranean"
];

export const activityLevelOptions: Array<{ label: string; value: ActivityLevel }> = [
  { label: "Sedentary", value: "sedentary" },
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Active", value: "active" },
  { label: "Very active", value: "very_active" }
];

export const mazeCoachToneOptions: Array<{ label: string; value: MazeCoachTone }> = [
  { label: "Friendly beginner coach", value: "friendly_beginner" },
  { label: "Serious gym coach", value: "serious_gym" },
  { label: "Professional trainer", value: "professional_trainer" },
  { label: "Motivational but not corny", value: "motivational_not_corny" }
];
