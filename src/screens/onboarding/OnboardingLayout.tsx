import React from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "../../components/AppText";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { theme } from "../../theme/theme";

type OnboardingLayoutProps = {
  title: string;
  subtitle: string;
  step: number;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  footer?: React.ReactNode;
};

const TOTAL_STEPS = 6;

export function OnboardingLayout({
  title,
  subtitle,
  step,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  footer
}: OnboardingLayoutProps) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View style={styles.top}>
        <AppText subtle variant="caption">
          Maze Method
        </AppText>
        <AppText style={styles.title} variant="title">
          {title}
        </AppText>
        <AppText muted>{subtitle}</AppText>
      </View>

      <View style={styles.progress}>
        <AppText subtle variant="caption">
          Step {step} of {TOTAL_STEPS}
        </AppText>
        <ProgressBar value={step / TOTAL_STEPS} />
      </View>

      <View style={styles.body}>{children}</View>

      {footer ?? (
        <View style={styles.footer}>
          {onBack ? <PrimaryButton label="Back" onPress={onBack} variant="ghost" /> : null}
          {onNext ? (
            <PrimaryButton
              disabled={nextDisabled}
              label={nextLabel}
              onPress={onNext}
              style={styles.nextButton}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl
  },
  container: {
    justifyContent: "space-between"
  },
  footer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xxl
  },
  nextButton: {
    flex: 1
  },
  progress: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl
  },
  title: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs
  },
  top: {
    marginTop: theme.spacing.xl
  }
});
