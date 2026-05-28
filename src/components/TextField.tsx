import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { theme } from "../theme/theme";
import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label: string;
};

export function TextField({ label, style, ...inputProps }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={theme.colors.textSubtle}
        selectionColor={theme.colors.accent}
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
    minHeight: 48,
    paddingHorizontal: theme.spacing.md
  },
  wrapper: {
    gap: theme.spacing.xxs
  }
});
