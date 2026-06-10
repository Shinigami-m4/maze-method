import type {
  MazeCoachRecommendation,
  MazeCoachRecommendationSource
} from "../services/mazeCoachService";
import { MazeCoachTone } from "../types/models";
import { createLocalId } from "../utils/id";
import { getDatabase } from "./client";

type MazeCoachHistoryRow = {
  id: string;
  source: MazeCoachRecommendationSource;
  tone: MazeCoachTone | null;
  prompt_context_json: string | null;
  recommendation_json: string;
  error_message: string | null;
  created_at: string;
};

export type MazeCoachHistoryEntry = {
  id: string;
  source: MazeCoachRecommendationSource;
  tone?: MazeCoachTone;
  promptContext?: unknown;
  recommendation: MazeCoachRecommendation;
  errorMessage?: string;
  createdAt: string;
};

export async function saveMazeCoachHistory(input: {
  source: MazeCoachRecommendationSource;
  tone: MazeCoachTone;
  promptContext: unknown;
  recommendation: MazeCoachRecommendation;
  errorMessage?: string;
}) {
  const database = await getDatabase();
  const id = createLocalId("maze-coach");
  const now = new Date().toISOString();

  // Store prompt context and response as JSON so the schema can evolve while
  // keeping each recommendation replayable for future cloud sync/history screens.
  await database.runAsync(
    `INSERT INTO maze_coach_history (
      id,
      local_id,
      source,
      tone,
      prompt_context_json,
      recommendation_json,
      error_message,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      id,
      input.source,
      input.tone,
      JSON.stringify(input.promptContext),
      JSON.stringify(input.recommendation),
      input.errorMessage ?? null,
      now,
      now
    ]
  );

  return id;
}

export async function getRecentMazeCoachHistory(limit = 10): Promise<MazeCoachHistoryEntry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<MazeCoachHistoryRow>(
    "SELECT * FROM maze_coach_history ORDER BY created_at DESC LIMIT ?",
    [limit]
  );

  return rows.map(mapHistoryRow);
}

function mapHistoryRow(row: MazeCoachHistoryRow): MazeCoachHistoryEntry {
  return {
    id: row.id,
    source: row.source,
    tone: row.tone ?? undefined,
    promptContext: parseJson(row.prompt_context_json),
    recommendation: parseJson(row.recommendation_json) as MazeCoachRecommendation,
    errorMessage: row.error_message ?? undefined,
    createdAt: row.created_at
  };
}

function parseJson(value: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}
