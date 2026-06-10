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

export interface CloudSyncMetadata {
  localId?: string;
  remoteId?: string;
  userId?: string;
  syncStatus?: SyncStatus;
  deletedAt?: string;
}

export type SyncStatus = "pending" | "synced" | "failed";

export type ReminderPreferences = {
  workout: boolean;
  nutrition: boolean;
  progressPhoto: boolean;
  weighIn: boolean;
};

export interface UserProfile extends CloudSyncMetadata {
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

export interface WorkoutRoutine extends CloudSyncMetadata {
  id: string;
  name: string;
  notes?: string;
  targetDaysPerWeek?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Exercise extends CloudSyncMetadata {
  id: string;
  name: string;
  muscleGroup?: string;
  equipment?: string;
  customNotes?: string;
  resourceLinks?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutLog extends CloudSyncMetadata {
  id: string;
  routineId?: string;
  startedAt: string;
  endedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoggedWorkoutExercise extends CloudSyncMetadata {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface MealLog extends CloudSyncMetadata {
  id: string;
  loggedAt: string;
  mealName: string;
  mealCategory?: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DailyMacroLog extends CloudSyncMetadata {
  id: string;
  date: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  waterOunces?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BodyWeightEntry extends CloudSyncMetadata {
  id: string;
  date: string;
  weight: number;
  units: UnitPreference;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BodyMeasurementEntry extends CloudSyncMetadata {
  id: string;
  date: string;
  measurementType: string;
  value: number;
  units: UnitPreference;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CardioSession extends CloudSyncMetadata {
  id: string;
  date: string;
  activityType: string;
  durationMinutes: number;
  distance?: number;
  caloriesBurned?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgressPhoto extends CloudSyncMetadata {
  id: string;
  date: string;
  localUri: string;
  remoteStoragePath?: string;
  angle?: "front" | "side" | "back" | "other";
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CalendarEntry extends CloudSyncMetadata {
  id: string;
  date: string;
  entryType: "workout" | "cardio" | "meal" | "progress_photo" | "note" | "measurement";
  title: string;
  relatedId?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DailyNote extends CloudSyncMetadata {
  id: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface MazeCoachHistory extends CloudSyncMetadata {
  id: string;
  source: "backend" | "backend_fallback" | "local_mock" | "local_fallback";
  tone?: MazeCoachTone;
  promptContext?: unknown;
  recommendation: unknown;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalRecord extends CloudSyncMetadata {
  id: string;
  exerciseId?: string;
  exerciseName: string;
  recordType: "weight" | "reps" | "time" | "distance";
  value: number;
  units?: string;
  achievedAt: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
