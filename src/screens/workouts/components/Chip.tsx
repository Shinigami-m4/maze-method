import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { AppText } from "../../../components/AppText";
import { theme } from "../../../theme/theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText style={selected && styles.selectedText} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  pressed: {
    opacity: 0.75
  },
  selected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  selectedText: {
    color: theme.colors.text
  }
});
