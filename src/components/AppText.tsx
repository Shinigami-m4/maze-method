import React from "react";
import { StyleProp, StyleSheet, Text, TextProps, TextStyle } from "react-native";

import { theme } from "../theme/theme";

type TextVariant = "title" | "heading" | "subheading" | "body" | "caption";

type AppTextProps = TextProps & {
  muted?: boolean;
  subtle?: boolean;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  children,
  muted = false,
  subtle = false,
  variant = "body",
  style,
  ...textProps
}: AppTextProps) {
  return (
    <Text
      {...textProps}
      style={[
        styles.base,
        styles[variant],
        muted && styles.muted,
        subtle && styles.subtle,
        style
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: theme.colors.text,
    fontFamily: "System"
  },
  title: theme.typography.title,
  heading: theme.typography.heading,
  subheading: theme.typography.subheading,
  body: theme.typography.body,
  caption: theme.typography.caption,
  muted: {
    color: theme.colors.textMuted
  },
  subtle: {
    color: theme.colors.textSubtle
  }
});
