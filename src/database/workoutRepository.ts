import { builtInExercises } from "../data/exerciseLibrary";
import { PersonalRecord, WorkoutLog } from "../types/models";
import {
  CustomExerciseInput,
  ExerciseLibraryItem,
  ExerciseResourceLink,
  MuscleGroup,
  RoutineExercise,
  WorkoutDashboardData,
  WorkoutRoutineDetails
} from "../types/workouts";
import { createLocalId } from "../utils/id";
import { getDatabase } from "./client";

type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
  default_sets: number | null;
  default_reps: string | null;
  instructions: string | null;
  custom_notes: string | null;
  is_custom: number;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type RoutineRow = {
  id: string;
  name: string;
  notes: string | null;
  muscle_groups_json: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};

type RoutineExerciseRow = {
  id: string;
  routine_id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  equipment: string | null;
  order_index: number;
  sets: number;
  reps: string;
  weight: number | null;
  rest_seconds: number | null;
  notes: string | null;
  is_personal_record: number;
  is_completed: number;
};

type ResourceLinkRow = {
  id: string;
  exercise_id: string;
  url: string;
  label: string;
  notes: string | null;
  created_at: string;
};

type WorkoutLogRow = {
  id: string;
  routine_id: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
};

type PersonalRecordRow = {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  record_type: PersonalRecord["recordType"];
  value: number;
  units: string | null;
  achieved_at: string;
  notes: string | null;
};

export async function getWorkoutDashboardData(): Promise<WorkoutDashboardData> {
  const [routines, exercises, recentWorkouts, personalRecords] = await Promise.all([
    getWorkoutRoutines(),
    getExerciseLibrary(),
    getRecentWorkoutLogs(),
    getPersonalRecords()
  ]);

  return {
    routines,
    exercises,
    recentWorkouts,
    personalRecords
  };
}

export async function getExerciseLibrary(): Promise<ExerciseLibraryItem[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExerciseRow>(
    "SELECT * FROM exercises WHERE is_active = 1 ORDER BY name ASC"
  );
  const linksByExercise = await getResourceLinksByExercise();

  const savedById = new Map(rows.map((row) => [row.id, row]));
  const builtIns = builtInExercises.map((exercise) => {
    const override = savedById.get(exercise.id);

    return {
      ...exercise,
      customNotes: override?.custom_notes ?? undefined,
      resourceLinks: linksByExercise.get(exercise.id) ?? []
    };
  });

  const customExercises = rows
    .filter((row) => row.is_custom === 1)
    .map((row) => mapExerciseRow(row, linksByExercise.get(row.id) ?? []));

  return [...builtIns, ...customExercises].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getWorkoutRoutines(): Promise<WorkoutRoutineDetails[]> {
  const database = await getDatabase();
  const routineRows = await database.getAllAsync<RoutineRow>(
    "SELECT * FROM workout_routines ORDER BY updated_at DESC"
  );
  const exerciseRows = await database.getAllAsync<RoutineExerciseRow>(
    "SELECT * FROM routine_exercises ORDER BY routine_id ASC, order_index ASC"
  );
  const exercisesByRoutine = new Map<string, RoutineExercise[]>();

  for (const row of exerciseRows) {
    const mapped = mapRoutineExerciseRow(row);
    const current = exercisesByRoutine.get(row.routine_id) ?? [];
    current.push(mapped);
    exercisesByRoutine.set(row.routine_id, current);
  }

  return routineRows.map((row) => mapRoutineRow(row, exercisesByRoutine.get(row.id) ?? []));
}

export async function saveWorkoutRoutine(
  routine: Omit<WorkoutRoutineDetails, "createdAt" | "updatedAt">
) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO workout_routines (
      id,
      name,
      notes,
      muscle_groups_json,
      is_active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      notes = excluded.notes,
      muscle_groups_json = excluded.muscle_groups_json,
      is_active = excluded.is_active,
      updated_at = excluded.updated_at`,
    [
      routine.id,
      routine.name,
      routine.notes ?? null,
      JSON.stringify(routine.muscleGroups),
      routine.isActive ? 1 : 0,
      now,
      now
    ]
  );

  // Replacing the ordered exercise list keeps edits, removals, and reordering simple and predictable.
  await database.runAsync("DELETE FROM routine_exercises WHERE routine_id = ?", [routine.id]);

  for (const [index, exercise] of routine.exercises.entries()) {
    await database.runAsync(
      `INSERT INTO routine_exercises (
        id,
        routine_id,
        exercise_id,
        exercise_name,
        muscle_group,
        equipment,
        order_index,
        sets,
        reps,
        weight,
        rest_seconds,
        notes,
        is_personal_record,
        is_completed,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        exercise.id,
        routine.id,
        exercise.exerciseId,
        exercise.exerciseName,
        exercise.muscleGroup,
        exercise.equipment ?? null,
        index,
        exercise.sets,
        exercise.reps,
        exercise.weight ?? null,
        exercise.restSeconds ?? null,
        exercise.notes ?? null,
        exercise.isPersonalRecord ? 1 : 0,
        exercise.isCompleted ? 1 : 0,
        now,
        now
      ]
    );
  }
}

export async function duplicateWorkoutRoutine(routineId: string) {
  const routines = await getWorkoutRoutines();
  const routine = routines.find((item) => item.id === routineId);

  if (!routine) {
    return;
  }

  const duplicatedId = createLocalId("routine");
  await saveWorkoutRoutine({
    ...routine,
    id: duplicatedId,
    name: `${routine.name} Copy`,
    exercises: routine.exercises.map((exercise, index) => ({
      ...exercise,
      id: createLocalId("routine-exercise"),
      routineId: duplicatedId,
      orderIndex: index,
      isCompleted: false
    }))
  });
}

