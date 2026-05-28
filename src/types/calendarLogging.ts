import { DailyMacroLog, MealLog, ProgressPhoto, UnitPreference } from "./models";
import { MuscleGroup } from "./workouts";

export type CalendarIndicatorType =
  | "workout"
  | "cardio"
  | "meal"
  | "macro"
  | "bodyWeight"
  | "progressPhoto"
  | "note";

export type CalendarDaySummary = {
  date: string;
  workoutCount: number;
  cardioCount: number;
  mealCount: number;
  hasMacroLog: boolean;
  bodyWeightCount: number;
  progressPhotoCount: number;
  hasNote: boolean;
};

export type LoggedWorkoutExerciseEntry = {
  id: string;
  workoutLogId: string;
  exerciseName: string;
  muscleGroup?: MuscleGroup;
  orderIndex: number;
  sets?: number;
  reps?: string;
  weight?: number;
  restSeconds?: number;
  notes?: string;
  isPersonalRecord: boolean;
  isCompleted: boolean;
};

export type LoggedWorkoutEntry = {
  id: string;
  date: string;
  routineName: string;
  notes?: string;
  exercises: LoggedWorkoutExerciseEntry[];
  createdAt: string;
};

export type CardioType =
  | "Running"
  | "Walking"
  | "Cycling"
  | "Stairmaster"
  | "Elliptical"
  | "Rowing"
  | "Custom";

export const cardioTypes: CardioType[] = [
  "Running",
  "Walking",
  "Cycling",
  "Stairmaster",
  "Elliptical",
  "Rowing",
  "Custom"
];

export type CardioLogEntry = {
  id: string;
  date: string;
  activityType: CardioType | string;
  durationMinutes: number;
  distance?: number;
  pace?: string;
  speed?: number;
  caloriesBurned?: number;
  notes?: string;
};

export type BodyWeightLogEntry = {
  id: string;
  date: string;
  weight: number;
  units: UnitPreference;
  notes?: string;
};

export type DailyNoteEntry = {
  id: string;
  date: string;
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type DailyLogDetails = {
  date: string;
  workouts: LoggedWorkoutEntry[];
  cardioSessions: CardioLogEntry[];
  meals: MealLog[];
  macroLog?: DailyMacroLog;
  bodyWeightEntries: BodyWeightLogEntry[];
  progressPhotos: ProgressPhoto[];
  dailyNote?: DailyNoteEntry;
};
