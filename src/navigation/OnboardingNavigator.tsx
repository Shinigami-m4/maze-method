import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { GoalsScreen } from "../screens/onboarding/GoalsScreen";
import { NutritionPreferencesScreen } from "../screens/onboarding/NutritionPreferencesScreen";
import { OnboardingProvider } from "../screens/onboarding/OnboardingContext";
import { PersonalInfoScreen } from "../screens/onboarding/PersonalInfoScreen";
import { ReminderPreferencesScreen } from "../screens/onboarding/ReminderPreferencesScreen";
import { TrainingPreferencesScreen } from "../screens/onboarding/TrainingPreferencesScreen";
import { WelcomeScreen } from "../screens/onboarding/WelcomeScreen";
import { OnboardingStackParamList } from "../types/navigation";
import { theme } from "../theme/theme";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

type OnboardingNavigatorProps = {
  onComplete: () => void;
};

export function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  return (
    <OnboardingProvider onComplete={onComplete}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false
        }}
      >
        <Stack.Screen component={WelcomeScreen} name="Welcome" />
        <Stack.Screen component={PersonalInfoScreen} name="PersonalInfo" />
        <Stack.Screen component={GoalsScreen} name="Goals" />
        <Stack.Screen component={TrainingPreferencesScreen} name="TrainingPreferences" />
        <Stack.Screen component={NutritionPreferencesScreen} name="NutritionPreferences" />
        <Stack.Screen component={ReminderPreferencesScreen} name="ReminderPreferences" />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
