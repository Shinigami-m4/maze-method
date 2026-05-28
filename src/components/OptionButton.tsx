import React from "react";
import { Pressable, StyleSheet } from "react-native";

import { theme } from "../theme/theme";
import { AppText } from "./AppText";

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
};

export function OptionButton({ label, selected, onPress, description }: OptionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.selected,
        pressed && styles.pressed
      ]}
    >
      <AppText variant="subheading">{label}</AppText>
      {description ? (
        <AppText muted style={styles.description}>
          {description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: theme.spacing.xxs
  },
  option: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: theme.spacing.md
  },
  pressed: {
    opacity: 0.78
  },
  selected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  }
});
