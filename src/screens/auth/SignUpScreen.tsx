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
import { signUpWithEmail } from "../../services/authService";
import { useAuthSession } from "../../services/authSessionContext";
import { theme } from "../../theme/theme";
import { RootStackParamList } from "../../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;

export function SignUpScreen({ navigation }: Props) {
  const { isSupabaseConfigured, refreshSession } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Confirm the same password before creating an account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await signUpWithEmail({ email, password });
      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }

      await refreshSession();
      if (data.session) {
        navigation.goBack();
      } else {
        Alert.alert("Check your email", "Supabase may require email confirmation before sign in.");
        navigation.goBack();
      }
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
          <AppText variant="heading">Sign Up</AppText>
        </View>
      </View>
      <Card accent style={styles.heroCard}>
        <View style={styles.iconRow}>
          <Ionicons color={theme.colors.accent} name="person-add-outline" size={26} />
          <View style={styles.flex}>
            <AppText variant="subheading">Create a cloud account</AppText>
            <AppText muted>
              This prepares your local profile for future sync while Version 1 local storage remains active.
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
          <TextField
            label="Confirm password"
            onChangeText={setConfirmPassword}
            secureTextEntry
            value={confirmPassword}
          />
          <PrimaryButton
            disabled={!isSupabaseConfigured || isSubmitting}
            icon="person-add-outline"
            label={isSubmitting ? "Creating" : "Create Account"}
            onPress={() => void handleSignUp()}
          />
          <PrimaryButton
            icon="log-in-outline"
            label="Already Have Account"
            onPress={() => navigation.navigate("SignIn")}
            variant="ghost"
          />
        </View>
      </Card>
      {!isSupabaseConfigured ? (
        <Card style={styles.noticeCard}>
          <AppText variant="subheading">Supabase not configured</AppText>
          <AppText muted>Auth stays disabled until Expo public Supabase environment variables are set.</AppText>
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

