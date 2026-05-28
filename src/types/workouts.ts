import { PersonalRecord, WorkoutLog } from "./models";

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Legs"
  | "Glutes"
  | "Core"
  | "Cardio"
  | "Full Body"
  | "Mobility";

export const muscleGroups: MuscleGroup[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Core",
  "Cardio",
  "Full Body",
  "Mobility"
];

export type ExerciseResourceLink = {
  id: string;
  exerciseId: string;
  url: string;
  label: string;
  notes?: string;
  createdAt: string;
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  defaultSets: number;
  defaultReps: string;
  instructions: string;
  isBuiltIn: boolean;
  customNotes?: string;
  resourceLinks: ExerciseResourceLink[];
};

export type CustomExerciseInput = {
  id?: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  defaultSets: number;
  defaultReps: string;
  instructions: string;
  customNotes?: string;
};

export type RoutineExercise = {
  id: string;
  routineId: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  equipment?: string;
  orderIndex: number;
  sets: number;
  reps: string;
  weight?: number;
  restSeconds?: number;
  notes?: string;
  isPersonalRecord: boolean;
  isCompleted: boolean;
};

export type WorkoutRoutineDetails = {
  id: string;
  name: string;
  notes?: string;
  muscleGroups: MuscleGroup[];
  isActive: boolean;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutDashboardData = {
  routines: WorkoutRoutineDetails[];
  exercises: ExerciseLibraryItem[];
  recentWorkouts: WorkoutLog[];
  personalRecords: PersonalRecord[];
};
