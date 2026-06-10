import type { SyncTableConfig } from "./syncService";

export const progressSyncTables: SyncTableConfig[] = [
  {
    localTable: "body_weight_entries",
    remoteTable: "body_weight_entries",
    columns: [
      { local: "date" },
      { local: "weight" },
      { local: "units" },
      { local: "notes" }
    ]
  },
  {
    localTable: "body_measurement_entries",
    remoteTable: "body_measurements",
    columns: [
      { local: "date" },
      { local: "measurement_type" },
      { local: "value" },
      { local: "units" },
      { local: "notes" }
    ]
  },
  {
    localTable: "cardio_sessions",
    remoteTable: "cardio_sessions",
    columns: [
      { local: "date" },
      { local: "activity_type" },
      { local: "duration_minutes" },
      { local: "distance" },
      { local: "pace" },
      { local: "speed" },
      { local: "calories_burned" },
      { local: "notes" }
    ]
  },
  {
    localTable: "progress_photos",
    remoteTable: "progress_photos",
    columns: [
      { local: "date" },
      { local: "local_uri", toLocal: (value) => value ?? "" },
      { local: "remote_storage_path", remote: "storage_path" },
      { local: "angle" },
      { local: "notes" }
    ]
  },
  {
    localTable: "calendar_entries",
    remoteTable: "calendar_entries",
    columns: [
      { local: "date" },
      { local: "entry_type" },
      { local: "title" },
      { local: "related_id", remote: "related_local_id" },
      { local: "notes" }
    ]
  },
  {
    localTable: "daily_notes",
    remoteTable: "daily_notes",
    columns: [
      { local: "date" },
      { local: "note" }
    ]
  },
  {
    localTable: "personal_records",
    remoteTable: "personal_records",
    columns: [
      { local: "exercise_id", remote: "exercise_local_id" },
      { local: "exercise_name" },
      { local: "record_type" },
      { local: "value" },
      { local: "units" },
      { local: "achieved_at" },
      { local: "notes" }
    ]
  }
];

