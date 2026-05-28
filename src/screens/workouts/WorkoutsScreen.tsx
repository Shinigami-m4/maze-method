import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { theme } from "../../theme/theme";

export function WorkoutsScreen() {
  return (
    <Screen>
      <AppText variant="title">Workouts</AppText>
      <AppText muted style={styles.subtitle}>
        Routines, exercises, personal records, and workout logs.
      </AppText>

      <SectionHeader title="Routines" />
      <FeatureCard icon="repeat-outline" title="No routines yet" value="Saved routines will appear here." />

      <SectionHeader title="Workout log" />
      <FeatureCard icon="barbell-outline" title="No workouts logged" value="Logged sessions will appear here." />
    </Screen>
  );
}

function FeatureCard({
  icon,
  title,
  value
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
}) {
  return (
    <Card style={styles.card}>
      <Ionicons color={theme.colors.accent} name={icon} size={26} />
      <View style={styles.cardText}>
        <AppText variant="subheading">{title}</AppText>
        <AppText muted>{value}</AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  cardText: {
    flex: 1
  },
  subtitle: {
    marginTop: theme.spacing.xs
  }
});
