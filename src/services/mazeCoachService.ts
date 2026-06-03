import { getUserProfile } from "../database/profileRepository";
import { getDatabase } from "../database/client";
import { getMazeCoachTone } from "../storage/settingsStorage";
import { calculateNutritionTargets } from "./nutrition/nutritionTargets";
import { DailyMacroLog, FitnessGoal, MazeCoachTone, UserProfile } from "../types/models";
import { MacroTotals, NutritionTargets } from "../types/nutrition";
import {
  formatActivityLevel,
  formatFitnessGoal,
  formatMazeCoachTone,
  formatTrainingLocation
} from "../utils/labels";

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

export async function getMazeCoachRecommendation(): Promise<MazeCoachRecommendation> {
  const [profile, storedTone, recentWorkouts, recentNutrition] = await Promise.all([
    getUserProfile(),
    getMazeCoachTone(),
    getRecentWorkoutSummary(),
    getRecentNutritionSummary()
  ]);
  const tone = profile?.mazeCoachTone ?? storedTone;
  const targets = calculateNutritionTargets(profile);

  // Future backend/OpenAI integration point:
  // Replace this local decision tree with a request to a trusted backend or Supabase Edge Function.
  // That backend can safely call OpenAI with server-side secrets. Never ship an OpenAI API key in this app.
  return buildLocalRecommendation({
    profile,
    tone,
    targets,
    recentWorkouts,
    recentNutrition
  });
}

function buildLocalRecommendation({
  profile,
  tone,
  targets,
  recentWorkouts,
  recentNutrition
}: {
  profile: UserProfile | null;
  tone: MazeCoachTone;
  targets: NutritionTargets;
  recentWorkouts: RecentWorkoutSummary;
  recentNutrition: RecentNutritionSummary;
}): MazeCoachRecommendation {
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
    generatedAt: new Date().toISOString()
  };
}

async function getRecentWorkoutSummary(): Promise<RecentWorkoutSummary> {
  const database = await getDatabase();
  const startDate = getDaysAgoDateKey(14);
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

function isString(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
