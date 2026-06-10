import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { TextField } from "../../components/TextField";
import {
  challengeCategoryLabels,
  challengeMetricLabels,
  challengeVisibilityLabels,
  createChallenge
} from "../../services/challengeService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import {
  ChallengeCategory,
  ChallengeMetric,
  ChallengeVisibility,
  CreateChallengeInput
} from "../../types/challenges";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateChallenge">;

const categoryOptions: ChallengeCategory[] = ["lifting", "cardio", "nutrition", "consistency"];
const metricOptions: ChallengeMetric[] = [
  "total_volume",
  "max_weight",
  "workout_count",
  "cardio_minutes",
  "cardio_distance",
  "protein_goal_days",
  "streak_days"
];
const visibilityOptions: ChallengeVisibility[] = ["public", "friends_only", "invite_only"];

export function CreateChallengeScreen({ navigation }: Props) {
  const authSession = useAuthSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ChallengeCategory>("lifting");
  const [metric, setMetric] = useState<ChallengeMetric>("total_volume");
  const [visibility, setVisibility] = useState<ChallengeVisibility>("invite_only");
  const [lengthDays, setLengthDays] = useState(14);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (!authSession.user) {
      Alert.alert("Sign in required", "Sign in before creating a challenge.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Add a short challenge name.");
      return;
    }

    const input = buildChallengeInput({
      title,
      description,
      category,
      metric,
      visibility,
      lengthDays
    });

    setIsSaving(true);
    try {
      const challenge = await createChallenge(input, authSession.user.id);
      navigation.replace("ChallengeDetail", { challengeId: challenge.id });
    } catch (error) {
      Alert.alert("Create failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Create Challenge</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <Card accent>
        <View style={styles.titleRow}>
          <View style={styles.iconDisc}>
            <Ionicons color={theme.colors.text} name="lock-closed-outline" size={20} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">Private by default</AppText>
            <AppText muted>
              Invite-only keeps early testing focused while friend invites are still a placeholder.
            </AppText>
          </View>
        </View>
      </Card>

      <SectionHeader title="Basics" />
      <View style={styles.stack}>
        <TextField label="Challenge name" onChangeText={setTitle} value={title} />
        <TextField
          label="Description"
          multiline
          onChangeText={setDescription}
          style={styles.descriptionInput}
          value={description}
        />
      </View>

      <SectionHeader title="Category" />
      <OptionWrap>
        {categoryOptions.map((option) => (
          <OptionPill
            key={option}
            label={challengeCategoryLabels[option]}
            selected={category === option}
            onPress={() => setCategory(option)}
          />
        ))}
      </OptionWrap>

      <SectionHeader title="Metric" />
      <OptionWrap>
        {metricOptions.map((option) => (
          <OptionPill
            key={option}
            label={challengeMetricLabels[option]}
            selected={metric === option}
            onPress={() => setMetric(option)}
          />
        ))}
      </OptionWrap>

      <SectionHeader title="Visibility" />
      <OptionWrap>
        {visibilityOptions.map((option) => (
          <OptionPill
            key={option}
            label={challengeVisibilityLabels[option]}
            selected={visibility === option}
            onPress={() => setVisibility(option)}
          />
        ))}
      </OptionWrap>

      <SectionHeader title="Length" />
      <OptionWrap>
        {[7, 14, 30].map((days) => (
          <OptionPill
            key={days}
            label={`${days} days`}
            selected={lengthDays === days}
            onPress={() => setLengthDays(days)}
          />
        ))}
      </OptionWrap>

      <PrimaryButton
        disabled={isSaving}
        icon="add-circle-outline"
        label={isSaving ? "Creating" : "Create challenge"}
        onPress={handleCreate}
        style={styles.createButton}
      />
    </Screen>
  );
}

function OptionWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.optionWrap}>{children}</View>;
}

function OptionPill({
  label,
  selected,
  onPress
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionPill,
        selected && styles.optionPillSelected,
        pressed && styles.pressed
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

function buildChallengeInput({
  title,
  description,
  category,
  metric,
  visibility,
  lengthDays
}: {
  title: string;
  description: string;
  category: ChallengeCategory;
  metric: ChallengeMetric;
  visibility: ChallengeVisibility;
  lengthDays: number;
}): CreateChallengeInput {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + lengthDays - 1);

  return {
    title,
    description,
    category,
    metric,
    visibility,
    startsAt: start.toISOString(),
    endsAt: end.toISOString()
  };
}

const styles = StyleSheet.create({
  createButton: {
    marginTop: theme.spacing.xl
  },
  descriptionInput: {
    minHeight: 92,
    paddingVertical: theme.spacing.sm,
    textAlignVertical: "top"
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
  iconDisc: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  optionPill: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  optionPillSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  pressed: {
    opacity: 0.72
  },
  stack: {
    gap: theme.spacing.md
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
