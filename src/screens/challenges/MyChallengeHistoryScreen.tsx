import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import {
  challengeCategoryLabels,
  challengeMetricLabels,
  getMyChallengeHistory
} from "../../services/challengeService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { Challenge } from "../../types/challenges";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MyChallengeHistory">;

export function MyChallengeHistoryScreen({ navigation }: Props) {
  const authSession = useAuthSession();
  const [history, setHistory] = useState<Challenge[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadHistory() {
        setIsLoading(true);
        setErrorMessage(null);

        try {
          const rows = authSession.user ? await getMyChallengeHistory(authSession.user.id) : [];
          if (isActive) {
            setHistory(rows);
          }
        } catch (error) {
          if (isActive) {
            setErrorMessage(error instanceof Error ? error.message : "Challenge history failed to load.");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void loadHistory();

      return () => {
        isActive = false;
      };
    }, [authSession.user])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Challenge History</AppText>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={theme.colors.accent} />
        </Card>
      ) : null}

      {errorMessage ? (
        <Card>
          <AppText variant="subheading">History unavailable</AppText>
          <AppText muted style={styles.cardText}>
            {errorMessage}
          </AppText>
        </Card>
      ) : null}

      <SectionHeader title="Completed and Left" />
      {!isLoading && history.length === 0 ? (
        <Card>
          <AppText muted>Completed challenge history will appear after you finish or leave a challenge.</AppText>
        </Card>
      ) : (
        <View style={styles.stack}>
          {history.map((challenge) => (
            <Pressable
              key={challenge.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate("ChallengeDetail", { challengeId: challenge.id })}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card>
                <View style={styles.row}>
                  <View style={styles.iconBadge}>
                    <Ionicons color={theme.colors.accent} name="trophy-outline" size={18} />
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="subheading">{challenge.title}</AppText>
                    <AppText muted>
                      {challengeCategoryLabels[challenge.category]} - {challengeMetricLabels[challenge.metric]}
                    </AppText>
                    <AppText muted variant="caption">
                      Ended {formatDate(challenge.endsAt)}
                    </AppText>
                  </View>
                  <Ionicons color={theme.colors.accent} name="chevron-forward" size={20} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

const styles = StyleSheet.create({
  cardText: {
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
  iconBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  loadingCard: {
    alignItems: "center"
  },
  pressed: {
    opacity: 0.78
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  stack: {
    gap: theme.spacing.md
  }
});
