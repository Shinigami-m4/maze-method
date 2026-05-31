export type UnitPreference = "imperial" | "metric";
export type FitnessGoal = "lose_weight" | "build_muscle" | "maintain" | "improve_endurance";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type TrainingLocation = "gym" | "home" | "both";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type MazeCoachTone =
  | "friendly_beginner"
  | "serious_gym"
  | "professional_trainer"
  | "motivational_not_corny";

export type ReminderPreferences = {
  workout: boolean;
  nutrition: boolean;
  progressPhoto: boolean;
  weighIn: boolean;
};

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  notes?: string;
  targetDaysPerWeek?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  customNotes?: string;
  resourceLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutLog {
  id: string;
  routineId?: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface LoggedWorkoutExercise {
  id: string;
  workoutLogId: string;
  exerciseId?: string;
  exerciseName: string;
  sets?: number;
  reps?: number;
  weight?: number;
  durationSeconds?: number;
  distance?: number;
  notes?: string;
}

export interface MealLog {
  id: string;
  loggedAt: string;
  mealName: string;
  mealCategory?: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  notes?: string;
}

export interface DailyMacroLog {
  id: string;
  date: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  waterOunces?: number;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
  units: UnitPreference;
  notes?: string;
}

export interface BodyMeasurementEntry {
  id: string;
  date: string;
  measurementType: string;
  value: number;
  units: UnitPreference;
  notes?: string;
}

export interface CardioSession {
  id: string;
  date: string;
  activityType: string;
  durationMinutes: number;
  distance?: number;
  caloriesBurned?: number;
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;
  localUri: string;
  angle?: "front" | "side" | "back" | "other";
  notes?: string;
  createdAt: string;
}

export interface CalendarEntry {
  id: string;
  date: string;
  entryType: "workout" | "cardio" | "meal" | "progress_photo" | "note" | "measurement";
  title: string;
  relatedId?: string;
  notes?: string;
  createdAt: string;
}

export interface DailyNote {
  id: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId?: string;
  exerciseName: string;
  recordType: "weight" | "reps" | "time" | "distance";
  value: number;
  units?: string;
  achievedAt: string;
  notes?: string;
}
