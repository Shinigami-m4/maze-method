import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { getUserProfile } from "../../database/profileRepository";
import {
  getMazeCoachRecommendation,
  MazeCoachRecommendation
} from "../../services/mazeCoachService";
import { theme } from "../../theme/theme";
import { UserProfile } from "../../types/models";
import { RootStackParamList } from "../../types/navigation";
import { formatFitnessGoal } from "../../utils/labels";

type Props = NativeStackScreenProps<RootStackParamList, "MazeCoach">;

export function MazeCoachScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendation, setRecommendation] = useState<MazeCoachRecommendation | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void Promise.all([getUserProfile(), getMazeCoachRecommendation()]).then(
        ([storedProfile, nextRecommendation]) => {
          if (isActive) {
            setProfile(storedProfile);
            setRecommendation(nextRecommendation);
          }
        }
      );

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Maze Coach</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <Card accent style={styles.heroCard}>
        <View style={styles.iconDisc}>
          <Ionicons color={theme.colors.text} name="navigate" size={22} />
        </View>
        <AppText muted style={styles.cardGap} variant="caption">
          Maze Coach Recommendations
        </AppText>
        <AppText style={styles.heroText} variant="heading">
          {recommendation?.headline ?? "Building your local recommendation."}
        </AppText>
        <AppText muted>
          {profile
            ? `${formatFitnessGoal(profile.fitnessGoal)} plan - ${recommendation?.toneLabel ?? "Motivational but not corny"} tone.`
            : "Local recommendations sharpen after profile data is saved."}
        </AppText>
      </Card>

      <SectionHeader title="Daily Targets" />
      <Card>
        <View style={styles.metricGrid}>
          <Metric label="Calories" value={formatNumber(recommendation?.dailyCalories)} />
          <Metric label="Protein" value={formatNumber(recommendation?.dailyProtein, "g")} />
          <Metric label="Carbs" value={formatNumber(recommendation?.carbsTarget, "g")} />
          <Metric label="Fats" value={formatNumber(recommendation?.fatTarget, "g")} />
        </View>
      </Card>

      <SectionHeader title="Maze Coach Insights" />
      <RecommendationCard
        icon="barbell-outline"
        title="Suggested workout"
        value={recommendation?.suggestedWorkout ?? "Log recent workouts to sharpen this suggestion."}
      />
      <RecommendationCard
        icon="moon-outline"
        title="Recovery advice"
        value={recommendation?.recoveryAdvice ?? "Recovery advice will appear after the app loads local data."}
      />

      <Card style={styles.recommendationCard}>
        <View style={styles.cardTopRow}>
          <Ionicons color={theme.colors.accent} name="nutrition-outline" size={20} />
          <AppText variant="subheading">Suggested meals</AppText>
        </View>
        <View style={styles.listStack}>
          {(recommendation?.suggestedMeals ?? ["Protein-first meals will appear after local data loads."]).map(
            (meal) => (
              <View key={meal} style={styles.bulletRow}>
                <View style={styles.dot} />
                <AppText muted style={styles.flex}>
                  {meal}
                </AppText>
              </View>
            )
          )}
        </View>
      </Card>

      <Card style={styles.recommendationCard}>
        <AppText muted variant="caption">
          Why Maze Coach gave this recommendation
        </AppText>
        <AppText style={styles.explanationText}>
          {recommendation?.explanation ?? "Maze Coach is reading local profile, workout, and nutrition data."}
        </AppText>
      </Card>

      <Card style={styles.recommendationCard}>
        <AppText muted variant="caption">
          Maze Coach Insights
        </AppText>
        <View style={styles.listStack}>
          {(recommendation?.insights ?? ["No local insights yet."]).map((insight) => (
            <View key={insight} style={styles.bulletRow}>
              <View style={styles.dot} />
              <AppText muted style={styles.flex}>
                {insight}
              </AppText>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

function RecommendationCard({
  icon,
  title,
  value
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
}) {
  return (
    <Card style={styles.recommendationCard}>
      <View style={styles.cardTopRow}>
        <Ionicons color={theme.colors.accent} name={icon} size={20} />
        <AppText variant="subheading">{title}</AppText>
      </View>
      <AppText muted style={styles.recommendationText}>
        {value}
      </AppText>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText style={styles.metricValue} variant="heading">
        {value}
      </AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function formatNumber(value?: number, suffix = "") {
  return typeof value === "number" ? `${Math.round(value)}${suffix}` : "--";
}

const styles = StyleSheet.create({
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  cardGap: {
    marginTop: theme.spacing.md
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  dot: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 7,
    marginTop: 8,
    width: 7
  },
  explanationText: {
    marginTop: theme.spacing.sm
  },
  flex: {
    flex: 1
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.lg
  },
  headerSpacer: {
    width: 40
  },
  heroCard: {
    marginBottom: theme.spacing.md
  },
  heroText: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  listStack: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  metric: {
    flexBasis: 116,
    flexGrow: 1
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  metricValue: {
    color: theme.colors.accent
  },
  recommendationCard: {
    marginTop: theme.spacing.md
  },
  recommendationText: {
    marginTop: theme.spacing.sm
  }
});
