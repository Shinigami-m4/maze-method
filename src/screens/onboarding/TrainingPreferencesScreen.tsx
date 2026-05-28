import React from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { OptionButton } from "../../components/OptionButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import {
  experienceOptions,
  trainingLocationOptions
} from "../../data/onboardingOptions";
import { theme } from "../../theme/theme";
import { OnboardingStackParamList } from "../../types/navigation";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "TrainingPreferences">;

const days = [1, 2, 3, 4, 5, 6, 7];

export function TrainingPreferencesScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();

  return (
    <OnboardingLayout
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("NutritionPreferences")}
      step={4}
      subtitle="Shape the first version of your weekly training structure."
      title="Training preferences"
    >
      {experienceOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ experienceLevel: option.value })}
          selected={draft.experienceLevel === option.value}
        />
      ))}
      {trainingLocationOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ trainingLocation: option.value })}
          selected={draft.trainingLocation === option.value}
        />
      ))}
      <View>
        <AppText muted variant="caption">
          Days per week
        </AppText>
        <View style={styles.daysGrid}>
          {days.map((day) => (
            <PrimaryButton
              key={day}
              label={String(day)}
              onPress={() => updateDraft({ daysPerWeek: day })}
              style={styles.dayButton}
              variant={draft.daysPerWeek === day ? "filled" : "ghost"}
            />
          ))}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  dayButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 0
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs
  }
});
