import { IncomingMessage, ServerResponse } from "node:http";

import {
  buildFallbackRecommendation,
  createOpenAIMazeCoachRecommendation
} from "../services/openaiService.js";
import {
  MazeCoachProfile,
  MazeCoachRequest,
  MazeCoachTone
} from "../types/mazeCoach.js";

const MAX_BODY_BYTES = 64 * 1024;

export async function handleMazeCoachRoute(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Use POST for Maze Coach recommendations." });
    return;
  }

  try {
    const payload = await readJsonBody(req);
    const request = normalizeMazeCoachRequest(payload);

    // Production rate limiting belongs here, keyed by authenticated user ID or IP.
    // For the portfolio version this is a deliberate placeholder so the endpoint shape stays clear.
    try {
      const recommendation = await createOpenAIMazeCoachRecommendation(request);
      writeJson(res, 200, { source: "openai", recommendation });
    } catch (error) {
      writeJson(res, 200, {
        source: "backend_fallback",
        error: error instanceof Error ? error.message : "Maze Coach AI request failed.",
        recommendation: buildFallbackRecommendation(request)
      });
    }
  } catch (error) {
    writeJson(res, 400, {
      error: error instanceof Error ? error.message : "Invalid Maze Coach request."
    });
  }
}

function normalizeMazeCoachRequest(value: unknown): MazeCoachRequest {
  const body = isRecord(value) ? value : {};
  const profile = normalizeProfile(body.profile);
  const fitnessGoal = normalizeString(body.fitnessGoal, profile?.fitnessGoal ?? "build_muscle");

  return {
    profile,
    fitnessGoal,
    recentWorkoutLogs: normalizeArray(body.recentWorkoutLogs),
    recentNutritionLogs: normalizeArray(body.recentNutritionLogs),
    recentWeightTrend: isRecord(body.recentWeightTrend) ? body.recentWeightTrend : {},
    cardioHistorySummary: isRecord(body.cardioHistorySummary) ? body.cardioHistorySummary : {},
    preferredMazeCoachTone: normalizeTone(body.preferredMazeCoachTone ?? body.preferredTone)
  };
}

function normalizeProfile(value: unknown): MazeCoachProfile | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    name: normalizeOptionalString(value.name),
    age: normalizeOptionalNumber(value.age),
    gender: normalizeOptionalString(value.gender),
    height: normalizeOptionalNumber(value.height),
    weight: normalizeOptionalNumber(value.weight),
    goalWeight: normalizeOptionalNumber(value.goalWeight),
    units: value.units === "metric" ? "metric" : "imperial",
    fitnessGoal: normalizeOptionalString(value.fitnessGoal),
    activityLevel: normalizeOptionalString(value.activityLevel),
    daysPerWeek: normalizeOptionalNumber(value.daysPerWeek),
    dietaryPreference: normalizeOptionalString(value.dietaryPreference),
    experienceLevel: normalizeOptionalString(value.experienceLevel),
    trainingLocation: normalizeOptionalString(value.trainingLocation)
  };
}

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf8");

      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("Maze Coach request body is too large."));
      }
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Maze Coach request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });
}

function writeJson(res: ServerResponse, statusCode: number, value: unknown) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}

function normalizeTone(value: unknown): MazeCoachTone {
  if (
    value === "friendly_beginner" ||
    value === "serious_gym" ||
    value === "professional_trainer" ||
    value === "motivational_not_corny"
  ) {
    return value;
  }

  return "motivational_not_corny";
}

function normalizeArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
