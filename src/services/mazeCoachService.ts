import { getUserProfile } from "../database/profileRepository";
import { getDatabase } from "../database/client";
import { saveMazeCoachHistory } from "../database/mazeCoachRepository";
import { getMazeCoachTone } from "../storage/settingsStorage";
import { calculateNutritionTargets } from "./nutrition/nutritionTargets";
import {
  isMazeCoachBackendConfigured,
  MazeCoachApiRecommendation,
  MazeCoachApiRequest,
  requestBackendMazeCoachRecommendation
} from "./mazeCoachApi";
import { DailyMacroLog, FitnessGoal, MazeCoachTone, UserProfile } from "../types/models";
import { MacroTotals, NutritionTargets } from "../types/nutrition";
import {
  formatActivityLevel,
  formatFitnessGoal,
  formatMazeCoachTone,
  formatTrainingLocation
} from "../utils/labels";

export type MazeCoachRecommendationSource =
  | "backend"
  | "backend_fallback"
  | "local_mock"
  | "local_fallback";

export type MazeCoachRecommendation = {
  headline: string;
  dailyCalories: number;
  dailyProtein: number;
  carbsTarget: number;
  fatTarget: number;
  suggestedWorkout: string;
  suggestedMeals: string[];
  recoveryAdvice: string;
  explanation: string;
  insights: string[];
  toneLabel: string;
  generatedAt: string;
  source: MazeCoachRecommendationSource;
  safetyNote?: string;
  errorMessage?: string;
};

type MazeCoachRecommendationOptions = {
  saveToHistory?: boolean;
};

type RecentWorkoutSummary = {
  workoutCount: number;
  completedExerciseCount: number;
  lastWorkoutDate?: string;
  topMuscleGroups: string[];
};

type RecentNutritionSummary = {
  loggedDayCount: number;
  averageCalories: number;
  averageProtein: number;
  lastLoggedDate?: string;
};

type RecentWeightTrendSummary = {
  entryCount: number;
  firstWeight?: number;
  latestWeight?: number;
  change?: number;
  units?: string;
  direction: "up" | "down" | "stable" | "unknown";
};

type CardioHistorySummary = {
  sessionCount: number;
  totalMinutes: number;
  totalDistance: number;
  lastCardioDate?: string;
  topCardioType?: string;
};

type MazeCoachContext = {
  profile: UserProfile | null;
  tone: MazeCoachTone;
  targets: NutritionTargets;
  recentWorkouts: RecentWorkoutSummary;
  recentNutrition: RecentNutritionSummary;
  recentWeightTrend: RecentWeightTrendSummary;
  cardioHistorySummary: CardioHistorySummary;
};

type WorkoutSummaryRow = {
  workout_count: number | null;
  last_workout_date: string | null;
};

type CompletedExerciseRow = {
  completed_count: number | null;
};

type MuscleGroupRow = {
  muscle_group: string | null;
  count: number;
};

type MealMacroRow = {
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
};

type MacroLogRow = {
  id: string;
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  water_ounces: number | null;
};

type WeightTrendRow = {
  date: string;
  weight: number;
  units: string;
};

type CardioSummaryRow = {
  session_count: number | null;
  total_minutes: number | null;
  total_distance: number | null;
  last_cardio_date: string | null;
};

type CardioTypeRow = {
  activity_type: string | null;
  count: number;
};

export async function getMazeCoachRecommendation(
  options: MazeCoachRecommendationOptions = {}
): Promise<MazeCoachRecommendation> {
  const context = await getMazeCoachContext();
  const backendRequest = buildBackendRequest(context);

  if (isMazeCoachBackendConfigured) {
    try {
      const backendResult = await requestBackendMazeCoachRecommendation(backendRequest);
      const recommendation = mapBackendRecommendation(
        backendResult.recommendation,
        context,
        backendResult.source,
        backendResult.error
      );
      await saveRecommendationIfNeeded(options, context, backendRequest, recommendation);
      return recommendation;
    } catch (error) {
      // Backend failures should never block local logging or Maze Coach usage.
      const recommendation = {
        ...buildLocalRecommendation(context),
        source: "local_fallback" as const,
        errorMessage: getErrorMessage(error)
      };
      await saveRecommendationIfNeeded(options, context, backendRequest, recommendation);
      return recommendation;
    }
  }

  const recommendation = {
    ...buildLocalRecommendation(context),
    source: "local_mock" as const
  };
  await saveRecommendationIfNeeded(options, context, backendRequest, recommendation);
  return recommendation;
}

