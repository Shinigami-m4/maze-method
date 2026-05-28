import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";
import { AppText } from "./AppText";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: IconName;
  variant?: "filled" | "ghost";
  style?: ViewStyle;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  icon,
  variant = "filled",
  style
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "ghost" && styles.ghost,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style
      ]}
    >
      {icon ? <Ionicons color={theme.colors.text} name={icon} size={18} /> : null}
      <AppText style={styles.label} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg
  },
  disabled: {
    opacity: 0.45
  },
  ghost: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth
  },
  label: {
    textTransform: "uppercase"
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }]
  }
});
