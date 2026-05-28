import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { getUserProfile } from "../../database/profileRepository";
import { getReminderPreferences } from "../../storage/settingsStorage";
import { theme } from "../../theme/theme";
import { ReminderPreferences, UserProfile } from "../../types/models";
import { RootStackParamList } from "../../types/navigation";
import {
  formatActivityLevel,
  formatExperience,
  formatFitnessGoal,
  formatMazeCoachTone,
  formatTrainingLocation,
  formatUnits
} from "../../utils/labels";

type Props = NativeStackScreenProps<RootStackParamList, "SettingsProfile">;

export function SettingsProfileScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<ReminderPreferences | null>(null);

  useEffect(() => {
    void getUserProfile().then(setProfile);
    void getReminderPreferences().then(setReminders);
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Settings</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title="Profile" />
      <Card>
        <SettingsRow label="Name" value={profile?.name ?? "Athlete"} />
        <SettingsRow label="Goal" value={profile ? formatFitnessGoal(profile.fitnessGoal) : "--"} />
        <SettingsRow
          label="Experience"
          value={profile ? formatExperience(profile.experienceLevel) : "--"}
        />
        <SettingsRow
          label="Training"
          value={profile ? formatTrainingLocation(profile.trainingLocation) : "--"}
        />
        <SettingsRow
          label="Activity"
          value={profile ? formatActivityLevel(profile.activityLevel) : "--"}
        />
      </Card>

      <SectionHeader title="Preferences" />
      <Card>
        <SettingsRow label="Units" value={profile ? formatUnits(profile.units) : "lb / in"} />
        <SettingsRow
          label="Maze Coach tone"
          value={profile ? formatMazeCoachTone(profile.mazeCoachTone) : "Motivational but not corny"}
        />
        <SettingsRow label="Theme" value="Dark" />
      </Card>

      <SectionHeader title="Reminders" />
      <Card>
        <SettingsRow label="Workout" value={reminders?.workout ? "On" : "Off"} />
        <SettingsRow label="Nutrition" value={reminders?.nutrition ? "On" : "Off"} />
        <SettingsRow label="Progress photo" value={reminders?.progressPhoto ? "On" : "Off"} />
        <SettingsRow label="Weigh-in" value={reminders?.weighIn ? "On" : "Off"} />
      </Card>
    </Screen>
  );
}

function SettingsRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText muted>{label}</AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerSpacer: {
    width: 40
  },
  row: {
    alignItems: "center",
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    paddingVertical: theme.spacing.sm
  },
  rowValue: {
    flexShrink: 1,
    textAlign: "right"
  }
});
