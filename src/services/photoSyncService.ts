import { SupabaseClient } from "@supabase/supabase-js";

import { getDatabase } from "../database/client";

const PROGRESS_PHOTO_BUCKET = "progress-photos";

type PendingPhotoRow = {
  id: string;
  local_id: string | null;
  local_uri: string;
  remote_storage_path: string | null;
};

export type PhotoUploadResult = {
  uploaded: number;
  errors: Array<{ localId: string; message: string }>;
};

export async function uploadPendingProgressPhotos(
  client: SupabaseClient,
  userId: string
): Promise<PhotoUploadResult> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<PendingPhotoRow>(
    `SELECT id, local_id, local_uri, remote_storage_path
     FROM progress_photos
     WHERE local_uri IS NOT NULL
       AND local_uri != ''
       AND (remote_storage_path IS NULL OR remote_storage_path = '')
       AND deleted_at IS NULL`
  );
  const result: PhotoUploadResult = { uploaded: 0, errors: [] };

  for (const row of rows) {
    const localId = row.local_id ?? row.id;

    try {
      // Photo sync uploads the local file first, then the metadata sync stores the
      // storage path. The local URI stays in SQLite so offline viewing can still work.
      const response = await fetch(row.local_uri);
      const blob = await response.blob();
      const storagePath = `${userId}/${localId}.jpg`;
      const { error } = await client.storage
        .from(PROGRESS_PHOTO_BUCKET)
        .upload(storagePath, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true
        });

      if (error) {
        throw error;
      }

      await database.runAsync(
        `UPDATE progress_photos
         SET remote_storage_path = ?, sync_status = 'pending'
         WHERE id = ?`,
        [storagePath, row.id]
      );
      result.uploaded += 1;
    } catch (error) {
      result.errors.push({
        localId,
        message: error instanceof Error ? error.message : "Progress photo upload failed."
      });
      await database.runAsync(
        "UPDATE progress_photos SET sync_status = 'failed' WHERE id = ?",
        [row.id]
      );
    }
  }

  return result;
}

