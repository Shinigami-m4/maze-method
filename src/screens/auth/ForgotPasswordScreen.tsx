import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { requestPasswordResetEmail } from "../../services/authService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export function ForgotPasswordScreen({ navigation }: Props) {
  const { isSupabaseConfigured } = useAuthSession();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceholderReset = async () => {
    if (!email.trim()) {
      Alert.alert("Email required", "Enter the email for your cloud account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await requestPasswordResetEmail(email);
      if (error) {
        Alert.alert("Reset placeholder", error.message);
        return;
      }

      Alert.alert("Reset email requested", "Add a Supabase redirect URL later to complete password updates in-app.");
    } catch (error) {
      Alert.alert("Cloud auth unavailable", error instanceof Error ? error.message : "Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton accessibilityLabel="Go back" icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.flex}>
          <AppText muted variant="caption">
            Maze Method Cloud
          </AppText>
          <AppText variant="heading">Forgot Password</AppText>
        </View>
      </View>
      <Card accent style={styles.heroCard}>
        <View style={styles.iconRow}>
          <Ionicons color={theme.colors.accent} name="help-circle-outline" size={26} />
          <View style={styles.flex}>
            <AppText variant="subheading">Password reset placeholder</AppText>
            <AppText muted>
              Version 2A can request a Supabase reset email. A full in-app password update flow needs a configured redirect URL later.
            </AppText>
          </View>
        </View>
      </Card>
      <Card style={styles.formCard}>
        <View style={styles.stack}>
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Email"
            onChangeText={setEmail}
            placeholder="you@example.com"
            value={email}
          />
          <PrimaryButton
            disabled={!isSupabaseConfigured || isSubmitting}
            icon="mail-outline"
            label={isSubmitting ? "Requesting" : "Request Reset Email"}
            onPress={() => void handlePlaceholderReset()}
          />
        </View>
      </Card>
      {!isSupabaseConfigured ? (
        <Card style={styles.noticeCard}>
          <AppText variant="subheading">Supabase not configured</AppText>
          <AppText muted>Password reset stays disabled until cloud auth environment variables are set.</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  formCard: {
    marginTop: theme.spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  heroCard: {
    marginTop: theme.spacing.lg
  },
  iconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  noticeCard: {
    marginTop: theme.spacing.md
  },
  stack: {
    gap: theme.spacing.md
  }
});

