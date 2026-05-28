import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { OptionButton } from "../../components/OptionButton";
import { activityLevelOptions, fitnessGoalOptions } from "../../data/onboardingOptions";
import { OnboardingStackParamList } from "../../types/navigation";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Goals">;

export function GoalsScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("TrainingPreferences")}
      step={3}
      subtitle="Choose the training outcome and daily activity level that best match your current phase."
      title="Goals"
    >
      {fitnessGoalOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ fitnessGoal: option.value })}
          selected={draft.fitnessGoal === option.value}
        />
      ))}
      {activityLevelOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ activityLevel: option.value })}
          selected={draft.activityLevel === option.value}
        />
      ))}
    </OnboardingLayout>
  );
}
