import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupabaseClient } from "@supabase/supabase-js";

import { getDatabase } from "../database/client";
import { storageKeys } from "../storage/keys";
import { getSupabaseClient } from "./supabaseClient";
import { nutritionSyncTables } from "./nutritionSyncService";
import { uploadPendingProgressPhotos } from "./photoSyncService";
import { progressSyncTables } from "./progressSyncService";
import { workoutSyncTables } from "./workoutSyncService";

export type SyncColumn = {
  local: string;
  remote?: string;
  toRemote?: (value: unknown, row: LocalSyncRow) => unknown;
  toLocal?: (value: unknown, row: RemoteSyncRow) => unknown;
};

export type SyncTableConfig = {
  localTable: string;
  remoteTable: string;
  columns: SyncColumn[];
};

export type SyncError = {
  table: string;
  localId?: string;
  message: string;
};

export type SyncTableSummary = {
  table: string;
  pushed: number;
  pulled: number;
  skipped: number;
  failed: number;
};

export type CloudSyncState = {
  firstBackupPromptedAt?: string;
  firstBackupCompletedAt?: string;
  lastSyncedAt?: string;
  errors: SyncError[];
};

export type SyncRunResult = {
  startedAt: string;
  finishedAt: string;
  success: boolean;
  summaries: SyncTableSummary[];
  errors: SyncError[];
};

type LocalSyncRow = Record<string, unknown> & {
  id: string;
  local_id?: string | null;
  remote_id?: string | null;
  user_id?: string | null;
  sync_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
};

type RemoteSyncRow = Record<string, unknown> & {
  id?: string;
  local_id?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

const metadataColumns = [
  "id",
  "local_id",
  "remote_id",
  "user_id",
  "sync_status",
  "created_at",
  "updated_at",
  "deleted_at"
];

const profileSyncTables: SyncTableConfig[] = [
  {
    localTable: "user_profiles",
    remoteTable: "profiles",
    columns: [
      { local: "name" },
      { local: "age" },
      { local: "gender" },
      { local: "height" },
      { local: "weight" },
      { local: "goal_weight" },
      { local: "units" },
      { local: "fitness_goal" },
      { local: "experience_level" },
      { local: "training_location" },
      { local: "days_per_week" },
      { local: "dietary_preference" },
      { local: "activity_level" },
      { local: "maze_coach_tone" }
    ]
  }
];

export async function getCloudSyncState(): Promise<CloudSyncState> {
  try {
    const rawValue = await AsyncStorage.getItem(storageKeys.cloudSyncState);
    if (!rawValue) {
      return { errors: [] };
    }

    const parsed = JSON.parse(rawValue) as CloudSyncState;
    return {
      ...parsed,
      errors: Array.isArray(parsed.errors) ? parsed.errors : []
    };
  } catch {
    return { errors: [] };
  }
}

export async function markFirstBackupPrompted() {
  const state = await getCloudSyncState();
  await saveCloudSyncState({
    ...state,
    firstBackupPromptedAt: state.firstBackupPromptedAt ?? new Date().toISOString()
  });
}

export async function runCloudSync({ isFirstBackup = false } = {}): Promise<SyncRunResult> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { user },
    error
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error(error?.message ?? "Sign in before syncing cloud data.");
  }

  const startedAt = new Date().toISOString();
  const allErrors: SyncError[] = [];
  const summaries: SyncTableSummary[] = [];

  // Sync order is deliberate: upload photo files first, then push metadata; push
  // local SQLite data before pulling remote data so first backup never deletes or
  // overwrites existing phone records.
  const photoResult = await uploadPendingProgressPhotos(client, user.id);
  allErrors.push(
    ...photoResult.errors.map((item) => ({
      table: "progress_photos",
      localId: item.localId,
      message: item.message
    }))
  );

  const tableGroups = [
    profileSyncTables,
    workoutSyncTables,
    nutritionSyncTables,
    progressSyncTables
  ];

  for (const tableGroup of tableGroups) {
    for (const tableConfig of tableGroup) {
      const summary = await syncTable(client, user.id, tableConfig, allErrors);
      summaries.push(summary);
    }
  }

  const finishedAt = new Date().toISOString();
  const success = allErrors.length === 0;
  const previousState = await getCloudSyncState();
  await saveCloudSyncState({
    ...previousState,
    errors: allErrors,
    firstBackupCompletedAt:
      isFirstBackup && success
        ? finishedAt
        : previousState.firstBackupCompletedAt,
    lastSyncedAt: success ? finishedAt : previousState.lastSyncedAt
  });

  return {
    startedAt,
    finishedAt,
    success,
    summaries,
    errors: allErrors
  };
}

