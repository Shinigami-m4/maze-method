import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

import { AppText } from "../../../components/AppText";
import { theme } from "../../../theme/theme";

type ProgressFieldProps = TextInputProps & {
  label: string;
};

export function ProgressField({ label, multiline, style, ...inputProps }: ProgressFieldProps) {
  return (
    <View style={styles.wrapper}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <TextInput
        multiline={multiline}
        placeholderTextColor={theme.colors.textSubtle}
        selectionColor={theme.colors.accent}
        style={[styles.input, multiline && styles.multiline, style]}
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
    fontSize: 15,
    fontWeight: "600",
    minHeight: 46,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  multiline: {
    minHeight: 88,
    textAlignVertical: "top"
  },
  wrapper: {
    flexBasis: 140,
    flexGrow: 1,
    gap: theme.spacing.xs
  }
});
