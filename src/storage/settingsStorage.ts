import AsyncStorage from "@react-native-async-storage/async-storage";

import { storageKeys } from "./keys";
import {
  MazeCoachTone,
  ReminderPreferences,
  UnitPreference
} from "../types/models";
import {
  LocalReminderSettings,
  recommendedReminderSettings,
  ReminderChannelKey
} from "../types/reminders";

export async function getOnboardingCompleted() {
  const value = await AsyncStorage.getItem(storageKeys.onboardingCompleted);
  return value === "true";
}

export async function setOnboardingCompleted(completed: boolean) {
  await AsyncStorage.setItem(storageKeys.onboardingCompleted, String(completed));
}

export async function saveUnitPreference(units: UnitPreference) {
  await AsyncStorage.setItem(storageKeys.unitPreference, units);
}

export async function getUnitPreference(): Promise<UnitPreference> {
  const stored = await AsyncStorage.getItem(storageKeys.unitPreference);
  return stored === "metric" ? "metric" : "imperial";
}

export async function saveMazeCoachTone(tone: MazeCoachTone) {
  await AsyncStorage.setItem(storageKeys.mazeCoachTone, tone);
}

export async function getMazeCoachTone(): Promise<MazeCoachTone> {
  const stored = await AsyncStorage.getItem(storageKeys.mazeCoachTone);
  if (
    stored === "friendly_beginner" ||
    stored === "serious_gym" ||
    stored === "professional_trainer" ||
    stored === "motivational_not_corny"
  ) {
    return stored;
  }

  return "motivational_not_corny";
}

export async function saveReminderPreferences(preferences: ReminderPreferences) {
  await AsyncStorage.setItem(storageKeys.reminderPreferences, JSON.stringify(preferences));
}

export async function getReminderPreferences(): Promise<ReminderPreferences> {
  const stored = await AsyncStorage.getItem(storageKeys.reminderPreferences);

  if (!stored) {
    return {
      workout: true,
      nutrition: false,
      progressPhoto: true,
      weighIn: true
    };
  }

  return JSON.parse(stored) as ReminderPreferences;
}

export async function saveLocalReminderSettings(settings: LocalReminderSettings) {
  await AsyncStorage.setItem(storageKeys.reminderScheduleSettings, JSON.stringify(settings));

  // Keep the original onboarding-era reminder flags in sync for older screens and saved profiles.
  await saveReminderPreferences({
    workout: settings.workout.enabled,
    nutrition: settings.meal.enabled,
    progressPhoto: settings.progressPhoto.enabled,
    weighIn: true
  });
}

export async function getLocalReminderSettings(): Promise<LocalReminderSettings> {
  const stored = await AsyncStorage.getItem(storageKeys.reminderScheduleSettings);

  if (stored) {
    return normalizeReminderSettings(JSON.parse(stored) as Partial<LocalReminderSettings>);
  }

  const legacyPreferences = await getReminderPreferences();

  return {
    workout: {
      ...recommendedReminderSettings.workout,
      enabled: legacyPreferences.workout
    },
    meal: {
      ...recommendedReminderSettings.meal,
      enabled: legacyPreferences.nutrition
    },
    progressPhoto: {
      ...recommendedReminderSettings.progressPhoto,
      enabled: legacyPreferences.progressPhoto
    }
  };
}

function normalizeReminderSettings(settings: Partial<LocalReminderSettings>): LocalReminderSettings {
  const keys: ReminderChannelKey[] = ["workout", "meal", "progressPhoto"];

  return keys.reduce<LocalReminderSettings>((nextSettings, key) => {
    const fallback = recommendedReminderSettings[key];
    const stored = settings[key];

    nextSettings[key] = {
      enabled: stored?.enabled ?? fallback.enabled,
      days: normalizeDays(stored?.days, fallback.days),
      time: normalizeTime(stored?.time, fallback.time)
    };

    return nextSettings;
  }, {} as LocalReminderSettings);
}

function normalizeDays(days: number[] | undefined, fallback: number[]) {
  if (!Array.isArray(days)) {
    return fallback;
  }

  const validDays = days.filter((day) => Number.isInteger(day) && day >= 1 && day <= 7);
  return validDays.length > 0 ? validDays : fallback;
}

function normalizeTime(time: string | undefined, fallback: string) {
  return typeof time === "string" && /^\d{2}:\d{2}$/.test(time) ? time : fallback;
}