async function getMazeCoachContext(): Promise<MazeCoachContext> {
  // The coach reads the same local profile and logs that power the app, keeping
  // Maze Method usable offline even when the backend is not configured.
  const [
    profile,
    storedTone,
    recentWorkouts,
    recentNutrition,
    recentWeightTrend,
    cardioHistorySummary
  ] = await Promise.all([
    getUserProfile(),
    getMazeCoachTone(),
    getRecentWorkoutSummary(),
    getRecentNutritionSummary(),
    getRecentWeightTrendSummary(),
    getCardioHistorySummary()
  ]);
  const tone = profile?.mazeCoachTone ?? storedTone;
  const targets = calculateNutritionTargets(profile);

  return {
    profile,
    tone,
    targets,
    recentWorkouts,
    recentNutrition,
    recentWeightTrend,
    cardioHistorySummary
  };
}

function buildLocalRecommendation({
  profile,
  tone,
  targets,
  recentWorkouts,
  recentNutrition
}: MazeCoachContext): Omit<MazeCoachRecommendation, "source"> {
  const goal = profile?.fitnessGoal ?? "build_muscle";
  const trainingDays = profile?.daysPerWeek ?? 3;
  const toneLabel = formatMazeCoachTone(tone);
  const suggestedWorkout = getSuggestedWorkout(goal, profile, recentWorkouts);
  const recoveryAdvice = getRecoveryAdvice(trainingDays, recentWorkouts, tone);
  const suggestedMeals = getSuggestedMeals(goal, targets, profile?.dietaryPreference);
  const adherenceGap = targets.calories - recentNutrition.averageCalories;

  return {
    headline: getToneHeadline(tone, goal, recentWorkouts, recentNutrition),
    dailyCalories: targets.calories,
    dailyProtein: targets.proteinGrams,
    carbsTarget: targets.carbGrams,
    fatTarget: targets.fatGrams,
    suggestedWorkout,
    suggestedMeals,
    recoveryAdvice,
    explanation: getExplanation(profile, targets, recentWorkouts, recentNutrition, adherenceGap),
    insights: getInsights(profile, recentWorkouts, recentNutrition, adherenceGap),
    toneLabel,
    generatedAt: new Date().toISOString(),
    safetyNote: "Maze Coach provides general fitness and nutrition suggestions only and is not medical advice."
  };
}

function buildBackendRequest(context: MazeCoachContext): MazeCoachApiRequest {
  const { profile } = context;

  return {
    profile: profile
      ? {
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
          goalWeight: profile.goalWeight,
          units: profile.units,
          fitnessGoal: profile.fitnessGoal,
          activityLevel: profile.activityLevel,
          daysPerWeek: profile.daysPerWeek,
          dietaryPreference: profile.dietaryPreference,
          experienceLevel: profile.experienceLevel,
          trainingLocation: profile.trainingLocation,
          mazeCoachTone: profile.mazeCoachTone
        }
      : null,
    fitnessGoal: profile?.fitnessGoal ?? "build_muscle",
    recentWorkoutLogs: [context.recentWorkouts],
    recentNutritionLogs: [context.recentNutrition],
    recentWeightTrend: context.recentWeightTrend,
    cardioHistorySummary: context.cardioHistorySummary,
    preferredMazeCoachTone: context.tone
  };
}

