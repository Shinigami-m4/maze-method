import { DailyMacroLog, MealLog, UserProfile } from "./models";

export type MealCategory = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export const mealCategories: MealCategory[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

export type MacroTotals = {
  calories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
};

export type NutritionTargets = MacroTotals & {
  maintenanceCalories: number;
  goalCalories: number;
  formulaNote: string;
};

export type NutritionDay = {
  date: string;
  meals: MealLog[];
  manualTotals?: DailyMacroLog;
  consumedTotals: MacroTotals;
  targets: NutritionTargets;
  profile: UserProfile | null;
};

export type MealInput = {
  id?: string;
  date: string;
  mealName: string;
  mealCategory: MealCategory;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  notes?: string;
};

export type DailyMacroInput = {
  date: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
};

export type FoodLookupSource = "open_food_facts" | "manual";

export type FoodLookupProduct = {
  barcode: string;
  productName: string;
  servingSize?: string;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  source: FoodLookupSource;
  found: boolean;
};

export type RecentScannedFood = FoodLookupProduct & {
  scannedAt: string;
  mealCategory?: MealCategory;
  notes?: string;
};
