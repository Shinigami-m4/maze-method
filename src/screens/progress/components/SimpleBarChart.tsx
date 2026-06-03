import React from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../../components/AppText";
import { theme } from "../../../theme/theme";
import { ChartPoint } from "../../../types/progress";

type SimpleBarChartProps = {
  points: ChartPoint[];
  emptyLabel: string;
  valueFormatter?: (value: number) => string;
  maxBars?: number;
};

export function SimpleBarChart({
  points,
  emptyLabel,
  valueFormatter = (value) => `${Math.round(value)}`,
  maxBars = 8
}: SimpleBarChartProps) {
  // A simple native bar chart avoids adding a charting dependency while still showing trends clearly.
  const visiblePoints = points.slice(-maxBars);
  const maxValue = Math.max(...visiblePoints.map((point) => point.value), 1);

  if (visiblePoints.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <AppText muted>{emptyLabel}</AppText>
      </View>
    );
  }

  return (
    <View style={styles.chart}>
      {visiblePoints.map((point) => {
        const heightPercent = Math.max(6, Math.min(100, (point.value / maxValue) * 100));

        return (
          <View key={point.id ?? `${point.date}-${point.label}`} style={styles.column}>
            <View style={styles.barTrack}>
              <View style={[styles.bar, { height: `${heightPercent}%` }]} />
            </View>
            <AppText numberOfLines={1} style={styles.valueLabel} variant="caption">
              {valueFormatter(point.value)}
            </AppText>
            <AppText numberOfLines={1} subtle style={styles.dateLabel} variant="caption">
              {point.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0
  },
  barTrack: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radii.pill,
    height: 116,
    overflow: "hidden",
    position: "relative",
    width: "100%"
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: 160
  },
  column: {
    alignItems: "center",
    flex: 1,
    gap: theme.spacing.xxs,
    minWidth: 24
  },
  dateLabel: {
    fontSize: 10,
    maxWidth: 48,
    textAlign: "center"
  },
  emptyChart: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 120,
    justifyContent: "center",
    padding: theme.spacing.md
  },
  valueLabel: {
    color: theme.colors.text,
    fontSize: 10,
    maxWidth: 56,
    textAlign: "center"
  }
});
