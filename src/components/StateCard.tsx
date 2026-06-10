import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { theme } from "../theme/theme";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { PrimaryButton } from "./PrimaryButton";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type StateVariant = "empty" | "loading" | "error" | "offline" | "permission" | "info";

type StateCardProps = {
  title: string;
  body: string;
  actionLabel?: string;
  icon?: IconName;
  isLoading?: boolean;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: StateVariant;
};

const defaultIcons: Record<StateVariant, IconName> = {
  empty: "add-circle-outline",
  loading: "sync-outline",
  error: "alert-circle-outline",
  offline: "cloud-offline-outline",
  permission: "lock-closed-outline",
  info: "information-circle-outline"
};

/**
 * Shared production state card used for empty, loading, error, offline,
 * and permission-denied states. Keeping this reusable prevents each feature
 * screen from inventing a different release-state pattern.
 */
export function StateCard({
  title,
  body,
  actionLabel,
  icon,
  isLoading = false,
  onAction,
  style,
  variant = "info"
}: StateCardProps) {
  const iconName = icon ?? defaultIcons[variant];

  return (
    <Card
      accent={variant === "permission" || variant === "offline"}
      style={[styles.card, variant === "error" && styles.errorCard, style]}
    >
      <View style={styles.titleRow}>
        <View style={styles.iconBadge}>
          {isLoading ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            <Ionicons color={theme.colors.accent} name={iconName} size={22} />
          )}
        </View>
        <View style={styles.flex}>
          <AppText variant="subheading">{title}</AppText>
          <AppText muted>{body}</AppText>
        </View>
      </View>
      {actionLabel && onAction ? (
        <PrimaryButton
          icon="refresh-outline"
          label={actionLabel}
          onPress={onAction}
          style={styles.actionButton}
          variant="ghost"
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.md
  },
  card: {
    marginBottom: theme.spacing.md
  },
  errorCard: {
    borderColor: theme.colors.danger
  },
  flex: {
    flex: 1
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
