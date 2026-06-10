import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
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
  challengeVisibilityLabels,
  getChallengeById,
  joinChallenge,
  leaveChallenge
} from "../../services/challengeService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { Challenge } from "../../types/challenges";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ChallengeDetail">;

export function ChallengeDetailScreen({ navigation, route }: Props) {
  const authSession = useAuthSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadChallenge = useCallback(async () => {
    setIsLoading(true);
    try {
      setChallenge(await getChallengeById(route.params.challengeId, authSession.user?.id));
    } finally {
      setIsLoading(false);
    }
  }, [authSession.user?.id, route.params.challengeId]);

  useFocusEffect(
    useCallback(() => {
      void loadChallenge();
    }, [loadChallenge])
  );

  const handleJoin = async () => {
    if (!authSession.user || !challenge) {
      Alert.alert("Sign in required", "Sign in before joining a challenge.");
      return;
    }

    setIsSaving(true);
    try {
      await joinChallenge(challenge.id, authSession.user.id);
      await loadChallenge();
    } catch (error) {
      Alert.alert("Join failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeave = async () => {
    if (!authSession.user || !challenge) {
      return;
    }

    setIsSaving(true);
    try {
      await leaveChallenge(challenge.id, authSession.user.id);
      await loadChallenge();
    } catch (error) {
      Alert.alert("Leave failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const showInvitePlaceholder = () => {
    Alert.alert(
      "Invite friends placeholder",
      "Friend invites will connect to friend_invites later. For now, use two signed-in test accounts and public or invite-only challenge rows."
    );
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Challenge</AppText>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.accent} />
        </Card>
      ) : null}

      {!isLoading && !challenge ? (
        <Card>
          <AppText variant="subheading">Challenge unavailable</AppText>
          <AppText muted style={styles.cardText}>
            The challenge could not be loaded. Confirm Supabase challenge tables exist.
          </AppText>
        </Card>
      ) : null}

      {challenge ? (
        <>
          <Card accent>
            <View style={styles.iconDisc}>
              <Ionicons color={theme.colors.text} name="trophy-outline" size={22} />
            </View>
            <AppText style={styles.title} variant="heading">
              {challenge.title}
            </AppText>
            <AppText muted>{challenge.description ?? "No description added."}</AppText>
            <View style={styles.actionRow}>
              {challenge.isJoined ? (
                <PrimaryButton
                  disabled={isSaving}
                  icon="exit-outline"
                  label="Leave"
                  onPress={handleLeave}
                  variant="ghost"
                />
              ) : (
                <PrimaryButton
                  disabled={isSaving}
                  icon="add-circle-outline"
                  label="Join"
                  onPress={handleJoin}
                />
              )}
              <PrimaryButton
                icon="podium-outline"
                label="Leaderboard"
                onPress={() => navigation.navigate("ChallengeLeaderboard", { challengeId: challenge.id })}
                variant="ghost"
              />
            </View>
          </Card>

          <SectionHeader title="Details" />
          <Card style={styles.grid}>
            <Metric label="Category" value={challengeCategoryLabels[challenge.category]} />
            <Metric label="Metric" value={challengeMetricLabels[challenge.metric]} />
            <Metric label="Visibility" value={challengeVisibilityLabels[challenge.visibility]} />
            <Metric label="Participants" value={String(challenge.participantCount)} />
            <Metric label="Start" value={formatDate(challenge.startsAt)} />
            <Metric label="End" value={formatDate(challenge.endsAt)} />
          </Card>

          <SectionHeader title="Invite" />
          <Card>
            <AppText variant="subheading">Invite friends placeholder</AppText>
            <AppText muted style={styles.cardText}>
              Invite-only and friends-only challenge visibility is modeled now. Friend search and invite delivery can be added later.
            </AppText>
            <PrimaryButton
              icon="person-add-outline"
              label="Invite placeholder"
              onPress={showInvitePlaceholder}
              style={styles.inviteButton}
              variant="ghost"
            />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <AppText variant="subheading">{value}</AppText>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  cardText: {
    marginTop: theme.spacing.sm
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
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
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  inviteButton: {
    marginTop: theme.spacing.md
  },
  loadingCard: {
    alignItems: "center"
  },
  metric: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 140,
    flexGrow: 1,
    padding: theme.spacing.md
  },
  title: {
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md
  }
});