export async function deleteWorkoutRoutine(routineId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM workout_routines WHERE id = ?", [routineId]);
}

export async function setWorkoutRoutineActive(routineId: string, isActive: boolean) {
  const database = await getDatabase();
  await database.runAsync(
    "UPDATE workout_routines SET is_active = ?, updated_at = ? WHERE id = ?",
    [isActive ? 1 : 0, new Date().toISOString(), routineId]
  );
}

export async function saveCustomExercise(input: CustomExerciseInput) {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const id = input.id ?? createLocalId("exercise");

  await database.runAsync(
    `INSERT INTO exercises (
      id,
      name,
      muscle_group,
      equipment,
      default_sets,
      default_reps,
      instructions,
      custom_notes,
      is_custom,
      is_active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      muscle_group = excluded.muscle_group,
      equipment = excluded.equipment,
      default_sets = excluded.default_sets,
      default_reps = excluded.default_reps,
      instructions = excluded.instructions,
      custom_notes = excluded.custom_notes,
      updated_at = excluded.updated_at`,
    [
      id,
      input.name,
      input.muscleGroup,
      input.equipment,
      input.defaultSets,
      input.defaultReps,
      input.instructions,
      input.customNotes ?? null,
      now,
      now
    ]
  );

  return id;
}

export async function saveExercisePersonalNotes(exercise: ExerciseLibraryItem, notes: string) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO exercises (
      id,
      name,
      muscle_group,
      equipment,
      default_sets,
      default_reps,
      instructions,
      custom_notes,
      is_custom,
      is_active,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      muscle_group = excluded.muscle_group,
      equipment = excluded.equipment,
      default_sets = excluded.default_sets,
      default_reps = excluded.default_reps,
      instructions = excluded.instructions,
      custom_notes = excluded.custom_notes,
      updated_at = excluded.updated_at`,
    [
      exercise.id,
      exercise.name,
      exercise.muscleGroup,
      exercise.equipment,
      exercise.defaultSets,
      exercise.defaultReps,
      exercise.instructions,
      notes.trim() || null,
      exercise.isBuiltIn ? 0 : 1,
      now,
      now
    ]
  );
}

export async function addExerciseResourceLink(
  exerciseId: string,
  link: Pick<ExerciseResourceLink, "url" | "label" | "notes">
) {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO exercise_resource_links (
      id,
      exercise_id,
      url,
      label,
      notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      createLocalId("resource-link"),
      exerciseId,
      link.url,
      link.label,
      link.notes ?? null,
      new Date().toISOString()
    ]
  );
}

export async function deleteExerciseResourceLink(linkId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM exercise_resource_links WHERE id = ?", [linkId]);
}

async function getResourceLinksByExercise() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ResourceLinkRow>(
    "SELECT * FROM exercise_resource_links ORDER BY created_at DESC"
  );
  const linksByExercise = new Map<string, ExerciseResourceLink[]>();

  for (const row of rows) {
    const current = linksByExercise.get(row.exercise_id) ?? [];
    current.push(mapResourceLinkRow(row));
    linksByExercise.set(row.exercise_id, current);
  }

  return linksByExercise;
}

async function getRecentWorkoutLogs(): Promise<WorkoutLog[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<WorkoutLogRow>(
    "SELECT * FROM workout_logs ORDER BY started_at DESC LIMIT 5"
  );

  return rows.map((row) => ({
    id: row.id,
    routineId: row.routine_id ?? undefined,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  }));
}

async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<PersonalRecordRow>(
    "SELECT * FROM personal_records ORDER BY achieved_at DESC LIMIT 5"
  );

  return rows.map((row) => ({
    id: row.id,
    exerciseId: row.exercise_id ?? undefined,
    exerciseName: row.exercise_name,
    recordType: row.record_type,
    value: row.value,
    units: row.units ?? undefined,
    achievedAt: row.achieved_at,
    notes: row.notes ?? undefined
  }));
}

function mapExerciseRow(row: ExerciseRow, resourceLinks: ExerciseResourceLink[]): ExerciseLibraryItem {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment ?? "Custom",
    defaultSets: row.default_sets ?? 3,
    defaultReps: row.default_reps ?? "8-12",
    instructions: row.instructions ?? "Use controlled form and adjust loading to match the goal.",
    isBuiltIn: row.is_custom === 0,
    customNotes: row.custom_notes ?? undefined,
    resourceLinks
  };
}

function mapRoutineRow(
  row: RoutineRow,
  exercises: RoutineExercise[]
): WorkoutRoutineDetails {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes ?? undefined,
    muscleGroups: parseMuscleGroups(row.muscle_groups_json),
    isActive: row.is_active === 1,
    exercises,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapRoutineExerciseRow(row: RoutineExerciseRow): RoutineExercise {
  return {
    id: row.id,
    routineId: row.routine_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment ?? undefined,
    orderIndex: row.order_index,
    sets: row.sets,
    reps: row.reps,
    weight: row.weight ?? undefined,
    restSeconds: row.rest_seconds ?? undefined,
    notes: row.notes ?? undefined,
    isPersonalRecord: row.is_personal_record === 1,
    isCompleted: row.is_completed === 1
  };
}

function mapResourceLinkRow(row: ResourceLinkRow): ExerciseResourceLink {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    url: row.url,
    label: row.label,
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  };
}

function parseMuscleGroups(value: string): MuscleGroup[] {
  try {
    const parsed = JSON.parse(value) as MuscleGroup[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