function mapBackendRecommendation(
  recommendation: MazeCoachApiRecommendation,
  context: MazeCoachContext,
  source: "backend" | "backend_fallback",
  backendError?: string
): MazeCoachRecommendation {
  const localFallback = buildLocalRecommendation(context);

  return {
    headline: getBackendHeadline(context.tone, context.profile?.fitnessGoal ?? "build_muscle", source),
    dailyCalories: normalizeNumber(recommendation.caloriesTarget, context.targets.calories),
    dailyProtein: normalizeNumber(recommendation.proteinTarget, context.targets.proteinGrams),
    carbsTarget: normalizeNumber(recommendation.carbsTarget, context.targets.carbGrams),
    fatTarget: normalizeNumber(recommendation.fatsTarget, context.targets.fatGrams),
    suggestedWorkout: normalizeString(recommendation.suggestedWorkout, localFallback.suggestedWorkout),
    suggestedMeals: normalizeStringArray(recommendation.suggestedMeals, localFallback.suggestedMeals),
    recoveryAdvice: normalizeString(recommendation.recoveryAdvice, localFallback.recoveryAdvice),
    explanation: normalizeString(recommendation.explanation, localFallback.explanation),
    insights: [
      source === "backend"
        ? "Generated through the secure Maze Method backend."
        : "Backend fallback used because the AI service was unavailable.",
      `${context.recentWorkouts.workoutCount} workouts logged in the last 14 days.`,
      `${context.recentNutrition.loggedDayCount} nutrition days logged in the last 7 days.`,
      normalizeString(recommendation.safetyNote, localFallback.safetyNote ?? "")
    ].filter(isString),
    toneLabel: formatMazeCoachTone(context.tone),
    generatedAt: new Date().toISOString(),
    source,
    safetyNote: normalizeString(recommendation.safetyNote, localFallback.safetyNote ?? ""),
    errorMessage: backendError
  };
}

async function saveRecommendationIfNeeded(
  options: MazeCoachRecommendationOptions,
  context: MazeCoachContext,
  promptContext: MazeCoachApiRequest,
  recommendation: MazeCoachRecommendation
) {
  if (options.saveToHistory === false) {
    return;
  }

  try {
    await saveMazeCoachHistory({
      source: recommendation.source,
      tone: context.tone,
      promptContext,
      recommendation,
      errorMessage: recommendation.errorMessage
    });
  } catch {
    // Recommendation history should not prevent the user from seeing Maze Coach output.
  }
}

function getBackendHeadline(
  tone: MazeCoachTone,
  goal: FitnessGoal,
  source: "backend" | "backend_fallback"
) {
  if (source === "backend_fallback") {
    return "Maze Coach kept your plan available with a safe fallback.";
  }

  const goalLabel = formatFitnessGoal(goal).toLowerCase();

  if (tone === "serious_gym") {
    return `Secure backend plan ready: execute the ${goalLabel} path.`;
  }

  if (tone === "professional_trainer") {
    return `Maze Coach analyzed your ${goalLabel} context and recent logs.`;
  }

  return `Today's path is built around your ${goalLabel} goal.`;
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
  return strings.length > 0 ? strings : fallback;
}

