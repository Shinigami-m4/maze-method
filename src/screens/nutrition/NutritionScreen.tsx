import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { theme } from "../../theme/theme";

export function NutritionScreen() {
  return (
    <Screen>
      <AppText variant="title">Nutrition</AppText>
      <AppText muted style={styles.subtitle}>
        Meals, macros, hydration, and dietary preferences.
      </AppText>

      <SectionHeader title="Daily macros" />
      <Card>
        <View style={styles.metricRow}>
          <MacroMetric label="Calories" value="--" />
          <MacroMetric label="Protein" value="--" />
          <MacroMetric label="Carbs" value="--" />
          <MacroMetric label="Fat" value="--" />
        </View>
      </Card>

      <SectionHeader title="Meals" />
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="nutrition-outline" size={26} />
        <View style={styles.emptyText}>
          <AppText variant="subheading">No meals logged today</AppText>
          <AppText muted>Meal logs will update the macro summary.</AppText>
        </View>
      </Card>
    </Screen>
  );
}

function MacroMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText style={styles.metricValue} variant="heading">
        {value}
      </AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
    </View>
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
  metric: {
    flex: 1,
    minWidth: 70
  },
  metricRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  metricValue: {
    color: theme.colors.accent
  },
  subtitle: {
    marginTop: theme.spacing.xs
  }
});
