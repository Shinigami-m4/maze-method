import {
  BodyWeightLogEntry,
  CalendarDaySummary,
  CardioLogEntry,
  DailyLogDetails,
  DailyNoteEntry,
  LoggedWorkoutEntry,
  LoggedWorkoutExerciseEntry
} from "../types/calendarLogging";
import { DailyMacroLog, MealLog, ProgressPhoto } from "../types/models";
import { MealCategory } from "../types/nutrition";
import { MuscleGroup } from "../types/workouts";
import { createLocalId } from "../utils/id";
import { getDatabase } from "./client";
import { getWorkoutRoutines } from "./workoutRepository";

type CountRow = {
  date: string;
  count: number;
};

type WorkoutLogRow = {
  id: string;
  routine_id: string | null;
  routine_name: string | null;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
};

type LoggedWorkoutExerciseRow = {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  sets: number | null;
  reps: string | number | null;
  weight: number | null;
  rest_seconds: number | null;
  muscle_group: MuscleGroup | null;
  order_index: number | null;
  is_personal_record: number;
  is_completed: number;
  notes: string | null;
};

type CardioRow = {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number;
  distance: number | null;
  pace: string | null;
  speed: number | null;
  calories_burned: number | null;
  notes: string | null;
};

type MealRow = {
  id: string;
  logged_at: string;
  meal_name: string;
  meal_category: MealCategory | null;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  notes: string | null;
};

type MacroRow = {
  id: string;
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  water_ounces: number | null;
};

type BodyWeightRow = {
  id: string;
  date: string;
  weight: number;
  units: BodyWeightLogEntry["units"];
  notes: string | null;
};

type ProgressPhotoRow = {
  id: string;
  date: string;
  local_uri: string;
  angle: ProgressPhoto["angle"] | null;
  notes: string | null;
  created_at: string;
};

