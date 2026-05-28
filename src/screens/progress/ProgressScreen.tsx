import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { theme } from "../../theme/theme";

export function ProgressScreen() {
  return (
    <Screen>
      <AppText variant="title">Progress</AppText>
      <AppText muted style={styles.subtitle}>
        Body weight, measurements, photos, charts, cardio, and records.
      </AppText>

      <SectionHeader title="Body metrics" />
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="analytics-outline" size={26} />
        <View style={styles.emptyText}>
          <AppText variant="subheading">No progress entries yet</AppText>
          <AppText muted>Charts will appear after local entries exist.</AppText>
        </View>
      </Card>

      <SectionHeader title="Progress photos" />
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="images-outline" size={26} />
        <View style={styles.emptyText}>
          <AppText variant="subheading">No photos saved</AppText>
          <AppText muted>Weekly check-ins will appear here.</AppText>
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
