import React from "react";
import { StyleSheet, View } from "react-native";

import { theme } from "../theme/theme";

type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.max(0, Math.min(value, 1)) * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: "100%"
  },
  track: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radii.pill,
    height: 5,
    overflow: "hidden"
  }
});