type DailyNoteRow = {
  id: string;
  date: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export async function getCalendarMonthSummaries(year: number, monthIndex: number) {
  const startDate = toDateKey(new Date(year, monthIndex, 1));
  const endDate = toDateKey(new Date(year, monthIndex + 1, 0));
  const summaries = new Map<string, CalendarDaySummary>();

  // Calendar cells use counts/flags rather than full records so the month grid stays fast and uncluttered.
  const ensureSummary = (date: string) => {
    const current = summaries.get(date);

    if (current) {
      return current;
    }

    const created: CalendarDaySummary = {
      date,
      workoutCount: 0,
      cardioCount: 0,
      mealCount: 0,
      hasMacroLog: false,
      bodyWeightCount: 0,
      progressPhotoCount: 0,
      hasNote: false
    };
    summaries.set(date, created);

    return created;
  };

  const [workouts, cardio, meals, macros, bodyWeights, photos, notes] = await Promise.all([
    getCountRows("workout_logs", "substr(started_at, 1, 10)", startDate, endDate),
    getCountRows("cardio_sessions", "date", startDate, endDate),
    getCountRows("meals", "substr(logged_at, 1, 10)", startDate, endDate),
    getCountRows("daily_macro_logs", "date", startDate, endDate),
    getCountRows("body_weight_entries", "date", startDate, endDate),
    getCountRows("progress_photos", "date", startDate, endDate),
    getCountRows("daily_notes", "date", startDate, endDate)
  ]);

  workouts.forEach((row) => {
    ensureSummary(row.date).workoutCount = row.count;
  });
  cardio.forEach((row) => {
    ensureSummary(row.date).cardioCount = row.count;
  });
  meals.forEach((row) => {
    ensureSummary(row.date).mealCount = row.count;
  });
  macros.forEach((row) => {
    ensureSummary(row.date).hasMacroLog = row.count > 0;
  });
  bodyWeights.forEach((row) => {
    ensureSummary(row.date).bodyWeightCount = row.count;
  });
  photos.forEach((row) => {
    ensureSummary(row.date).progressPhotoCount = row.count;
  });
  notes.forEach((row) => {
    ensureSummary(row.date).hasNote = row.count > 0;
  });

  return Array.from(summaries.values());
}

export async function getDailyLogDetails(date: string): Promise<DailyLogDetails> {
  const database = await getDatabase();
  const [workoutRows, exerciseRows, cardioRows, mealRows, macroRow, bodyWeightRows, photoRows, noteRow] =
    await Promise.all([
      database.getAllAsync<WorkoutLogRow>(
        "SELECT * FROM workout_logs WHERE substr(started_at, 1, 10) = ? ORDER BY started_at ASC",
        [date]
      ),
      database.getAllAsync<LoggedWorkoutExerciseRow>(
        `SELECT lwe.*
         FROM logged_workout_exercises lwe
         JOIN workout_logs wl ON wl.id = lwe.workout_log_id
         WHERE substr(wl.started_at, 1, 10) = ?
         ORDER BY lwe.workout_log_id ASC, COALESCE(lwe.order_index, 0) ASC`,
        [date]
      ),
      database.getAllAsync<CardioRow>(
        "SELECT * FROM cardio_sessions WHERE date = ? ORDER BY id DESC",
        [date]
      ),
      database.getAllAsync<MealRow>(
        "SELECT * FROM meals WHERE substr(logged_at, 1, 10) = ? ORDER BY logged_at ASC",
        [date]
      ),
      database.getFirstAsync<MacroRow>("SELECT * FROM daily_macro_logs WHERE date = ? LIMIT 1", [
        date
      ]),
      database.getAllAsync<BodyWeightRow>(
        "SELECT * FROM body_weight_entries WHERE date = ? ORDER BY id DESC",
        [date]
      ),
      database.getAllAsync<ProgressPhotoRow>(
        "SELECT * FROM progress_photos WHERE date = ? ORDER BY created_at DESC",
        [date]
      ),
      database.getFirstAsync<DailyNoteRow>("SELECT * FROM daily_notes WHERE date = ? LIMIT 1", [
        date
      ])
    ]);

  const exercisesByWorkout = new Map<string, LoggedWorkoutExerciseEntry[]>();

  // Group logged exercises by workout log before mapping the daily detail view.
  exerciseRows.forEach((row) => {
    const current = exercisesByWorkout.get(row.workout_log_id) ?? [];
    current.push(mapLoggedExercise(row));
    exercisesByWorkout.set(row.workout_log_id, current);
  });

  return {
    date,
    workouts: workoutRows.map((row) => mapWorkoutLog(row, exercisesByWorkout.get(row.id) ?? [])),
    cardioSessions: cardioRows.map(mapCardioRow),
    meals: mealRows.map(mapMealRow),
    macroLog: macroRow ? mapMacroRow(macroRow) : undefined,
    bodyWeightEntries: bodyWeightRows.map(mapBodyWeightRow),
    progressPhotos: photoRows.map(mapProgressPhotoRow),
    dailyNote: noteRow ? mapDailyNoteRow(noteRow) : undefined
  };
}

export async function logRoutineForDate(routineId: string, date: string) {
  const routines = await getWorkoutRoutines();
  const routine = routines.find((item) => item.id === routineId);

  if (!routine) {
    return;
  }

  const database = await getDatabase();
  const now = new Date().toISOString();
  const workoutLogId = createLocalId("workout-log");

  await database.runAsync(
    `INSERT INTO workout_logs (
      id,
      routine_id,
      routine_name,
      started_at,
      ended_at,
      notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      workoutLogId,
      null,
      routine.name,
      `${date}T12:00:00.000`,
      null,
      routine.notes ?? null,
      now
    ]
  );

  // Copy routine exercises into the log so later routine edits never rewrite history.
  for (const [index, exercise] of routine.exercises.entries()) {
    await database.runAsync(
      `INSERT INTO logged_workout_exercises (
        id,
        workout_log_id,
        exercise_id,
        exercise_name,
        sets,
        reps,
        weight,
        rest_seconds,
        muscle_group,
        order_index,
        is_personal_record,
        is_completed,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createLocalId("logged-exercise"),
        workoutLogId,
        null,
        exercise.exerciseName,
        exercise.sets,
        exercise.reps,
        exercise.weight ?? null,
        exercise.restSeconds ?? null,
        exercise.muscleGroup,
        index,
        exercise.isPersonalRecord ? 1 : 0,
        0,
        exercise.notes ?? null
      ]
    );
  }
}

export async function saveLoggedWorkout(workout: LoggedWorkoutEntry) {
  const database = await getDatabase();
  await database.runAsync("UPDATE workout_logs SET notes = ? WHERE id = ?", [
    workout.notes ?? null,
    workout.id
  ]);

  for (const exercise of workout.exercises) {
    await database.runAsync(
      `UPDATE logged_workout_exercises
       SET sets = ?,
           reps = ?,
           weight = ?,
           rest_seconds = ?,
           notes = ?,
           is_personal_record = ?,
           is_completed = ?
       WHERE id = ?`,
      [
        exercise.sets ?? null,
        exercise.reps ?? null,
        exercise.weight ?? null,
        exercise.restSeconds ?? null,
        exercise.notes ?? null,
        exercise.isPersonalRecord ? 1 : 0,
        exercise.isCompleted ? 1 : 0,
        exercise.id
      ]
    );
  }
}

export async function deleteLoggedWorkout(workoutLogId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM workout_logs WHERE id = ?", [workoutLogId]);
}

