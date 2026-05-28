import React from "react";
import { StyleSheet, View } from "react-native";

import { theme } from "../theme/theme";
import { AppText } from "./AppText";

type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
};

export function SectionHeader({ title, eyebrow }: SectionHeaderProps) {
  return (
    <View style={styles.header}>
      {eyebrow ? (
        <AppText subtle style={styles.eyebrow} variant="caption">
          {eyebrow}
        </AppText>
      ) : null}
      <AppText variant="heading">{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    marginBottom: theme.spacing.xxs,
    textTransform: "uppercase"
  },
  header: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg
  }
});