async function getRecentWorkoutSummary(): Promise<RecentWorkoutSummary> {
  const database = await getDatabase();
  const startDate = getDaysAgoDateKey(14);

  // Recent workout context keeps recommendations responsive without needing a backend model.
  const [summaryRow, completedRow, muscleRows] = await Promise.all([
    database.getFirstAsync<WorkoutSummaryRow>(
      `SELECT COUNT(*) AS workout_count,
              MAX(substr(started_at, 1, 10)) AS last_workout_date
       FROM workout_logs
       WHERE substr(started_at, 1, 10) >= ?`,
      [startDate]
    ),
    database.getFirstAsync<CompletedExerciseRow>(
      `SELECT COUNT(*) AS completed_count
       FROM logged_workout_exercises lwe
       JOIN workout_logs wl ON wl.id = lwe.workout_log_id
       WHERE substr(wl.started_at, 1, 10) >= ?
         AND lwe.is_completed = 1`,
      [startDate]
    ),
    database.getAllAsync<MuscleGroupRow>(
      `SELECT lwe.muscle_group,
              COUNT(*) AS count
       FROM logged_workout_exercises lwe
       JOIN workout_logs wl ON wl.id = lwe.workout_log_id
       WHERE substr(wl.started_at, 1, 10) >= ?
         AND lwe.muscle_group IS NOT NULL
       GROUP BY lwe.muscle_group
       ORDER BY count DESC
       LIMIT 3`,
      [startDate]
    )
  ]);

  return {
    workoutCount: summaryRow?.workout_count ?? 0,
    completedExerciseCount: completedRow?.completed_count ?? 0,
    lastWorkoutDate: summaryRow?.last_workout_date ?? undefined,
    topMuscleGroups: muscleRows.map((row) => row.muscle_group).filter(isString)
  };
}

async function getRecentNutritionSummary(): Promise<RecentNutritionSummary> {
  const database = await getDatabase();
  const startDate = getDaysAgoDateKey(7);

  // Manual macro totals override meal sums for a day, matching the Nutrition tab behavior.
  const [mealRows, macroRows] = await Promise.all([
    database.getAllAsync<MealMacroRow>(
      `SELECT substr(logged_at, 1, 10) AS date,
              SUM(calories) AS calories,
              SUM(protein_grams) AS protein_grams,
              SUM(carb_grams) AS carb_grams,
              SUM(fat_grams) AS fat_grams
       FROM meals
       WHERE substr(logged_at, 1, 10) >= ?
       GROUP BY substr(logged_at, 1, 10)
       ORDER BY date ASC`,
      [startDate]
    ),
    database.getAllAsync<MacroLogRow>(
      "SELECT * FROM daily_macro_logs WHERE date >= ? ORDER BY date ASC",
      [startDate]
    )
  ]);
  const totalsByDate = new Map<string, MacroTotals>();

  for (const mealRow of mealRows) {
    totalsByDate.set(mealRow.date, {
      calories: mealRow.calories ?? 0,
      proteinGrams: mealRow.protein_grams ?? 0,
      carbGrams: mealRow.carb_grams ?? 0,
      fatGrams: mealRow.fat_grams ?? 0
    });
  }

  for (const macroRow of macroRows) {
    const mealTotals = totalsByDate.get(macroRow.date);
    const macroLog = mapMacroRow(macroRow);

    totalsByDate.set(macroRow.date, {
      calories: macroLog.calories ?? mealTotals?.calories ?? 0,
      proteinGrams: macroLog.proteinGrams ?? mealTotals?.proteinGrams ?? 0,
      carbGrams: macroLog.carbGrams ?? mealTotals?.carbGrams ?? 0,
      fatGrams: macroLog.fatGrams ?? mealTotals?.fatGrams ?? 0
    });
  }

  const totals = Array.from(totalsByDate.entries());
  const loggedDayCount = totals.length;
  const sum = totals.reduce<MacroTotals>(
    (next, [, day]) => ({
      calories: next.calories + day.calories,
      proteinGrams: next.proteinGrams + day.proteinGrams,
      carbGrams: next.carbGrams + day.carbGrams,
      fatGrams: next.fatGrams + day.fatGrams
    }),
    { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
  );

  return {
    loggedDayCount,
    averageCalories: loggedDayCount > 0 ? Math.round(sum.calories / loggedDayCount) : 0,
    averageProtein: loggedDayCount > 0 ? Math.round(sum.proteinGrams / loggedDayCount) : 0,
    lastLoggedDate: totals.at(-1)?.[0]
  };
}

async function getRecentWeightTrendSummary(): Promise<RecentWeightTrendSummary> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<WeightTrendRow>(
    "SELECT date, weight, units FROM body_weight_entries ORDER BY date DESC LIMIT 8"
  );
  const sortedRows = rows.slice().reverse();
  const first = sortedRows[0];
  const latest = sortedRows.at(-1);
  const change = first && latest ? latest.weight - first.weight : undefined;

  return {
    entryCount: sortedRows.length,
    firstWeight: first?.weight,
    latestWeight: latest?.weight,
    change,
    units: latest?.units,
    direction: getWeightDirection(change)
  };
}

