import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { MazeMethodLogo } from "../../components/brand/MazeMethodLogo";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { getUserProfile } from "../../database/profileRepository";
import {
  getMazeCoachRecommendation,
  MazeCoachRecommendation
} from "../../services/mazeCoachService";
import { theme } from "../../theme/theme";
import { UserProfile } from "../../types/models";
import {
  BottomTabParamList,
  RootStackParamList
} from "../../types/navigation";

type Props = BottomTabScreenProps<BottomTabParamList, "Home">;

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendation, setRecommendation] = useState<MazeCoachRecommendation | null>(null);
  const rootNavigation = navigation.getParent<RootNavigation>();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      void Promise.all([getUserProfile(), getMazeCoachRecommendation({ saveToHistory: false })]).then(([storedProfile, nextRecommendation]) => {
        if (isActive) {
          setProfile(storedProfile);
          setRecommendation(nextRecommendation);
        }
      });

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <MazeMethodLogo markOnly size={34} />
            <AppText muted variant="caption">
              Every Rep Has Direction
            </AppText>
          </View>
          <AppText style={styles.greeting} variant="title">
            {profile?.name ? `Hi, ${profile.name}` : "Hi, Athlete"}
          </AppText>
        </View>
        <IconButton
          accessibilityLabel="Open settings"
          icon="settings-outline"
          onPress={() => rootNavigation?.navigate("SettingsProfile")}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => rootNavigation?.navigate("MazeCoach")}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card accent style={styles.coachCard}>
          <View style={styles.cardTopRow}>
          <View style={styles.iconDisc}>
            <Ionicons color={theme.colors.text} name="navigate" size={18} />
          </View>
          <AppText variant="caption">Maze Coach Card</AppText>
        </View>
        <AppText style={styles.cardHeadline} variant="heading">
          {recommendation?.headline ?? "Your local path is loading."}
        </AppText>
        <AppText muted>Open Maze Coach Recommendations.</AppText>
        </Card>
      </Pressable>

      <Card style={styles.pathCard}>
        <View style={styles.cardTopRow}>
          <AppText variant="caption">Today's Path</AppText>
          <Ionicons color={theme.colors.accent} name="arrow-up" size={18} />
        </View>
        <AppText style={styles.cardHeadline} variant="heading">
          {recommendation?.suggestedWorkout ?? "Strength first, nutrition logged, progress captured."}
        </AppText>
        <AppText muted>
          Keep one clear priority per category and let the week build from there.
        </AppText>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => rootNavigation?.navigate("ChallengesHome")}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Card style={styles.pathCard}>
          <View style={styles.cardTopRow}>
            <AppText variant="caption">Challenges</AppText>
            <Ionicons color={theme.colors.accent} name="trophy-outline" size={18} />
          </View>
          <AppText style={styles.cardHeadline} variant="heading">
            Compete on synced workouts, cardio, nutrition, and streaks.
          </AppText>
          <AppText muted>
            Join public challenges or create private tests with friends.
          </AppText>
        </Card>
      </Pressable>

      <SectionHeader title="Today" />
      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <AppText muted variant="caption">
            Macros
          </AppText>
          <AppText style={styles.metricText} variant="heading">
            {recommendation ? recommendation.dailyCalories : "--"}
          </AppText>
          <AppText muted>
            {recommendation ? `${recommendation.dailyProtein}g protein target.` : "No meals logged today."}
          </AppText>
        </Card>
        <Card style={styles.summaryCard}>
          <AppText muted variant="caption">
            Streak
          </AppText>
          <AppText style={styles.metricText} variant="heading">
            0
          </AppText>
          <AppText muted>Start with the next logged session.</AppText>
        </Card>
      </View>

      <Card>
        <View style={styles.cardTopRow}>
          <AppText variant="subheading">Weekly progress photo</AppText>
          <Ionicons color={theme.colors.accent} name="camera-outline" size={20} />
        </View>
        <AppText muted style={styles.cardText}>
          Save a consistent front, side, and back photo each week.
        </AppText>
      </Card>

      <SectionHeader title="Quick actions" />
      <View style={styles.actionsGrid}>
        <PrimaryButton
          icon="barbell-outline"
          label="Workout"
          onPress={() => navigation.navigate("Workouts")}
          variant="ghost"
        />
        <PrimaryButton
          icon="nutrition-outline"
          label="Meal"
          onPress={() => navigation.navigate("Nutrition")}
          variant="ghost"
        />
        <PrimaryButton
          icon="scale-outline"
          label="Weight"
          onPress={() => navigation.navigate("Progress")}
          variant="ghost"
        />
        <PrimaryButton
          icon="walk-outline"
          label="Cardio"
          onPress={() => navigation.navigate("Calendar")}
          variant="ghost"
        />
      </View>

      <Card style={styles.quoteCard}>
        <AppText muted variant="caption">
          Direction
        </AppText>
        <AppText style={styles.quoteText} variant="subheading">
          "Repeatable beats dramatic."
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  cardHeadline: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  cardText: {
    marginTop: theme.spacing.sm
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  coachCard: {
    marginTop: theme.spacing.xl
  },
  greeting: {
    marginTop: theme.spacing.xs
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  metricText: {
    color: theme.colors.accent,
    marginVertical: theme.spacing.sm
  },
  pathCard: {
    marginTop: theme.spacing.md
  },
  pressed: {
    opacity: 0.78
  },
  quoteCard: {
    marginTop: theme.spacing.lg
  },
  quoteText: {
    marginTop: theme.spacing.sm
  },
  summaryCard: {
    flex: 1,
    minWidth: 150
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  }
});
