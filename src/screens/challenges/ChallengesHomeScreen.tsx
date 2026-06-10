import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import {
  challengeCategoryLabels,
  challengeMetricLabels,
  getChallengeDashboard
} from "../../services/challengeService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { Challenge, ChallengeDashboardData } from "../../types/challenges";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ChallengesHome">;

export function ChallengesHomeScreen({ navigation }: Props) {
  const authSession = useAuthSession();
  const [dashboard, setDashboard] = useState<ChallengeDashboardData>({
    activeChallenges: [],
    discoverChallenges: [],
    completedChallenges: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadChallenges = useCallback(async () => {
    setIsLoading(true);
    try {
      setDashboard(await getChallengeDashboard(authSession.user?.id));
    } finally {
      setIsLoading(false);
    }
  }, [authSession.user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadChallenges();
    }, [loadChallenges])
  );

  const isSignedIn = authSession.status === "signed_in";

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Challenges</AppText>
        <IconButton
          accessibilityLabel="Create challenge"
          icon="add"
          onPress={() => navigation.navigate("CreateChallenge")}
        />
      </View>

      <Card accent>
        <View style={styles.heroTopRow}>
          <View style={styles.iconDisc}>
            <Ionicons color={theme.colors.text} name="trophy-outline" size={22} />
          </View>
          {isLoading ? <ActivityIndicator color={theme.colors.accent} size="small" /> : null}
        </View>
        <AppText style={styles.heroTitle} variant="heading">
          Social goals without clutter.
        </AppText>
        <AppText muted>
          Compete on clear metrics from synced workouts, cardio, nutrition, and consistency logs.
        </AppText>
        <View style={styles.actionRow}>
          <PrimaryButton
            icon="add-circle-outline"
            label="Create"
            onPress={() => navigation.navigate("CreateChallenge")}
          />
          <PrimaryButton
            icon="time-outline"
            label="History"
            onPress={() => navigation.navigate("MyChallengeHistory")}
            variant="ghost"
          />
        </View>
      </Card>

      {!isSignedIn ? (
        <Card style={styles.noticeCard}>
          <AppText variant="subheading">Cloud account required</AppText>
          <AppText muted style={styles.cardText}>
            Challenges use Supabase Auth and synced data so two testers can share leaderboards.
          </AppText>
          <PrimaryButton
            icon="log-in-outline"
            label="Sign in"
            onPress={() => navigation.navigate("SignIn")}
            style={styles.noticeButton}
          />
        </Card>
      ) : null}

      {dashboard.errorMessage ? (
        <Card style={styles.noticeCard}>
          <AppText variant="subheading">Challenge tables not ready</AppText>
          <AppText muted style={styles.cardText}>
            {dashboard.errorMessage}
          </AppText>
        </Card>
      ) : null}

      <SectionHeader title="Active Challenges" />
      <ChallengeList
        emptyText="Join or create a challenge to see it here."
        challenges={dashboard.activeChallenges}
        onPress={(challenge) => navigation.navigate("ChallengeDetail", { challengeId: challenge.id })}
      />

      <SectionHeader title="Discover" />
      <ChallengeList
        emptyText="No public challenges available yet."
        challenges={dashboard.discoverChallenges}
        onPress={(challenge) => navigation.navigate("ChallengeDetail", { challengeId: challenge.id })}
      />

      <SectionHeader title="Anti-cheat baseline" />
      <Card style={styles.stack}>
        <Bullet text="Scores use clear definitions like sets x reps x weight, cardio minutes, and protein target days." />
        <Bullet text="Leaderboard rows show last updated so edited logs are visible after refresh." />
        <Bullet text="Apple Health, GPS routes, and proof uploads are planned for later." />
      </Card>
    </Screen>
  );
}

function ChallengeList({
  challenges,
  emptyText,
  onPress
}: {
  challenges: Challenge[];
  emptyText: string;
  onPress: (challenge: Challenge) => void;
}) {
  if (challenges.length === 0) {
    return (
      <Card>
        <AppText muted>{emptyText}</AppText>
      </Card>
    );
  }

  return (
    <View style={styles.stack}>
      {challenges.map((challenge) => (
        <ChallengeCard key={challenge.id} challenge={challenge} onPress={() => onPress(challenge)} />
      ))}
    </View>
  );
}

function ChallengeCard({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.cardTopRow}>
          <View style={styles.flex}>
            <AppText variant="subheading">{challenge.title}</AppText>
            <AppText muted>
              {challengeCategoryLabels[challenge.category]} - {challengeMetricLabels[challenge.metric]}
            </AppText>
          </View>
          <Ionicons color={theme.colors.accent} name="chevron-forward" size={20} />
        </View>
        <View style={styles.metaRow}>
          <Meta label="Visibility" value={challenge.visibility.replace("_", " ")} />
          <Meta label="Participants" value={String(challenge.participantCount)} />
          <Meta label="Status" value={challenge.status} />
        </View>
      </Card>
    </Pressable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <AppText variant="caption">{value}</AppText>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.dot} />
      <AppText muted style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  bulletRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  cardText: {
    marginTop: theme.spacing.sm
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between"
  },
  dot: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 7,
    marginTop: 8,
    width: 7
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
  heroTitle: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  heroTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  metaPill: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    padding: theme.spacing.sm
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  noticeButton: {
    marginTop: theme.spacing.md
  },
  noticeCard: {
    marginTop: theme.spacing.md
  },
  pressed: {
    opacity: 0.78
  },
  stack: {
    gap: theme.spacing.md
  }
});