async function getCardioHistorySummary(): Promise<CardioHistorySummary> {
  const database = await getDatabase();
  const startDate = getDaysAgoDateKey(14);
  const [summaryRow, typeRows] = await Promise.all([
    database.getFirstAsync<CardioSummaryRow>(
      `SELECT COUNT(*) AS session_count,
              SUM(duration_minutes) AS total_minutes,
              SUM(distance) AS total_distance,
              MAX(date) AS last_cardio_date
       FROM cardio_sessions
       WHERE date >= ?`,
      [startDate]
    ),
    database.getAllAsync<CardioTypeRow>(
      `SELECT activity_type,
              COUNT(*) AS count
       FROM cardio_sessions
       WHERE date >= ?
       GROUP BY activity_type
       ORDER BY count DESC
       LIMIT 1`,
      [startDate]
    )
  ]);

  return {
    sessionCount: summaryRow?.session_count ?? 0,
    totalMinutes: summaryRow?.total_minutes ?? 0,
    totalDistance: summaryRow?.total_distance ?? 0,
    lastCardioDate: summaryRow?.last_cardio_date ?? undefined,
    topCardioType: typeRows[0]?.activity_type ?? undefined
  };
}

function getSuggestedWorkout(
  goal: FitnessGoal,
  profile: UserProfile | null,
  recentWorkouts: RecentWorkoutSummary
) {
  const trainingDays = profile?.daysPerWeek ?? 3;
  const hasHitWeeklyTarget = recentWorkouts.workoutCount >= trainingDays;
  const location = profile ? formatTrainingLocation(profile.trainingLocation).toLowerCase() : "gym";

  if (hasHitWeeklyTarget) {
    return "Recovery-focused session: mobility, easy walking, and light core work.";
  }

  if (goal === "lose_weight") {
    return `Strength session in the ${location}: full body compounds plus 20 minutes of low-impact cardio.`;
  }

  if (goal === "improve_endurance") {
    return "Steady cardio session with a short strength block for legs and core.";
  }

  if (goal === "maintain") {
    return "Repeatable full-body lift with one push, one pull, one hinge, one squat, and core.";
  }

  return `Progressive strength day in the ${location}: start with a heavy compound lift, then controlled accessories.`;
}

function getSuggestedMeals(goal: FitnessGoal, targets: NutritionTargets, dietaryPreference?: string) {
  const diet = dietaryPreference && dietaryPreference !== "None" ? `${dietaryPreference} ` : "";
  const proteinMeal = `${diet}protein anchor meal with 35-45g protein and a carb portion around training.`;
  const recoveryMeal = `Post-workout meal near ${Math.round(targets.proteinGrams / 4)}g protein with fruit or rice.`;

  if (goal === "lose_weight") {
    return [
      proteinMeal,
      "Lean protein bowl with vegetables, potatoes or rice, and a measured fat source.",
      "High-protein snack before cravings hit: Greek yogurt, shake, eggs, or tofu."
    ];
  }

  if (goal === "improve_endurance") {
    return [
      proteinMeal,
      "Carb-forward pre-training meal with easy digestion and moderate protein.",
      recoveryMeal
    ];
  }

  return [
    proteinMeal,
    `Build meals around ${Math.round(targets.calories / 3)} calories per main meal.`,
    recoveryMeal
  ];
}

