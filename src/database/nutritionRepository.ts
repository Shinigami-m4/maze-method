import { getUserProfile } from "./profileRepository";
import { getDatabase } from "./client";
import { createLocalId } from "../utils/id";
import { calculateNutritionTargets, sumMealMacros } from "../services/nutrition/nutritionTargets";
import { DailyMacroLog, MealLog } from "../types/models";
import { DailyMacroInput, MealCategory, MealInput, NutritionDay } from "../types/nutrition";

type MealRow = {
  id: string;
  logged_at: string;
  meal_name: string;
  meal_category: MealCategory;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  notes: string | null;
};

type MacroRow = {
  id: string;
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  water_ounces: number | null;
};

export async function getNutritionDay(date: string): Promise<NutritionDay> {
  const database = await getDatabase();
  const [profile, mealRows, manualTotalRow] = await Promise.all([
    getUserProfile(),
    database.getAllAsync<MealRow>(
      "SELECT * FROM meals WHERE substr(logged_at, 1, 10) = ? ORDER BY logged_at ASC",
      [date]
    ),
    database.getFirstAsync<MacroRow>("SELECT * FROM daily_macro_logs WHERE date = ? LIMIT 1", [
      date
    ])
  ]);
  const meals = mealRows.map(mapMealRow);
  const manualTotals = manualTotalRow ? mapMacroRow(manualTotalRow) : undefined;
  const mealTotals = sumMealMacros(meals);

  return {
    date,
    meals,
    manualTotals,
    consumedTotals: manualTotals
      ? {
          calories: manualTotals.calories ?? mealTotals.calories,
          proteinGrams: manualTotals.proteinGrams ?? mealTotals.proteinGrams,
          carbGrams: manualTotals.carbGrams ?? mealTotals.carbGrams,
          fatGrams: manualTotals.fatGrams ?? mealTotals.fatGrams
        }
      : mealTotals,
    targets: calculateNutritionTargets(profile),
    profile
  };
}

export async function saveMeal(input: MealInput) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("meal");
  const loggedAt = `${input.date}T12:00:00.000`;

  await database.runAsync(
    `INSERT INTO meals (
      id,
      logged_at,
      meal_name,
      meal_category,
      calories,
      protein_grams,
      carb_grams,
      fat_grams,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      logged_at = excluded.logged_at,
      meal_name = excluded.meal_name,
      meal_category = excluded.meal_category,
      calories = excluded.calories,
      protein_grams = excluded.protein_grams,
      carb_grams = excluded.carb_grams,
      fat_grams = excluded.fat_grams,
      notes = excluded.notes`,
    [
      id,
      loggedAt,
      input.mealName,
      input.mealCategory,
      input.calories ?? null,
      input.proteinGrams ?? null,
      input.carbGrams ?? null,
      input.fatGrams ?? null,
      input.notes ?? null
    ]
  );

  return id;
}

export async function deleteMeal(mealId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM meals WHERE id = ?", [mealId]);
}

export async function saveDailyMacroTotal(input: DailyMacroInput) {
  const database = await getDatabase();
  const id = `daily-macros-${input.date}`;

  await database.runAsync(
    `INSERT INTO daily_macro_logs (
      id,
      date,
      calories,
      protein_grams,
      carb_grams,
      fat_grams
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      calories = excluded.calories,
      protein_grams = excluded.protein_grams,
      carb_grams = excluded.carb_grams,
      fat_grams = excluded.fat_grams`,
    [
      id,
      input.date,
      input.calories ?? null,
      input.proteinGrams ?? null,
      input.carbGrams ?? null,
      input.fatGrams ?? null
    ]
  );
}

export async function deleteDailyMacroTotal(date: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM daily_macro_logs WHERE date = ?", [date]);
}

function mapMealRow(row: MealRow): MealLog {
  return {
    id: row.id,
    loggedAt: row.logged_at,
    mealName: row.meal_name,
    mealCategory: row.meal_category,
    calories: row.calories ?? undefined,
    proteinGrams: row.protein_grams ?? undefined,
    carbGrams: row.carb_grams ?? undefined,
    fatGrams: row.fat_grams ?? undefined,
    notes: row.notes ?? undefined
  };
}

function mapMacroRow(row: MacroRow): DailyMacroLog {
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