async function syncTable(
  client: SupabaseClient,
  userId: string,
  config: SyncTableConfig,
  errors: SyncError[]
): Promise<SyncTableSummary> {
  const summary: SyncTableSummary = {
    table: config.remoteTable,
    pushed: 0,
    pulled: 0,
    skipped: 0,
    failed: 0
  };

  try {
    const pushSummary = await pushLocalRows(client, userId, config, errors);
    summary.pushed += pushSummary.pushed;
    summary.failed += pushSummary.failed;

    const pullSummary = await pullRemoteRows(client, userId, config, errors);
    summary.pulled += pullSummary.pulled;
    summary.skipped += pullSummary.skipped;
    summary.failed += pullSummary.failed;
  } catch (error) {
    summary.failed += 1;
    errors.push({
      table: config.remoteTable,
      message: error instanceof Error ? error.message : "Sync table failed."
    });
  }

  return summary;
}

async function pushLocalRows(
  client: SupabaseClient,
  userId: string,
  config: SyncTableConfig,
  errors: SyncError[]
) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<LocalSyncRow>(
    `SELECT ${getLocalSelectColumns(config)}
     FROM ${quoteIdentifier(config.localTable)}
     WHERE sync_status != 'synced'
       OR remote_id IS NULL
       OR user_id IS NULL
       OR user_id != ?`,
    [userId]
  );
  const summary = { pushed: 0, failed: 0 };

  for (const row of rows) {
    const localId = String(row.local_id ?? row.id);
    const payload = buildRemotePayload(config, row, userId, localId);
    const { data, error } = await client
      .from(config.remoteTable)
      .upsert(payload, { onConflict: "user_id,local_id" })
      .select("id,updated_at")
      .single();

    if (error || !data?.id) {
      summary.failed += 1;
      errors.push({
        table: config.remoteTable,
        localId,
        message: error?.message ?? "Remote upsert returned no id."
      });
      await updateSyncStatus(config.localTable, row.id, "failed", userId);
      continue;
    }

    await markLocalRecordSynced(config.localTable, row.id, String(data.id), userId, data.updated_at);
    summary.pushed += 1;
  }

  return summary;
}

async function pullRemoteRows(
  client: SupabaseClient,
  userId: string,
  config: SyncTableConfig,
  errors: SyncError[]
) {
  const { data, error } = await client
    .from(config.remoteTable)
    .select("*")
    .eq("user_id", userId);

  const summary = { pulled: 0, skipped: 0, failed: 0 };

  if (error) {
    errors.push({ table: config.remoteTable, message: error.message });
    return { ...summary, failed: 1 };
  }

  for (const remoteRow of (data ?? []) as RemoteSyncRow[]) {
    const localId = remoteRow.local_id ?? remoteRow.id;
    if (!localId || !remoteRow.id) {
      summary.skipped += 1;
      continue;
    }

    try {
      const result = await upsertRemoteRowLocally(config, remoteRow, String(localId), String(remoteRow.id), userId);
      summary[result] += 1;
    } catch (syncError) {
      summary.failed += 1;
      errors.push({
        table: config.remoteTable,
        localId: String(localId),
        message: syncError instanceof Error ? syncError.message : "Remote pull failed."
      });
    }
  }

  return summary;
}

