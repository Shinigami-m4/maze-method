import React from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { theme } from "../../theme/theme";
import { OnboardingStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <Screen contentContainerStyle={styles.container}>
      <View>
        <View style={styles.logoMark}>
          <View style={[styles.pathSegment, styles.pathLeft]} />
          <View style={[styles.pathSegment, styles.pathCenter]} />
          <View style={[styles.pathSegment, styles.pathRight]} />
        </View>
        <AppText style={styles.brand} variant="title">
          Maze Method
        </AppText>
        <AppText muted style={styles.tagline}>
          Every Rep Has Direction
        </AppText>
      </View>

      <Card accent style={styles.card}>
        <AppText variant="heading">Build a clearer fitness path.</AppText>
        <AppText muted style={styles.cardText}>
          Track training, nutrition, progress photos, body metrics, cardio, and local Maze Coach guidance from one focused system.
        </AppText>
      </Card>

      <PrimaryButton
        icon="arrow-forward"
        label="Start"
        onPress={() => navigation.navigate("PersonalInfo")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    marginTop: theme.spacing.lg
  },
  card: {
    marginVertical: theme.spacing.xxl
  },
  cardText: {
    marginTop: theme.spacing.sm
  },
  container: {
    justifyContent: "center"
  },
  logoMark: {
    height: 80,
    position: "relative",
    width: 120
  },
  pathCenter: {
    left: 48,
    top: 13,
    transform: [{ rotate: "45deg" }]
  },
  pathLeft: {
    left: 20,
    top: 20,
    transform: [{ rotate: "-45deg" }]
  },
  pathRight: {
    left: 76,
    top: 10,
    transform: [{ rotate: "-45deg" }]
  },
  pathSegment: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 10,
    position: "absolute",
    width: 56
  },
  tagline: {
    marginTop: theme.spacing.xs
  }
});
