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
import { signInWithEmail } from "../../services/authService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export function SignInScreen({ navigation }: Props) {
  const { isSupabaseConfigured, refreshSession } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmail({ email, password });
      if (error) {
        Alert.alert("Sign in failed", error.message);
        return;
      }

      await refreshSession();
      navigation.goBack();
    } catch (error) {
      Alert.alert("Cloud auth unavailable", error instanceof Error ? error.message : "Try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen>
      <AuthHeader title="Sign In" onBack={() => navigation.goBack()} />
      <Card accent style={styles.heroCard}>
        <View style={styles.iconRow}>
          <Ionicons color={theme.colors.accent} name="cloud-outline" size={26} />
          <View style={styles.flex}>
            <AppText variant="subheading">Optional cloud account</AppText>
            <AppText muted>
              Sign in to prepare Maze Method for future sync. Local tracking still works without an account.
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
          <TextField
            label="Password"
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <PrimaryButton
            disabled={!isSupabaseConfigured || isSubmitting}
            icon="log-in-outline"
            label={isSubmitting ? "Signing In" : "Sign In"}
            onPress={() => void handleSignIn()}
          />
          <PrimaryButton
            icon="person-add-outline"
            label="Create Account"
            onPress={() => navigation.navigate("SignUp")}
            variant="ghost"
          />
          <PrimaryButton
            icon="help-circle-outline"
            label="Forgot Password"
            onPress={() => navigation.navigate("ForgotPassword")}
            variant="ghost"
          />
        </View>
      </Card>
      {!isSupabaseConfigured ? <ConfigurationNotice /> : null}
    </Screen>
  );
}

function AuthHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <IconButton accessibilityLabel="Go back" icon="chevron-back" onPress={onBack} />
      <View style={styles.flex}>
        <AppText muted variant="caption">
          Maze Method Cloud
        </AppText>
        <AppText variant="heading">{title}</AppText>
      </View>
    </View>
  );
}

function ConfigurationNotice() {
  return (
    <Card style={styles.noticeCard}>
      <AppText variant="subheading">Supabase not configured</AppText>
      <AppText muted>
        Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a local .env file to test auth.
      </AppText>
    </Card>
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

