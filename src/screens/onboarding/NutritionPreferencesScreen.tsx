import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { OptionButton } from "../../components/OptionButton";
import {
  dietaryPreferenceOptions,
  mazeCoachToneOptions
} from "../../data/onboardingOptions";
import { OnboardingStackParamList } from "../../types/navigation";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "NutritionPreferences">;

export function NutritionPreferencesScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("ReminderPreferences")}
      step={5}
      subtitle="Keep nutrition guidance aligned with how you eat and how you want Maze Coach to sound."
      title="Nutrition preferences"
    >
      {dietaryPreferenceOptions.map((preference) => (
        <OptionButton
          key={preference}
          label={preference}
          onPress={() => updateDraft({ dietaryPreference: preference })}
          selected={draft.dietaryPreference === preference}
        />
      ))}
      {mazeCoachToneOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ mazeCoachTone: option.value })}
          selected={draft.mazeCoachTone === option.value}
        />
      ))}
    </OnboardingLayout>
  );
}
