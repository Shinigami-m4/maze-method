import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { initializeDatabase } from "./src/database/initializeDatabase";
import { AuthSessionProvider } from "./src/services/authSessionContext";
import { StateCard } from "./src/components/StateCard";
import { configureLocalNotifications } from "./src/services/reminderService";
import {
  captureHandledError,
  initializeMonitoring,
  trackAppEvent
} from "./src/services/monitoringService";
import { getOnboardingCompleted } from "./src/storage/settingsStorage";
import { colors } from "./src/theme/colors";

configureLocalNotifications();
initializeMonitoring();

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const bootApp = useCallback(async () => {
    setIsBooting(true);
    setBootError(null);
    trackAppEvent("app_boot_started");

    try {
      // SQLite is initialized before navigation so every screen can safely read local data.
      // Cloud sync is intentionally not started here, which keeps launch local-first and fast.
      await initializeDatabase();
      const completed = await getOnboardingCompleted();
      setIsOnboardingComplete(completed);
      trackAppEvent("app_boot_completed");
    } catch (error) {
      captureHandledError("app_boot", error);
      trackAppEvent("app_boot_failed");
      setBootError(error instanceof Error ? error.message : "Maze Method could not start.");
    } finally {
      setIsBooting(false);
    }
  }, []);

  useEffect(() => {
    void bootApp();
  }, [bootApp]);

  if (isBooting) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.bootScreen}>
        <StateCard
          actionLabel="Retry"
          body={bootError}
          icon="alert-circle-outline"
          onAction={() => void bootApp()}
          style={styles.bootErrorCard}
          title="Maze Method could not start"
          variant="error"
        />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AuthSessionProvider>
        <AppNavigator
          isOnboardingComplete={isOnboardingComplete}
          onOnboardingComplete={() => setIsOnboardingComplete(true)}
        />
      </AuthSessionProvider>
    </>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  },
  bootErrorCard: {
    marginHorizontal: 24,
    maxWidth: 420
  }
});
