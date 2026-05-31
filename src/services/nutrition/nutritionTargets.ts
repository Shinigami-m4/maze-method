import { ActivityLevel, UserProfile } from "../../types/models";
import { MacroTotals, NutritionTargets } from "../../types/nutrition";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
};

export function calculateNutritionTargets(profile: UserProfile | null): NutritionTargets {
  const weightKg = toKilograms(profile?.weight, profile?.units);
  const heightCm = toCentimeters(profile?.height, profile?.units);
  const age = profile?.age && profile.age > 0 ? profile.age : 25;
  const gender = profile?.gender?.toLowerCase() ?? "";
  const activity = profile?.activityLevel ?? "moderate";
  const trainingDays = profile?.daysPerWeek ?? 3;

  // Mifflin-St Jeor is simple, common, and easy to explain in a portfolio:
  // men: 10w + 6.25h - 5a + 5, women: 10w + 6.25h - 5a - 161.
  // For unspecified gender, use a midpoint adjustment so onboarding can remain optional.
  const genderAdjustment = gender.includes("female") || gender.includes("woman")
    ? -161
    : gender.includes("male") || gender.includes("man")
      ? 5
      : -78;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderAdjustment;
  const trainingAdjustment = Math.max(0, trainingDays - 3) * 35;
  const maintenanceCalories = Math.round(bmr * activityMultipliers[activity] + trainingAdjustment);
  const goalCalories = Math.max(1200, maintenanceCalories + getGoalCalorieAdjustment(profile));
  const proteinGrams = Math.round(toPounds(weightKg) * getProteinMultiplier(profile));
  const fatGrams = Math.round((goalCalories * 0.25) / 9);
  const carbCalories = Math.max(0, goalCalories - proteinGrams * 4 - fatGrams * 9);
  const carbGrams = Math.round(carbCalories / 4);

  return {
    calories: goalCalories,
    proteinGrams,
    carbGrams,
    fatGrams,
    maintenanceCalories,
    goalCalories,
    formulaNote:
      "Targets use Mifflin-St Jeor, activity level, training days, and a simple goal adjustment."
  };
}

export function sumMealMacros(meals: Array<Partial<MacroTotals>>) {
  return meals.reduce<MacroTotals>(
    (totals, meal) => ({
      calories: totals.calories + (meal.calories ?? 0),
      proteinGrams: totals.proteinGrams + (meal.proteinGrams ?? 0),
      carbGrams: totals.carbGrams + (meal.carbGrams ?? 0),
      fatGrams: totals.fatGrams + (meal.fatGrams ?? 0)
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbGrams: 0,
      fatGrams: 0
    }
  );
}

function getGoalCalorieAdjustment(profile: UserProfile | null) {
  if (!profile) {
    return 0;
  }

  if (profile.fitnessGoal === "lose_weight") {
    return -450;
  }

  if (profile.fitnessGoal === "build_muscle") {
    return 250;
  }

  if (profile.fitnessGoal === "improve_endurance") {
    return 100;
  }

  if (
    typeof profile.weight === "number" &&
    typeof profile.goalWeight === "number" &&
    profile.goalWeight < profile.weight
  ) {
    return -250;
  }

  return 0;
}

function getProteinMultiplier(profile: UserProfile | null) {
  if (profile?.fitnessGoal === "lose_weight") {
    return 0.9;
  }

  if (profile?.fitnessGoal === "build_muscle") {
    return 0.85;
  }

  return 0.7;
}

function toKilograms(weight?: number, units?: UserProfile["units"]) {
  if (!weight || weight <= 0) {
    return 82;
  }

  return units === "metric" ? weight : weight * 0.453592;
}

function toCentimeters(height?: number, units?: UserProfile["units"]) {
  if (!height || height <= 0) {
    return 178;
  }

  return units === "metric" ? height : height * 2.54;
}

function toPounds(weightKg: number) {
  return weightKg / 0.453592;
}
