import React, { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { challengeMetricLabels, getChallengeById } from "../../services/challengeService";
import { getChallengeLeaderboard } from "../../services/leaderboardService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { Challenge, LeaderboardData } from "../../types/challenges";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ChallengeLeaderboard">;

export function ChallengeLeaderboardScreen({ navigation, route }: Props) {
  const authSession = useAuthSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>({ rows: [] });
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextChallenge = await getChallengeById(route.params.challengeId, authSession.user?.id);
      setChallenge(nextChallenge);
      setLeaderboard(
        nextChallenge
          ? await getChallengeLeaderboard(nextChallenge, authSession.user?.id)
          : { rows: [], errorMessage: "Challenge unavailable." }
      );
    } finally {
      setIsLoading(false);
    }
  }, [authSession.user?.id, route.params.challengeId]);

  useFocusEffect(
    useCallback(() => {
      void loadLeaderboard();
    }, [loadLeaderboard])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Leaderboard</AppText>
        <IconButton
          accessibilityLabel="Refresh leaderboard"
          icon="refresh"
          onPress={() => void loadLeaderboard()}
        />
      </View>

      <Card accent>
        <View style={styles.cardTopRow}>
          <View style={styles.iconDisc}>
            <Ionicons color={theme.colors.text} name="podium-outline" size={22} />
          </View>
          {isLoading ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
        </View>
        <AppText style={styles.title} variant="heading">
          {challenge?.title ?? "Challenge leaderboard"}
        </AppText>
        <AppText muted>
          {challenge ? challengeMetricLabels[challenge.metric] : "Refresh after challenge data loads."}
        </AppText>
      </Card>

      {leaderboard.errorMessage ? (
        <Card style={styles.noticeCard}>
          <AppText variant="subheading">Leaderboard limited</AppText>
          <AppText muted style={styles.cardText}>
            {leaderboard.errorMessage}
          </AppText>
        </Card>
      ) : null}

      {leaderboard.currentUserEntry ? (
        <>
          <SectionHeader title="Your Rank" />
          <LeaderboardRow row={leaderboard.currentUserEntry} />
        </>
      ) : null}

      <SectionHeader title="All Participants" />
      {leaderboard.rows.length === 0 ? (
        <Card>
          <AppText muted>No leaderboard entries yet. Join and refresh after logging data.</AppText>
        </Card>
      ) : (
        <View style={styles.stack}>
          {leaderboard.rows.map((row) => (
            <LeaderboardRow key={row.id} row={row} />
          ))}
        </View>
      )}

      <SectionHeader title="Score Rules" />
      <Card>
        <AppText muted>
          Scores are recalculated from local SQLite logs when this screen refreshes, then upserted to Supabase with a last updated timestamp.
        </AppText>
        <PrimaryButton
          icon="refresh-outline"
          label="Refresh scores"
          onPress={() => void loadLeaderboard()}
          style={styles.refreshButton}
          variant="ghost"
        />
      </Card>
    </Screen>
  );
}

function LeaderboardRow({ row }: { row: LeaderboardData["rows"][number] }) {
  return (
    <Card accent={row.isCurrentUser}>
      <View style={styles.row}>
        <View style={styles.rankBadge}>
          <AppText variant="caption">#{row.rank}</AppText>
        </View>
        <View style={styles.flex}>
          <AppText variant="subheading">{row.displayName}</AppText>
          <AppText muted variant="caption">
            Updated {formatDateTime(row.lastUpdated)}
          </AppText>
          {row.evidenceSummary ? (
            <AppText muted style={styles.evidence} variant="caption">
              {row.evidenceSummary}
            </AppText>
          ) : null}
        </View>
        <AppText style={styles.scoreText} variant="heading">
          {Math.round(row.score)}
        </AppText>
      </View>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

const styles = StyleSheet.create({
  cardText: {
    marginTop: theme.spacing.sm
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  evidence: {
    marginTop: theme.spacing.xs
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
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  noticeCard: {
    marginTop: theme.spacing.md
  },
  rankBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 42,
    justifyContent: "center",
    width: 48
  },
  refreshButton: {
    marginTop: theme.spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  scoreText: {
    color: theme.colors.accent
  },
  stack: {
    gap: theme.spacing.md
  },
  title: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md
  }
});
