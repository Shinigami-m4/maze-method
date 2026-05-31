import { getDatabase } from "./client";
import { databaseSchema } from "./schema";

export async function initializeDatabase() {
  const database = await getDatabase();

  // Keep schema creation idempotent so the app can boot cleanly with no seed data.
  for (const statement of databaseSchema) {
    await database.execAsync(statement);
  }

  await runWorkoutMigrations();
}

async function runWorkoutMigrations() {
  const database = await getDatabase();

  await addColumnIfMissing("workout_routines", "muscle_groups_json", "TEXT NOT NULL DEFAULT '[]'");
  await addColumnIfMissing("workout_routines", "is_active", "INTEGER NOT NULL DEFAULT 1");

  await addColumnIfMissing("exercises", "default_sets", "INTEGER");
  await addColumnIfMissing("exercises", "default_reps", "TEXT");
  await addColumnIfMissing("exercises", "instructions", "TEXT");
  await addColumnIfMissing("exercises", "is_custom", "INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing("exercises", "is_active", "INTEGER NOT NULL DEFAULT 1");

  await addColumnIfMissing("workout_logs", "routine_name", "TEXT");

  await addColumnIfMissing("logged_workout_exercises", "rest_seconds", "INTEGER");
  await addColumnIfMissing("logged_workout_exercises", "muscle_group", "TEXT");
  await addColumnIfMissing("logged_workout_exercises", "order_index", "INTEGER");
  await addColumnIfMissing("logged_workout_exercises", "is_personal_record", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("logged_workout_exercises", "is_completed", "INTEGER NOT NULL DEFAULT 0");

  await addColumnIfMissing("cardio_sessions", "pace", "TEXT");
  await addColumnIfMissing("cardio_sessions", "speed", "REAL");

  await addColumnIfMissing("meals", "meal_category", "TEXT NOT NULL DEFAULT 'Snack'");

  // Touch the database so the async function owns all schema preparation before the UI renders.
  await database.execAsync("PRAGMA foreign_keys = ON;");
}

async function addColumnIfMissing(tableName: string, columnName: string, columnDefinition: string) {
  const database = await getDatabase();
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
  }
}
