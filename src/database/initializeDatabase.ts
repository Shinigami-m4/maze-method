import { getDatabase } from "./client";
import { databaseSchema } from "./schema";

export async function initializeDatabase() {
  const database = await getDatabase();

  // Keep schema creation idempotent so the app can boot cleanly with no seed data.
  for (const statement of databaseSchema) {
    await database.execAsync(statement);
  }
}
