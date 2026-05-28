import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { CalendarScreen } from "../screens/calendar/CalendarScreen";
import { HomeScreen } from "../screens/home/HomeScreen";
import { MazeCoachScreen } from "../screens/mazeCoach/MazeCoachScreen";
import { NutritionScreen } from "../screens/nutrition/NutritionScreen";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { ProgressScreen } from "../screens/progress/ProgressScreen";
import { SettingsProfileScreen } from "../screens/settings/SettingsProfileScreen";
import { WorkoutsScreen } from "../screens/workouts/WorkoutsScreen";
import {
  BottomTabParamList,
  RootStackParamList
} from "../types/navigation";
import { theme } from "../theme/theme";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<BottomTabParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    border: theme.colors.border,
    card: theme.colors.background,
    primary: theme.colors.accent,
    text: theme.colors.text
  }
};

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const tabIcons: Record<keyof BottomTabParamList, { focused: IconName; default: IconName }> = {
  Home: { focused: "home", default: "home-outline" },
  Calendar: { focused: "calendar", default: "calendar-outline" },
  Workouts: { focused: "barbell", default: "barbell-outline" },
  Nutrition: { focused: "nutrition", default: "nutrition-outline" },
  Progress: { focused: "trending-up", default: "trending-up-outline" }
};

type AppNavigatorProps = {
  isOnboardingComplete: boolean;
  onOnboardingComplete: () => void;
};

export function AppNavigator({
  isOnboardingComplete,
  onOnboardingComplete
}: AppNavigatorProps) {
  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false
        }}
      >
        {!isOnboardingComplete ? (
          <RootStack.Screen name="Onboarding">
            {() => <OnboardingNavigator onComplete={onOnboardingComplete} />}
          </RootStack.Screen>
        ) : (
          <>
            <RootStack.Screen component={BottomTabs} name="MainTabs" />
            <RootStack.Screen component={SettingsProfileScreen} name="SettingsProfile" />
            <RootStack.Screen component={MazeCoachScreen} name="MazeCoach" />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

function BottomTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textSubtle,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700"
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icon = tabIcons[route.name][focused ? "focused" : "default"];
          return <Ionicons color={color} name={icon} size={size} />;
        }
      })}
    >
      <Tabs.Screen component={HomeScreen} name="Home" />
      <Tabs.Screen component={CalendarScreen} name="Calendar" />
      <Tabs.Screen component={WorkoutsScreen} name="Workouts" />
      <Tabs.Screen component={NutritionScreen} name="Nutrition" />
      <Tabs.Screen component={ProgressScreen} name="Progress" />
    </Tabs.Navigator>
  );
}
