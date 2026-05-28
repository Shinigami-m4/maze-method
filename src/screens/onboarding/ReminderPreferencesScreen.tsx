import React, { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../theme/theme";
import { OnboardingStackParamList } from "../../types/navigation";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ReminderPreferences">;

type ReminderKey = "workout" | "nutrition" | "progressPhoto" | "weighIn";

const reminderRows: Array<{ key: ReminderKey; label: string }> = [
  { key: "workout", label: "Workout reminders" },
  { key: "nutrition", label: "Nutrition reminders" },
  { key: "progressPhoto", label: "Progress photo reminders" },
  { key: "weighIn", label: "Weigh-in reminders" }
];

export function ReminderPreferencesScreen({ navigation }: Props) {
  const { draft, updateDraft, completeOnboarding } = useOnboarding();
  const [isSaving, setIsSaving] = useState(false);

  const toggleReminder = (key: ReminderKey) => {
    updateDraft({
      reminderPreferences: {
        ...draft.reminderPreferences,
        [key]: !draft.reminderPreferences[key]
      }
    });
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await completeOnboarding();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OnboardingLayout
      footer={
        <View style={styles.footer}>
          <PrimaryButton label="Back" onPress={() => navigation.goBack()} variant="ghost" />
          <PrimaryButton
            disabled={isSaving}
            label={isSaving ? "Saving" : "Finish"}
            onPress={handleFinish}
            style={styles.finishButton}
          />
        </View>
      }
      step={6}
      subtitle="Pick the nudges that support your routine without turning the app into noise."
      title="Reminder preferences"
    >
      {reminderRows.map((row) => (
        <Card key={row.key} style={styles.reminderCard}>
          <AppText variant="subheading">{row.label}</AppText>
          <Switch
            ios_backgroundColor={theme.colors.surfaceRaised}
            onValueChange={() => toggleReminder(row.key)}
            thumbColor={theme.colors.text}
            trackColor={{
              false: theme.colors.surfaceRaised,
              true: theme.colors.accent
            }}
            value={draft.reminderPreferences[row.key]}
          />
        </Card>
      ))}
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  finishButton: {
    flex: 1
  },
  footer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xxl
  },
  reminderCard: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  }
});
