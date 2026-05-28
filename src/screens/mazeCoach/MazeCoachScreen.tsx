import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { Screen } from "../../components/Screen";
import { getUserProfile } from "../../database/profileRepository";
import {
  getMazeCoachRecommendation,
  MazeCoachRecommendation
} from "../../services/mazeCoach/mockMazeCoach";
import { theme } from "../../theme/theme";
import { UserProfile } from "../../types/models";
import { RootStackParamList } from "../../types/navigation";
import { formatFitnessGoal, formatMazeCoachTone } from "../../utils/labels";

type Props = NativeStackScreenProps<RootStackParamList, "MazeCoach">;

export function MazeCoachScreen({ navigation }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const recommendation: MazeCoachRecommendation = getMazeCoachRecommendation(profile);

  useEffect(() => {
    void getUserProfile().then(setProfile);
  }, []);

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
        <AppText style={styles.heroText} variant="heading">
          {recommendation.headline}
        </AppText>
        <AppText muted>
          {profile
            ? `${formatFitnessGoal(profile.fitnessGoal)} with ${formatMazeCoachTone(profile.mazeCoachTone).toLowerCase()} tone.`
            : "Local recommendations will sharpen after onboarding."}
        </AppText>
      </Card>

      <RecommendationCard title="Training focus" value={recommendation.trainingFocus} />
      <RecommendationCard title="Nutrition cue" value={recommendation.nutritionCue} />
      <RecommendationCard title="Recovery cue" value={recommendation.recoveryCue} />
    </Screen>
  );
}

function RecommendationCard({ title, value }: { title: string; value: string }) {
  return (
    <Card style={styles.recommendationCard}>
      <AppText muted variant="caption">
        {title}
      </AppText>
      <AppText style={styles.recommendationText} variant="subheading">
        {value}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
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
    marginTop: theme.spacing.md
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  recommendationCard: {
    marginTop: theme.spacing.md
  },
  recommendationText: {
    marginTop: theme.spacing.sm
  }
});
