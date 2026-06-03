import { getDatabase } from "./client";
import { databaseSchema } from "./schema";

export async function initializeDatabase() {
  const database = await getDatabase();

  // Keep schema creation idempotent so the app can boot cleanly with no seed data.
  for (const statement of databaseSchema) {
    await database.execAsync(statement);
  }

  await runWorkoutMigrations();
  await runCloudSyncMigrations();
}

async function runWorkoutMigrations() {
  const database = await getDatabase();

  // These additive migrations protect existing local users while the portfolio project evolves.
  // They add columns only when missing and never seed demo rows.
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

async function runCloudSyncMigrations() {
  const database = await getDatabase();
  const cloudReadyTables = [
    "user_profiles",
    "workout_routines",
    "exercises",
    "routine_exercises",
    "exercise_resource_links",
    "workout_logs",
    "logged_workout_exercises",
    "meals",
    "daily_macro_logs",
    "body_weight_entries",
    "body_measurement_entries",
    "cardio_sessions",
    "progress_photos",
    "calendar_entries",
    "daily_notes",
    "personal_records"
  ];

  // These nullable sync fields keep Version 1 local records intact while making
  // every table ready for a future Supabase sync mapper.
  for (const tableName of cloudReadyTables) {
    await addColumnIfMissing(tableName, "local_id", "TEXT");
    await addColumnIfMissing(tableName, "remote_id", "TEXT");
    await addColumnIfMissing(tableName, "user_id", "TEXT");
    await addColumnIfMissing(tableName, "created_at", "TEXT");
    await addColumnIfMissing(tableName, "updated_at", "TEXT");
    await addColumnIfMissing(tableName, "deleted_at", "TEXT");

    await database.execAsync(
      `UPDATE ${tableName}
       SET
         local_id = COALESCE(local_id, id),
         created_at = COALESCE(created_at, datetime('now')),
         updated_at = COALESCE(updated_at, created_at, datetime('now'))
       WHERE local_id IS NULL OR created_at IS NULL OR updated_at IS NULL;`
    );

    await database.execAsync(
      `CREATE TRIGGER IF NOT EXISTS ${tableName}_sync_insert_defaults
       AFTER INSERT ON ${tableName}
       FOR EACH ROW
       BEGIN
         UPDATE ${tableName}
         SET
           local_id = COALESCE(local_id, NEW.id),
           created_at = COALESCE(created_at, datetime('now')),
           updated_at = COALESCE(updated_at, created_at, datetime('now'))
         WHERE id = NEW.id;
       END;`
    );

    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS ${tableName}_remote_id_idx ON ${tableName} (remote_id);`
    );
    await database.execAsync(
      `CREATE INDEX IF NOT EXISTS ${tableName}_user_id_idx ON ${tableName} (user_id);`
    );
  }
}

async function addColumnIfMissing(tableName: string, columnName: string, columnDefinition: string) {
  const database = await getDatabase();
  const columns = await database.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await database.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition};`);
  }
}
