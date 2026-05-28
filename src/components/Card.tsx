import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { theme } from "../theme/theme";

type CardProps = {
  children: React.ReactNode;
  accent?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, accent = false, style }: CardProps) {
  return <View style={[styles.card, accent && styles.accentCard, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md
  },
  accentCard: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder
  }
});
