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
  Support: undefined;
  ChallengesHome: undefined;
  ChallengeDetail: { challengeId: string };
  CreateChallenge: undefined;
  ChallengeLeaderboard: { challengeId: string };
  MyChallengeHistory: undefined;
  MazeCoach: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  PersonalInfo: undefined;
  Goals: undefined;
  TrainingPreferences: undefined;
  NutritionPreferences: undefined;
  ReminderPreferences: undefined;
};
