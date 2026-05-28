import {
  ActivityLevel,
  ExperienceLevel,
  FitnessGoal,
  MazeCoachTone,
  ReminderPreferences,
  TrainingLocation,
  UnitPreference
} from "./models";

export type OnboardingDraft = {
  name: string;
  age?: number;
  gender: string;
  height?: number;
  weight?: number;
  goalWeight?: number;
  units: UnitPreference;
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  trainingLocation: TrainingLocation;
  daysPerWeek: number;
  dietaryPreference: string;
  activityLevel: ActivityLevel;
  mazeCoachTone: MazeCoachTone;
  reminderPreferences: ReminderPreferences;
};