export async function saveCardioSession(input: Omit<CardioLogEntry, "id"> & { id?: string }) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("cardio");

  await database.runAsync(
    `INSERT INTO cardio_sessions (
      id,
      date,
      activity_type,
      duration_minutes,
      distance,
      pace,
      speed,
      calories_burned,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      activity_type = excluded.activity_type,
      duration_minutes = excluded.duration_minutes,
      distance = excluded.distance,
      pace = excluded.pace,
      speed = excluded.speed,
      calories_burned = excluded.calories_burned,
      notes = excluded.notes`,
    [
      id,
      input.date,
      input.activityType,
      input.durationMinutes,
      input.distance ?? null,
      input.pace ?? null,
      input.speed ?? null,
      input.caloriesBurned ?? null,
      input.notes ?? null
    ]
  );

  return id;
}

export async function deleteCardioSession(cardioSessionId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM cardio_sessions WHERE id = ?", [cardioSessionId]);
}

export async function saveDailyNote(date: string, note: string) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  if (!note.trim()) {
    await database.runAsync("DELETE FROM daily_notes WHERE date = ?", [date]);
    return;
  }

  const existing = await database.getFirstAsync<{ id: string }>(
    "SELECT id FROM daily_notes WHERE date = ? LIMIT 1",
    [date]
  );

  if (existing) {
    await database.runAsync("UPDATE daily_notes SET note = ?, updated_at = ? WHERE id = ?", [
      note.trim(),
      now,
      existing.id
    ]);
    return;
  }

  await database.runAsync(
    `INSERT INTO daily_notes (
      id,
      date,
      note,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?)`,
    [`daily-note-${date}`, date, note.trim(), now, now]
  );
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function getCountRows(tableName: string, dateExpression: string, startDate: string, endDate: string) {
  const database = await getDatabase();
  return database.getAllAsync<CountRow>(
    `SELECT ${dateExpression} AS date, COUNT(*) AS count
     FROM ${tableName}
     WHERE ${dateExpression} BETWEEN ? AND ?
     GROUP BY ${dateExpression}`,
    [startDate, endDate]
  );
}

function mapWorkoutLog(
  row: WorkoutLogRow,
  exercises: LoggedWorkoutExerciseEntry[]
): LoggedWorkoutEntry {
  return {
    id: row.id,
    date: row.started_at.slice(0, 10),
    routineName: row.routine_name ?? "Logged workout",
    notes: row.notes ?? undefined,
    exercises,
    createdAt: row.created_at
  };
}

function mapLoggedExercise(row: LoggedWorkoutExerciseRow): LoggedWorkoutExerciseEntry {
  return {
    id: row.id,
    workoutLogId: row.workout_log_id,
    exerciseName: row.exercise_name,
    muscleGroup: row.muscle_group ?? undefined,
    orderIndex: row.order_index ?? 0,
    sets: row.sets ?? undefined,
    reps: row.reps === null || typeof row.reps === "undefined" ? undefined : String(row.reps),
    weight: row.weight ?? undefined,
    restSeconds: row.rest_seconds ?? undefined,
    notes: row.notes ?? undefined,
    isPersonalRecord: row.is_personal_record === 1,
    isCompleted: row.is_completed === 1
  };
}

function mapCardioRow(row: CardioRow): CardioLogEntry {
  return {
    id: row.id,
    date: row.date,
    activityType: row.activity_type,
    durationMinutes: row.duration_minutes,
    distance: row.distance ?? undefined,
    pace: row.pace ?? undefined,
    speed: row.speed ?? undefined,
    caloriesBurned: row.calories_burned ?? undefined,
    notes: row.notes ?? undefined
  };
}

function mapMealRow(row: MealRow): MealLog {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    mealName: row.meal_name,
    mealCategory: row.meal_category ?? "Snack",
    calories: row.calories ?? undefined,
    proteinGrams: row.protein_grams ?? undefined,
    carbGrams: row.carb_grams ?? undefined,
    fatGrams: row.fat_grams ?? undefined,
    notes: row.notes ?? undefined
  };
}

function mapMacroRow(row: MacroRow): DailyMacroLog {
  return {
    id: row.id,
    date: row.date,
    calories: row.calories ?? undefined,
    proteinGrams: row.protein_grams ?? undefined,
    carbGrams: row.carb_grams ?? undefined,
    fatGrams: row.fat_grams ?? undefined,
    waterOunces: row.water_ounces ?? undefined
  };
}

function mapBodyWeightRow(row: BodyWeightRow): BodyWeightLogEntry {
  return {
    id: row.id,
    date: row.date,
    weight: row.weight,
    units: row.units,
    notes: row.notes ?? undefined
  };
}

function mapProgressPhotoRow(row: ProgressPhotoRow): ProgressPhoto {
  return {
    id: row.id,
    date: row.date,
    localUri: row.local_uri,
    angle: row.angle ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  };
}

function mapDailyNoteRow(row: DailyNoteRow): DailyNoteEntry {
  return {
    id: row.id,
    date: row.date,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
