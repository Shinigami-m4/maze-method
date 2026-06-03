import { FoodLookupProduct, MealCategory } from "./nutrition";

export type BottomTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Workouts: undefined;
  Nutrition: undefined;
  Progress: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  SettingsProfile: undefined;
  MazeCoach: undefined;
  BarcodeScanner: undefined;
  FoodConfirmation: {
    food: FoodLookupProduct;
    initialMealCategory?: MealCategory;
  };
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  PersonalInfo: undefined;
  Goals: undefined;
  TrainingPreferences: undefined;
  NutritionPreferences: undefined;
  ReminderPreferences: undefined;
};