async function upsertRemoteRowLocally(
  config: SyncTableConfig,
  remoteRow: RemoteSyncRow,
  localId: string,
  remoteId: string,
  userId: string
): Promise<"pulled" | "skipped"> {
  const database = await getDatabase();
  const existingRow = await database.getFirstAsync<LocalSyncRow>(
    `SELECT ${getLocalSelectColumns(config)}
     FROM ${quoteIdentifier(config.localTable)}
     WHERE local_id = ? OR remote_id = ?
     LIMIT 1`,
    [localId, remoteId]
  );

  if (existingRow && shouldKeepLocalRecord(existingRow, remoteRow)) {
    return "skipped";
  }

  const localValues = buildLocalValues(config, remoteRow, localId, remoteId, userId);
  const localColumns = Object.keys(localValues);

  if (existingRow) {
    await database.runAsync(
      `UPDATE ${quoteIdentifier(config.localTable)}
       SET sync_status = 'syncing'
       WHERE id = ?`,
      [existingRow.id]
    );
    await database.runAsync(
      `UPDATE ${quoteIdentifier(config.localTable)}
       SET ${localColumns.map((column) => `${quoteIdentifier(column)} = ?`).join(", ")}
       WHERE id = ?`,
      [...localColumns.map((column) => toSQLiteBindValue(localValues[column])), existingRow.id]
    );
    return "pulled";
  }

  await database.runAsync(
    `INSERT INTO ${quoteIdentifier(config.localTable)}
     (${localColumns.map(quoteIdentifier).join(", ")})
     VALUES (${localColumns.map(() => "?").join(", ")})`,
    localColumns.map((column) => toSQLiteBindValue(localValues[column]))
  );
  return "pulled";
}

function buildRemotePayload(
  config: SyncTableConfig,
  row: LocalSyncRow,
  userId: string,
  localId: string
) {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: userId,
    local_id: localId,
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? now,
    deleted_at: row.deleted_at ?? null
  };

  if (row.remote_id) {
    payload.id = row.remote_id;
  }

  for (const column of config.columns) {
    const remoteName = column.remote ?? column.local;
    const rawValue = row[column.local];
    payload[remoteName] = normalizeForRemote(
      column.toRemote ? column.toRemote(rawValue, row) : rawValue
    );
  }

  return payload;
}

function buildLocalValues(
  config: SyncTableConfig,
  row: RemoteSyncRow,
  localId: string,
  remoteId: string,
  userId: string
) {
  const now = new Date().toISOString();
  const values: Record<string, unknown> = {
    id: localId,
    local_id: localId,
    remote_id: remoteId,
    user_id: userId,
    sync_status: "synced",
    created_at: row.created_at ?? now,
    updated_at: row.updated_at ?? row.created_at ?? now,
    deleted_at: row.deleted_at ?? null
  };

  for (const column of config.columns) {
    const remoteName = column.remote ?? column.local;
    const rawValue = row[remoteName];
    values[column.local] = column.toLocal ? column.toLocal(rawValue, row) : rawValue ?? null;
  }

  return values;
}

function shouldKeepLocalRecord(localRow: LocalSyncRow, remoteRow: RemoteSyncRow) {
  const localUpdatedAt = Date.parse(localRow.updated_at ?? "");
  const remoteUpdatedAt = Date.parse(remoteRow.updated_at ?? "");
  const hasUnpushedLocalWork = localRow.sync_status !== "synced";

  // Conflict handling is intentionally simple for Version 2B: if local data has
  // newer unpushed edits, keep it and let the next push win. Otherwise apply the
  // remote record so signed-in devices can receive cloud changes.
  return hasUnpushedLocalWork && Number.isFinite(localUpdatedAt) && localUpdatedAt >= remoteUpdatedAt;
}

async function markLocalRecordSynced(
  tableName: string,
  localRowId: string,
  remoteId: string,
  userId: string,
  remoteUpdatedAt?: string
) {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE ${quoteIdentifier(tableName)}
     SET remote_id = ?,
         user_id = ?,
         sync_status = 'synced',
         updated_at = COALESCE(?, updated_at)
     WHERE id = ?`,
    [remoteId, userId, remoteUpdatedAt ?? null, localRowId]
  );
}

async function updateSyncStatus(
  tableName: string,
  localRowId: string,
  syncStatus: "pending" | "synced" | "failed",
  userId: string
) {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE ${quoteIdentifier(tableName)}
     SET sync_status = ?,
         user_id = ?
     WHERE id = ?`,
    [syncStatus, userId, localRowId]
  );
}

function getLocalSelectColumns(config: SyncTableConfig) {
  const columns = new Set([...metadataColumns, ...config.columns.map((column) => column.local)]);
  return Array.from(columns).map(quoteIdentifier).join(", ");
}

function normalizeForRemote(value: unknown) {
  return value === undefined ? null : value;
}

function toSQLiteBindValue(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  return JSON.stringify(value);
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function saveCloudSyncState(state: CloudSyncState) {
  await AsyncStorage.setItem(storageKeys.cloudSyncState, JSON.stringify(state));
}
