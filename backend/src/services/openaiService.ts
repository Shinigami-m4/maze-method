import {
  MazeCoachRecommendation,
  MazeCoachRequest
} from "../types/mazeCoach.js";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

const recommendationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "caloriesTarget",
    "proteinTarget",
    "carbsTarget",
    "fatsTarget",
    "suggestedWorkout",
    "suggestedMeals",
    "recoveryAdvice",
    "explanation",
    "safetyNote"
  ],
  properties: {
    caloriesTarget: { type: "number" },
    proteinTarget: { type: "number" },
    carbsTarget: { type: "number" },
    fatsTarget: { type: "number" },
    suggestedWorkout: { type: "string" },
    suggestedMeals: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 5
    },
    recoveryAdvice: { type: "string" },
    explanation: { type: "string" },
    safetyNote: { type: "string" }
  }
} as const;

export async function createOpenAIMazeCoachRecommendation(
  request: MazeCoachRequest
): Promise<MazeCoachRecommendation> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the backend.");
  }

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are Maze Coach for the Maze Method fitness app. Provide concise, practical fitness and nutrition suggestions from the supplied user data. This is general fitness and nutrition guidance, not medical advice. Do not diagnose, treat medical conditions, or recommend extreme dieting. If data is incomplete, make conservative assumptions and say what data would improve the recommendation."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(request)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "maze_coach_recommendation",
          strict: true,
          schema: recommendationSchema
        }
      }
    })
  });

  const responseBody = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(getOpenAIErrorMessage(responseBody, response.status));
  }

  return normalizeRecommendation(parseStructuredOutput(responseBody));
}

export function buildFallbackRecommendation(
  request: MazeCoachRequest,
  reason = "Maze Coach is using a backend fallback because the AI service was unavailable."
): MazeCoachRecommendation {
  const goal = request.profile?.fitnessGoal ?? request.fitnessGoal ?? "build_muscle";
  const weight = request.profile?.weight;
  const daysPerWeek = request.profile?.daysPerWeek ?? 3;
  const caloriesTarget = estimateCalories(request);
  const proteinTarget = Math.round((typeof weight === "number" ? weight : 170) * 0.85);
  const fatsTarget = Math.round((caloriesTarget * 0.25) / 9);
  const carbsTarget = Math.round(Math.max(caloriesTarget - proteinTarget * 4 - fatsTarget * 9, 0) / 4);

  return {
    caloriesTarget,
    proteinTarget,
    carbsTarget,
    fatsTarget,
    suggestedWorkout:
      goal === "improve_endurance"
        ? "Complete a steady cardio session and a short core block."
        : `Complete a structured full-body lift and keep it within your ${daysPerWeek}-day weekly plan.`,
    suggestedMeals: [
      "Build each main meal around a lean protein source.",
      "Use a carb serving around training and keep fats measured.",
      "Add a simple high-protein snack if protein is behind target."
    ],
    recoveryAdvice:
      "Use sleep, hydration, easy steps, and mobility to support recovery before adding more volume.",
    explanation: `${reason} Targets use conservative profile-based estimates and recent app summaries when available.`,
    safetyNote:
      "Maze Coach provides general fitness and nutrition suggestions only and is not medical advice."
  };
}

function parseStructuredOutput(responseBody: unknown): unknown {
  if (!isRecord(responseBody)) {
    throw new Error("OpenAI returned an unreadable response.");
  }

  if (typeof responseBody.output_text === "string") {
    return JSON.parse(responseBody.output_text);
  }

  const output = Array.isArray(responseBody.output) ? responseBody.output : [];
  for (const item of output) {
    if (!isRecord(item) || !Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (isRecord(content) && content.type === "output_text" && typeof content.text === "string") {
        return JSON.parse(content.text);
      }
    }
  }

  throw new Error("OpenAI response did not include structured output text.");
}

function normalizeRecommendation(value: unknown): MazeCoachRecommendation {
  if (!isRecord(value)) {
    throw new Error("Maze Coach recommendation JSON was not an object.");
  }

  return {
    caloriesTarget: normalizeNumber(value.caloriesTarget, 2200),
    proteinTarget: normalizeNumber(value.proteinTarget, 160),
    carbsTarget: normalizeNumber(value.carbsTarget, 240),
    fatsTarget: normalizeNumber(value.fatsTarget, 70),
    suggestedWorkout: normalizeString(value.suggestedWorkout, "Complete a structured full-body workout."),
    suggestedMeals: normalizeStringArray(value.suggestedMeals, [
      "Protein-first meal with a balanced carb serving."
    ]),
    recoveryAdvice: normalizeString(value.recoveryAdvice, "Prioritize sleep, hydration, and easy movement."),
    explanation: normalizeString(
      value.explanation,
      "Recommendation generated from available profile and recent log data."
    ),
    safetyNote: normalizeString(
      value.safetyNote,
      "Maze Coach provides general fitness and nutrition suggestions only and is not medical advice."
    )
  };
}

function estimateCalories(request: MazeCoachRequest) {
  const profile = request.profile;
  const weight = typeof profile?.weight === "number" ? profile.weight : 170;
  const units = profile?.units ?? "imperial";
  const weightInPounds = units === "metric" ? weight * 2.20462 : weight;
  const base = Math.round(weightInPounds * 14);

  if (request.fitnessGoal === "lose_weight") {
    return Math.max(base - 350, 1400);
  }

  if (request.fitnessGoal === "build_muscle") {
    return base + 250;
  }

  return base;
}

function getOpenAIErrorMessage(responseBody: unknown, status: number) {
  if (isRecord(responseBody) && isRecord(responseBody.error) && typeof responseBody.error.message === "string") {
    return responseBody.error.message;
  }

  return `OpenAI request failed with status ${status}.`;
}

function normalizeNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback;
}

function normalizeString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return strings.length > 0 ? strings.map((item) => item.trim()) : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