function getRecoveryAdvice(
  trainingDays: number,
  recentWorkouts: RecentWorkoutSummary,
  tone: MazeCoachTone
) {
  if (recentWorkouts.workoutCount >= trainingDays) {
    return tone === "serious_gym"
      ? "You have earned the rest day. Keep it intentional: sleep, steps, hydration, no junk volume."
      : "Make today productive by recovering well: sleep, hydration, walking, and light mobility.";
  }

  if (!recentWorkouts.lastWorkoutDate) {
    return "Start with one manageable session, then let the app track the pattern.";
  }

  return "If soreness is high, lower load and keep technique strict. If energy is good, progress one variable.";
}

function getToneHeadline(
  tone: MazeCoachTone,
  goal: FitnessGoal,
  recentWorkouts: RecentWorkoutSummary,
  recentNutrition: RecentNutritionSummary
) {
  const goalLabel = formatFitnessGoal(goal).toLowerCase();

  if (tone === "friendly_beginner") {
    return `Keep today's path simple: one workout step and one nutrition win for ${goalLabel}.`;
  }

  if (tone === "serious_gym") {
    return `Execute the plan: ${recentWorkouts.workoutCount} recent workouts, ${recentNutrition.loggedDayCount} nutrition days logged.`;
  }

  if (tone === "professional_trainer") {
    return `Today's recommendation balances ${goalLabel}, recent adherence, and recovery readiness.`;
  }

  return `Stay focused: train with structure, hit protein, and keep recovery clean.`;
}

function getExplanation(
  profile: UserProfile | null,
  targets: NutritionTargets,
  recentWorkouts: RecentWorkoutSummary,
  recentNutrition: RecentNutritionSummary,
  calorieGap: number
) {
  const goal = profile ? formatFitnessGoal(profile.fitnessGoal) : "Build muscle";
  const activity = profile ? formatActivityLevel(profile.activityLevel) : "Moderate";
  const gapText =
    recentNutrition.loggedDayCount > 0
      ? `Your recent average is ${Math.abs(calorieGap)} calories ${calorieGap >= 0 ? "below" : "above"} target.`
      : "No recent nutrition logs were found, so targets are based on profile data.";

  return `${goal}, ${activity.toLowerCase()} activity, ${profile?.daysPerWeek ?? 3} planned training days, ${recentWorkouts.workoutCount} recent workouts, and recent nutrition logs shaped this recommendation. ${gapText} Targets use the same local formula as the Nutrition tab: ${targets.formulaNote}`;
}

function getInsights(
  profile: UserProfile | null,
  recentWorkouts: RecentWorkoutSummary,
  recentNutrition: RecentNutritionSummary,
  calorieGap: number
) {
  const insights = [
    `${recentWorkouts.workoutCount} workouts logged in the last 14 days.`,
    `${recentNutrition.loggedDayCount} nutrition days logged in the last 7 days.`
  ];

  if (recentWorkouts.topMuscleGroups.length > 0) {
    insights.push(`Recent training emphasis: ${recentWorkouts.topMuscleGroups.join(", ")}.`);
  }

  if (recentNutrition.loggedDayCount > 0) {
    insights.push(`Average protein is ${recentNutrition.averageProtein}g over logged days.`);
    insights.push(
      calorieGap >= 0
        ? "Calories are trending under target, so consistency matters more than restriction."
        : "Calories are trending over target, so tighten portions before changing the whole plan."
    );
  }

  if (profile?.weight && profile?.goalWeight) {
    insights.push(`Current weight and goal weight are both available for recommendation context.`);
  }

  return insights;
}

function mapMacroRow(row: MacroLogRow): DailyMacroLog {
  return {
    id: row.id,
    date: row.date,
    calories: row.calories ?? undefined,
    proteinGrams: row.protein_grams ?? undefined,
    carbGrams: row.carb_grams ?? undefined,
    fatGrams: row.fat_grams ?? undefined,
    waterOunces: row.water_ounces ?? undefined
  };
}

function getDaysAgoDateKey(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeightDirection(change?: number) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return "unknown";
  }

  if (Math.abs(change) < 0.25) {
    return "stable";
  }

  return change > 0 ? "up" : "down";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Maze Coach backend request failed.";
}

function isString(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
