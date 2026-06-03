import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { initializeDatabase } from "./src/database/initializeDatabase";
import { configureLocalNotifications } from "./src/services/reminderService";
import { getOnboardingCompleted } from "./src/storage/settingsStorage";
import { colors } from "./src/theme/colors";

configureLocalNotifications();

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const bootApp = async () => {
      try {
        // SQLite is initialized before navigation so every screen can safely read local data.
        await initializeDatabase();
        const completed = await getOnboardingCompleted();
        setIsOnboardingComplete(completed);
      } finally {
        setIsBooting(false);
      }
    };

    void bootApp();
  }, []);

  if (isBooting) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator
        isOnboardingComplete={isOnboardingComplete}
        onOnboardingComplete={() => setIsOnboardingComplete(true)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  }
});
