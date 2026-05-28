import AsyncStorage from "@react-native-async-storage/async-storage";

import { storageKeys } from "./keys";
import {
  MazeCoachTone,
  ReminderPreferences,
  UnitPreference
} from "../types/models";

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
