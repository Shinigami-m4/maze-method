import type { SyncTableConfig } from "./syncService";

const toBoolean = (value: unknown) => Boolean(value);
const fromBoolean = (value: unknown) => (value ? 1 : 0);
const parseJsonArray = (value: unknown) => {
  if (typeof value !== "string") {
    return Array.isArray(value) ? value : [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const stringifyJson = (value: unknown) => JSON.stringify(value ?? []);

export const workoutSyncTables: SyncTableConfig[] = [
  {
    localTable: "workout_routines",
    remoteTable: "workout_routines",
    columns: [
      { local: "name" },
      { local: "notes" },
      {
        local: "muscle_groups_json",
        remote: "muscle_groups",
        toRemote: parseJsonArray,
        toLocal: stringifyJson
      },
      { local: "is_active", toRemote: toBoolean, toLocal: fromBoolean },
      { local: "target_days_per_week" }
    ]
  },
  {
    localTable: "exercises",
    remoteTable: "exercises",
    columns: [
      { local: "name" },
      { local: "muscle_group" },
      { local: "equipment" },
      { local: "default_sets" },
      { local: "default_reps" },
      { local: "instructions" },
      { local: "custom_notes" },
      {
        local: "resource_links_json",
        remote: "resource_links",
        toRemote: parseJsonArray,
        toLocal: stringifyJson
      },
      { local: "is_custom", toRemote: toBoolean, toLocal: fromBoolean },
      { local: "is_active", toRemote: toBoolean, toLocal: fromBoolean }
    ]
  },
  {
    localTable: "routine_exercises",
    remoteTable: "routine_exercises",
    columns: [
      { local: "routine_id", remote: "routine_local_id" },
      { local: "exercise_id", remote: "exercise_local_id" },
      { local: "exercise_name" },
      { local: "muscle_group" },
      { local: "equipment" },
      { local: "order_index" },
      { local: "sets" },
      { local: "reps" },
      { local: "weight" },
      { local: "rest_seconds" },
      { local: "notes" },
      { local: "is_personal_record", toRemote: toBoolean, toLocal: fromBoolean },
      { local: "is_completed", toRemote: toBoolean, toLocal: fromBoolean }
    ]
  },
  {
    localTable: "exercise_resource_links",
    remoteTable: "exercise_resource_links",
    columns: [
      { local: "exercise_id", remote: "exercise_local_id" },
      { local: "url" },
      { local: "label" },
      { local: "notes" }
    ]
  },
  {
    localTable: "workout_logs",
    remoteTable: "workout_logs",
    columns: [
      { local: "routine_id", remote: "routine_local_id" },
      { local: "routine_name" },
      { local: "started_at" },
      { local: "ended_at" },
      { local: "notes" }
    ]
  },
  {
    localTable: "logged_workout_exercises",
    remoteTable: "workout_log_exercises",
    columns: [
      { local: "workout_log_id", remote: "workout_log_local_id" },
      { local: "exercise_id", remote: "exercise_local_id" },
      { local: "exercise_name" },
      { local: "sets" },
      { local: "reps" },
      { local: "weight" },
      { local: "rest_seconds" },
      { local: "duration_seconds" },
      { local: "distance" },
      { local: "muscle_group" },
      { local: "order_index" },
      { local: "is_personal_record", toRemote: toBoolean, toLocal: fromBoolean },
      { local: "is_completed", toRemote: toBoolean, toLocal: fromBoolean },
      { local: "notes" }
    ]
  }
];

