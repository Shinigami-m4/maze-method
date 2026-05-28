import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { theme } from "../../theme/theme";

export function CalendarScreen() {
  return (
    <Screen>
      <AppText variant="title">Calendar</AppText>
      <AppText muted style={styles.subtitle}>
        Training, meals, cardio, notes, and progress events.
      </AppText>

      <SectionHeader title="This week" />
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="calendar-outline" size={26} />
        <View style={styles.emptyText}>
          <AppText variant="subheading">No entries yet</AppText>
          <AppText muted>Logged activity will appear on your local calendar.</AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  emptyText: {
    flex: 1
  },
  subtitle: {
    marginTop: theme.spacing.xs
  }
});
