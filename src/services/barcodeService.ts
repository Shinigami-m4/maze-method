import AsyncStorage from "@react-native-async-storage/async-storage";

import { storageKeys } from "../storage/keys";
import { FoodLookupProduct, RecentScannedFood } from "../types/nutrition";

const MAX_RECENT_SCANS = 8;

export function normalizeBarcodeValue(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export async function getRecentScannedFoods(): Promise<RecentScannedFood[]> {
  try {
    const rawValue = await AsyncStorage.getItem(storageKeys.recentScannedFoods);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as RecentScannedFood[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRecentScannedFood(food: RecentScannedFood) {
  const recentFoods = await getRecentScannedFoods();
  const dedupedFoods = recentFoods.filter((recentFood) => recentFood.barcode !== food.barcode);
  const nextFoods = [food, ...dedupedFoods].slice(0, MAX_RECENT_SCANS);

  await AsyncStorage.setItem(storageKeys.recentScannedFoods, JSON.stringify(nextFoods));
}

export function toFoodLookupProduct(food: RecentScannedFood): FoodLookupProduct {
  return {
    barcode: food.barcode,
    productName: food.productName,
    servingSize: food.servingSize,
    calories: food.calories,
    proteinGrams: food.proteinGrams,
    carbGrams: food.carbGrams,
    fatGrams: food.fatGrams,
    source: food.source,
    found: food.found
  };
}

export function buildScannedMealNotes({
  barcode,
  servingSize,
  source,
  notes
}: {
  barcode: string;
  servingSize?: string;
  source: FoodLookupProduct["source"];
  notes?: string;
}) {
  const scannerNotes = [
    `Barcode: ${barcode}`,
    servingSize ? `Serving size: ${servingSize}` : undefined,
    source === "open_food_facts" ? "Source: Open Food Facts" : "Source: Manual barcode entry"
  ].filter(Boolean);

  return [notes?.trim(), scannerNotes.join("\n")].filter(Boolean).join("\n\n");
}
