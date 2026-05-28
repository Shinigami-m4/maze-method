import React, { createContext, useContext, useMemo, useState } from "react";

import { getLocalProfileId, saveUserProfile } from "../../database/profileRepository";
import {
  saveMazeCoachTone,
  saveReminderPreferences,
  saveUnitPreference,
  setOnboardingCompleted
} from "../../storage/settingsStorage";
import { OnboardingDraft } from "../../types/onboarding";
import { UserProfile } from "../../types/models";

type OnboardingContextValue = {
  draft: OnboardingDraft;
  updateDraft: (updates: Partial<OnboardingDraft>) => void;
  completeOnboarding: () => Promise<void>;
};

const defaultDraft: OnboardingDraft = {
  name: "",
  gender: "",
  units: "imperial",
  fitnessGoal: "build_muscle",
  experienceLevel: "beginner",
  trainingLocation: "gym",
  daysPerWeek: 3,
  dietaryPreference: "None",
  activityLevel: "moderate",
  mazeCoachTone: "motivational_not_corny",
  reminderPreferences: {
    workout: true,
    nutrition: false,
    progressPhoto: true,
    weighIn: true
  }
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type OnboardingProviderProps = {
  children: React.ReactNode;
  onComplete: () => void;
};

export function OnboardingProvider({ children, onComplete }: OnboardingProviderProps) {
  const [draft, setDraft] = useState<OnboardingDraft>(defaultDraft);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      draft,
      updateDraft: (updates) => setDraft((current) => ({ ...current, ...updates })),
      completeOnboarding: async () => {
        const now = new Date().toISOString();
        const profile: UserProfile = {
          id: getLocalProfileId(),
          name: draft.name.trim() || "Athlete",
          age: draft.age,
          gender: draft.gender.trim() || undefined,
          height: draft.height,
          weight: draft.weight,
          goalWeight: draft.goalWeight,
          units: draft.units,
          fitnessGoal: draft.fitnessGoal,
          experienceLevel: draft.experienceLevel,
          trainingLocation: draft.trainingLocation,
          daysPerWeek: draft.daysPerWeek,
          dietaryPreference: draft.dietaryPreference,
          activityLevel: draft.activityLevel,
          mazeCoachTone: draft.mazeCoachTone,
          createdAt: now,
          updatedAt: now
        };

        // Structured profile data lives in SQLite. Simple boot/settings flags live in AsyncStorage.
        await saveUserProfile(profile);
        await Promise.all([
          saveUnitPreference(draft.units),
          saveMazeCoachTone(draft.mazeCoachTone),
          saveReminderPreferences(draft.reminderPreferences),
          setOnboardingCompleted(true)
        ]);

        onComplete();
      }
    }),
    [draft, onComplete]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }

  return context;
}
