import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { getLocalProfileId, getUserProfile, saveUserProfile } from "../../database/profileRepository";
import { useAuthSession } from "../../services/authSessionContext";
import { syncLocalReminderNotifications } from "../../services/reminderService";
import {
  CloudSyncState,
  getCloudSyncState,
  markFirstBackupPrompted,
  runCloudSync
} from "../../services/syncService";
import {
  getLocalReminderSettings,
  saveLocalReminderSettings,
  saveMazeCoachTone,
  saveUnitPreference
} from "../../storage/settingsStorage";
import { activityLevelOptions, experienceOptions, fitnessGoalOptions, mazeCoachToneOptions, trainingLocationOptions, unitOptions } from "../../data/onboardingOptions";
import { theme } from "../../theme/theme";
import {
  ActivityLevel,
  ExperienceLevel,
  FitnessGoal,
  MazeCoachTone,
  TrainingLocation,
  UnitPreference,
  UserProfile
} from "../../types/models";
import { RootStackParamList } from "../../types/navigation";
import {
  LocalReminderSettings,
  recommendedReminderSettings,
  ReminderChannelKey,
  reminderChannelLabels,
  weekDayOptions
} from "../../types/reminders";
import {
  formatActivityLevel,
  formatExperience,
  formatFitnessGoal,
  formatMazeCoachTone,
  formatTrainingLocation,
  formatUnits
} from "../../utils/labels";
import { SettingsField } from "./components/SettingsField";
import { SettingsModal } from "./components/SettingsModal";

type Props = NativeStackScreenProps<RootStackParamList, "SettingsProfile">;

type ProfileDraft = {
  name: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goalWeight: string;
};

type GoalsDraft = {
  fitnessGoal: FitnessGoal;
  experienceLevel: ExperienceLevel;
  trainingLocation: TrainingLocation;
  daysPerWeek: number;
  dietaryPreference: string;
  activityLevel: ActivityLevel;
};

const reminderKeys: ReminderChannelKey[] = ["workout", "meal", "progressPhoto"];
const daysPerWeekOptions = [1, 2, 3, 4, 5, 6, 7];

export function SettingsProfileScreen({ navigation }: Props) {
  const authSession = useAuthSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reminders, setReminders] = useState<LocalReminderSettings | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft | null>(null);
  const [goalsDraft, setGoalsDraft] = useState<GoalsDraft | null>(null);
  const [unitDraft, setUnitDraft] = useState<UnitPreference | null>(null);
  const [toneDraft, setToneDraft] = useState<MazeCoachTone | null>(null);
  const [reminderDraft, setReminderDraft] = useState<LocalReminderSettings | null>(null);
  const [syncState, setSyncState] = useState<CloudSyncState>({ errors: [] });
  const [isSyncing, setIsSyncing] = useState(false);

  const loadSettings = useCallback(async () => {
    const [storedProfile, storedReminders, storedSyncState] = await Promise.all([
      getUserProfile(),
      getLocalReminderSettings(),
      getCloudSyncState()
    ]);
    setProfile(storedProfile);
    setReminders(storedReminders);
    setSyncState(storedSyncState);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings])
  );

  const handleSaveProfile = async () => {
    if (!profileDraft) {
      return;
    }

    const baseProfile = createBaseProfile(profile);
    const nextProfile: UserProfile = {
      ...baseProfile,
      name: profileDraft.name.trim() || "Athlete",
      age: parseOptionalNumber(profileDraft.age),
      gender: profileDraft.gender.trim() || undefined,
      height: parseOptionalNumber(profileDraft.height),
      weight: parseOptionalNumber(profileDraft.weight),
      goalWeight: parseOptionalNumber(profileDraft.goalWeight),
      updatedAt: new Date().toISOString()
    };

    await saveUserProfile(nextProfile);
    setProfile(nextProfile);
    setProfileDraft(null);
  };

  const handleSaveGoals = async () => {
    if (!goalsDraft) {
      return;
    }

    const baseProfile = createBaseProfile(profile);
    const nextProfile: UserProfile = {
      ...baseProfile,
      fitnessGoal: goalsDraft.fitnessGoal,
      experienceLevel: goalsDraft.experienceLevel,
      trainingLocation: goalsDraft.trainingLocation,
      daysPerWeek: goalsDraft.daysPerWeek,
      dietaryPreference: goalsDraft.dietaryPreference.trim() || "None",
      activityLevel: goalsDraft.activityLevel,
      updatedAt: new Date().toISOString()
    };

    await saveUserProfile(nextProfile);
    setProfile(nextProfile);
    setGoalsDraft(null);
  };

  const handleSaveUnits = async () => {
    if (!unitDraft) {
      return;
    }

    const nextProfile = {
      ...createBaseProfile(profile),
      units: unitDraft,
      updatedAt: new Date().toISOString()
    };

    await Promise.all([saveUserProfile(nextProfile), saveUnitPreference(unitDraft)]);
    setProfile(nextProfile);
    setUnitDraft(null);
  };

  const handleSaveTone = async () => {
    if (!toneDraft) {
      return;
    }

    const nextProfile = {
      ...createBaseProfile(profile),
      mazeCoachTone: toneDraft,
      updatedAt: new Date().toISOString()
    };

    await Promise.all([saveUserProfile(nextProfile), saveMazeCoachTone(toneDraft)]);
    setProfile(nextProfile);
    setToneDraft(null);
  };

  const handleSaveReminders = async () => {
    if (!reminderDraft) {
      return;
    }

    await saveLocalReminderSettings(reminderDraft);
    setReminders(reminderDraft);
    setReminderDraft(null);

    try {
      const result = await syncLocalReminderNotifications(reminderDraft);

      if (!result.granted) {
        Alert.alert("Notifications off", "Reminder settings were saved, but iOS notification permission is off.");
      }
    } catch {
      Alert.alert("Reminder sync failed", "Reminder settings were saved, but local notifications could not be scheduled.");
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign out?", "This signs out of cloud auth only. Local Maze Method data stays on this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void authSession.signOut().catch(() => {
            Alert.alert("Sign out failed", "Cloud auth could not sign out. Try again.");
          });
        }
      }
    ]);
  };

  const handleRunSync = useCallback(
    async (isFirstBackup = false) => {
      if (authSession.status !== "signed_in") {
        Alert.alert("Sign in required", "Sign in before syncing cloud data.");
        return;
      }

      setIsSyncing(true);
      try {
        const result = await runCloudSync({ isFirstBackup });
        const nextSyncState = await getCloudSyncState();
        setSyncState(nextSyncState);

        if (result.success) {
          Alert.alert("Sync complete", "Maze Method backed up and pulled cloud data.");
        } else {
          Alert.alert("Sync finished with issues", `${result.errors.length} sync issues were saved in Settings.`);
        }
      } catch (error) {
        Alert.alert("Sync unavailable", error instanceof Error ? error.message : "Try again when online.");
      } finally {
        setIsSyncing(false);
      }
    },
    [authSession.status]
  );

  useEffect(() => {
    if (
      authSession.status !== "signed_in" ||
      syncState.firstBackupPromptedAt ||
      syncState.firstBackupCompletedAt ||
      isSyncing
    ) {
      return;
    }

    void markFirstBackupPrompted().then(async () => {
      setSyncState(await getCloudSyncState());
      Alert.alert(
        "Back up local data?",
        "Maze Method can back up existing local data to your signed-in Supabase account. Local data stays on this phone either way.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "Back up now",
            onPress: () => {
              void handleRunSync(true);
            }
          }
        ]
      );
    });
  }, [
    authSession.status,
    handleRunSync,
    isSyncing,
    syncState.firstBackupCompletedAt,
    syncState.firstBackupPromptedAt
  ]);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <AppText variant="heading">Settings/Profile</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <SectionHeader title="Account" />
      <AccountStatusCard
        email={authSession.user?.email}
        isConfigured={authSession.isSupabaseConfigured}
        onSignIn={() => navigation.navigate("SignIn")}
        onSignOut={handleSignOut}
        onSignUp={() => navigation.navigate("SignUp")}
        onSyncNow={() => void handleRunSync(false)}
        syncState={syncState}
        isSyncing={isSyncing}
        status={authSession.status}
      />

      <SectionHeader title="Edit profile" />
      <SettingsActionCard
        icon="person-outline"
        title={profile?.name ?? "Athlete"}
        value={formatProfileSummary(profile)}
        actionLabel="Edit profile"
        onPress={() => setProfileDraft(createProfileDraft(profile))}
      />

      <SectionHeader title="Edit goals" />
      <SettingsActionCard
        icon="flag-outline"
        title={profile ? formatFitnessGoal(profile.fitnessGoal) : "Build muscle"}
        value={profile ? `${formatExperience(profile.experienceLevel)} - ${profile.daysPerWeek} days/week` : "Set training goal and experience."}
        actionLabel="Edit goals"
        onPress={() => setGoalsDraft(createGoalsDraft(profile))}
      />

      <SectionHeader title="Preferences" />
      <View style={styles.stack}>
        <SettingsActionCard
          icon="scale-outline"
          title="Change units"
          value={profile ? formatUnits(profile.units) : "lb / in"}
          actionLabel="Change units"
          onPress={() => setUnitDraft(profile?.units ?? "imperial")}
        />
        <SettingsActionCard
          icon="navigate-outline"
          title="Change Maze Coach tone"
          value={profile ? formatMazeCoachTone(profile.mazeCoachTone) : "Motivational but not corny"}
          actionLabel="Change tone"
          onPress={() => setToneDraft(profile?.mazeCoachTone ?? "motivational_not_corny")}
        />
      </View>

      <SectionHeader title="Manage reminders" />
      <SettingsActionCard
        icon="notifications-outline"
        title="Manage reminders"
        value={formatReminderSummary(reminders)}
        actionLabel="Manage reminders"
        onPress={() => setReminderDraft(cloneReminderSettings(reminders ?? recommendedReminderSettings))}
      />

      <SectionHeader title="Theme placeholder" />
      <PlaceholderCard
        icon="contrast-outline"
        title="Theme placeholder"
        value="Dark theme is active for version 1. Light mode can be added later."
      />

      <SectionHeader title="Data management placeholder" />
      <PlaceholderCard
        icon="server-outline"
        title="Data management placeholder"
        value="Data is local-first in SQLite and AsyncStorage. Export, reset, and cloud sync can be added later."
      />

      <SectionHeader title="Support" />
      <SettingsActionCard
        icon="help-circle-outline"
        title="Support"
        value="Email support@mazemethod.app for TestFlight issues. Placeholder address for release setup."
        actionLabel="Open support"
        onPress={() => navigation.navigate("Support")}
      />

      <ProfileModal
        draft={profileDraft}
        onChangeDraft={setProfileDraft}
        onClose={() => setProfileDraft(null)}
        onSave={() => void handleSaveProfile()}
        units={profile?.units ?? "imperial"}
      />
      <GoalsModal
        draft={goalsDraft}
        onChangeDraft={setGoalsDraft}
        onClose={() => setGoalsDraft(null)}
        onSave={() => void handleSaveGoals()}
      />
      <UnitsModal
        draft={unitDraft}
        onChangeDraft={setUnitDraft}
        onClose={() => setUnitDraft(null)}
        onSave={() => void handleSaveUnits()}
      />
      <ToneModal
        draft={toneDraft}
        onChangeDraft={setToneDraft}
        onClose={() => setToneDraft(null)}
        onSave={() => void handleSaveTone()}
      />
      <RemindersModal
        draft={reminderDraft}
        onChangeDraft={setReminderDraft}
        onClose={() => setReminderDraft(null)}
        onSave={() => void handleSaveReminders()}
      />
    </Screen>
  );
}

function SettingsActionCard({
  icon,
  title,
  value,
  actionLabel,
  onPress
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
  actionLabel: string;
  onPress: () => void;
}) {
  return (
    <Card>
      <View style={styles.cardTopRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons color={theme.colors.accent} name={icon} size={18} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">{title}</AppText>
            <AppText muted>{value}</AppText>
          </View>
        </View>
        <PrimaryButton label={actionLabel} onPress={onPress} variant="ghost" />
      </View>
    </Card>
  );
}

function AccountStatusCard({
  email,
  isConfigured,
  isSyncing,
  onSignIn,
  onSignOut,
  onSignUp,
  onSyncNow,
  syncState,
  status
}: {
  email?: string;
  isConfigured: boolean;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onSignUp: () => void;
  onSyncNow: () => void;
  syncState: CloudSyncState;
  status: string;
}) {
  const isSignedIn = status === "signed_in";
  const syncErrors = syncState.errors.slice(0, 3);

  return (
    <Card accent={isSignedIn}>
      <View style={styles.cardTopRow}>
        <View style={styles.titleRow}>
          <View style={styles.iconBadge}>
            <Ionicons color={theme.colors.accent} name="cloud-outline" size={18} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">{isSignedIn ? "Cloud account connected" : "Local mode active"}</AppText>
            <AppText muted>
              {isSignedIn
                ? email ?? "Signed in"
                : isConfigured
                  ? "Sign in or create an account to prepare for future cloud sync."
                  : "Supabase env vars are missing. Local tracking still works."}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.cloudStatusRow}>
        <AppText style={styles.cloudStatusText} variant="caption">
          {syncState.lastSyncedAt
            ? `Last synced ${formatSyncDate(syncState.lastSyncedAt)}`
            : "Cloud sync status: not synced yet"}
        </AppText>
      </View>
      {syncErrors.length > 0 ? (
        <View style={styles.syncErrorBox}>
          <AppText variant="caption">Sync issues</AppText>
          {syncErrors.map((error, index) => (
            <AppText key={`${error.table}-${error.localId ?? index}`} muted variant="caption">
              {error.table}: {error.message}
            </AppText>
          ))}
        </View>
      ) : null}
      <View style={styles.accountActions}>
        {isSignedIn ? (
          <>
            <PrimaryButton
              disabled={isSyncing}
              icon="cloud-upload-outline"
              label={isSyncing ? "Syncing" : "Sync Now"}
              onPress={onSyncNow}
            />
            <PrimaryButton icon="log-out-outline" label="Sign out" onPress={onSignOut} variant="ghost" />
          </>
        ) : (
          <>
            <PrimaryButton
              disabled={!isConfigured}
              icon="log-in-outline"
              label="Sign in"
              onPress={onSignIn}
            />
            <PrimaryButton
              disabled={!isConfigured}
              icon="person-add-outline"
              label="Sign up"
              onPress={onSignUp}
              variant="ghost"
            />
          </>
        )}
      </View>
    </Card>
  );
}

function PlaceholderCard({
  icon,
  title,
  value
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
}) {
  return (
    <Card style={styles.placeholderCard}>
      <Ionicons color={theme.colors.accent} name={icon} size={24} />
      <View style={styles.flex}>
        <AppText variant="subheading">{title}</AppText>
        <AppText muted>{value}</AppText>
      </View>
    </Card>
  );
}

function ProfileModal({
  draft,
  units,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: ProfileDraft | null;
  units: UnitPreference;
  onChangeDraft: (draft: ProfileDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<ProfileDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <SettingsModal visible={Boolean(draft)} title="Edit profile" onClose={onClose}>
      {draft ? (
        <>
          <SettingsField label="Name" onChangeText={(name) => updateDraft({ name })} value={draft.name} />
          <View style={styles.formGrid}>
            <SettingsField
              keyboardType="number-pad"
              label="Age"
              onChangeText={(age) => updateDraft({ age })}
              value={draft.age}
            />
            <SettingsField
              label="Gender"
              onChangeText={(gender) => updateDraft({ gender })}
              value={draft.gender}
            />
          </View>
          <View style={styles.formGrid}>
            <SettingsField
              keyboardType="decimal-pad"
              label={units === "metric" ? "Height (cm)" : "Height (in)"}
              onChangeText={(height) => updateDraft({ height })}
              value={draft.height}
            />
            <SettingsField
              keyboardType="decimal-pad"
              label={units === "metric" ? "Weight (kg)" : "Weight (lb)"}
              onChangeText={(weight) => updateDraft({ weight })}
              value={draft.weight}
            />
          </View>
          <SettingsField
            keyboardType="decimal-pad"
            label={units === "metric" ? "Goal weight (kg)" : "Goal weight (lb)"}
            onChangeText={(goalWeight) => updateDraft({ goalWeight })}
            value={draft.goalWeight}
          />
          <PrimaryButton icon="save-outline" label="Save profile" onPress={onSave} />
        </>
      ) : null}
    </SettingsModal>
  );
}

function GoalsModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: GoalsDraft | null;
  onChangeDraft: (draft: GoalsDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<GoalsDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <SettingsModal visible={Boolean(draft)} title="Edit goals" onClose={onClose}>
      {draft ? (
        <>
          <OptionGroup
            label="Fitness goal"
            options={fitnessGoalOptions}
            selectedValue={draft.fitnessGoal}
            onSelect={(fitnessGoal) => updateDraft({ fitnessGoal })}
          />
          <OptionGroup
            label="Experience"
            options={experienceOptions}
            selectedValue={draft.experienceLevel}
            onSelect={(experienceLevel) => updateDraft({ experienceLevel })}
          />
          <OptionGroup
            label="Training location"
            options={trainingLocationOptions}
            selectedValue={draft.trainingLocation}
            onSelect={(trainingLocation) => updateDraft({ trainingLocation })}
          />
          <AppText muted variant="caption">
            Days per week
          </AppText>
          <View style={styles.optionWrap}>
            {daysPerWeekOptions.map((day) => (
              <OptionPill
                key={day}
                label={String(day)}
                selected={draft.daysPerWeek === day}
                onPress={() => updateDraft({ daysPerWeek: day })}
              />
            ))}
          </View>
          <OptionGroup
            label="Activity level"
            options={activityLevelOptions}
            selectedValue={draft.activityLevel}
            onSelect={(activityLevel) => updateDraft({ activityLevel })}
          />
          <SettingsField
            label="Dietary preference"
            onChangeText={(dietaryPreference) => updateDraft({ dietaryPreference })}
            value={draft.dietaryPreference}
          />
          <PrimaryButton icon="save-outline" label="Save goals" onPress={onSave} />
        </>
      ) : null}
    </SettingsModal>
  );
}

function UnitsModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: UnitPreference | null;
  onChangeDraft: (draft: UnitPreference | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <SettingsModal visible={Boolean(draft)} title="Change units" onClose={onClose}>
      {draft ? (
        <>
          {unitOptions.map((option) => (
            <OptionPill
              key={option.value}
              label={option.label}
              selected={draft === option.value}
              onPress={() => onChangeDraft(option.value)}
            />
          ))}
          <PrimaryButton icon="save-outline" label="Save units" onPress={onSave} />
        </>
      ) : null}
    </SettingsModal>
  );
}

function ToneModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: MazeCoachTone | null;
  onChangeDraft: (draft: MazeCoachTone | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <SettingsModal visible={Boolean(draft)} title="Change Maze Coach tone" onClose={onClose}>
      {draft ? (
        <>
          {mazeCoachToneOptions.map((option) => (
            <OptionPill
              key={option.value}
              label={option.label}
              selected={draft === option.value}
              onPress={() => onChangeDraft(option.value)}
            />
          ))}
          <PrimaryButton icon="save-outline" label="Save tone" onPress={onSave} />
        </>
      ) : null}
    </SettingsModal>
  );
}

function RemindersModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: LocalReminderSettings | null;
  onChangeDraft: (draft: LocalReminderSettings | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateSchedule = (key: ReminderChannelKey, updates: Partial<LocalReminderSettings[ReminderChannelKey]>) => {
    onChangeDraft(draft ? { ...draft, [key]: { ...draft[key], ...updates } } : draft);
  };

  const toggleDay = (key: ReminderChannelKey, day: number) => {
    if (!draft) {
      return;
    }

    const currentDays = draft[key].days;
    const days = currentDays.includes(day)
      ? currentDays.filter((currentDay) => currentDay !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    updateSchedule(key, { days });
  };

  return (
    <SettingsModal visible={Boolean(draft)} title="Manage reminders" onClose={onClose}>
      {draft ? (
        <>
          <PrimaryButton
            icon="refresh-outline"
            label="Recommended defaults"
            onPress={() => onChangeDraft(cloneReminderSettings(recommendedReminderSettings))}
            variant="ghost"
          />
          {reminderKeys.map((key) => (
            <Card key={key}>
              <View style={styles.cardTopRow}>
                <View style={styles.flex}>
                  <AppText variant="subheading">{reminderChannelLabels[key]}</AppText>
                  <AppText muted>{formatDays(draft[key].days)} at {draft[key].time}</AppText>
                </View>
                <Switch
                  ios_backgroundColor={theme.colors.surfaceRaised}
                  onValueChange={(enabled) => updateSchedule(key, { enabled })}
                  thumbColor={theme.colors.text}
                  trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
                  value={draft[key].enabled}
                />
              </View>
              <SettingsField
                label="Time"
                onChangeText={(time) => updateSchedule(key, { time })}
                placeholder="18:00"
                value={draft[key].time}
              />
              <AppText muted variant="caption">
                Days
              </AppText>
              <View style={styles.optionWrap}>
                {weekDayOptions.map((day) => (
                  <OptionPill
                    key={day.value}
                    label={day.label}
                    selected={draft[key].days.includes(day.value)}
                    onPress={() => toggleDay(key, day.value)}
                  />
                ))}
              </View>
            </Card>
          ))}
          <PrimaryButton icon="save-outline" label="Save reminders" onPress={onSave} />
        </>
      ) : null}
    </SettingsModal>
  );
}

function OptionGroup<T extends string>({
  label,
  options,
  selectedValue,
  onSelect
}: {
  label: string;
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.stack}>
      <AppText muted variant="caption">
        {label}
      </AppText>
      <View style={styles.optionWrap}>
        {options.map((option) => (
          <OptionPill
            key={option.value}
            label={option.label}
            selected={selectedValue === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
    </View>
  );
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

function createBaseProfile(profile: UserProfile | null): UserProfile {
  if (profile) {
    return profile;
  }

  const now = new Date().toISOString();

  return {
    id: getLocalProfileId(),
    name: "Athlete",
    units: "imperial",
    fitnessGoal: "build_muscle",
    experienceLevel: "beginner",
    trainingLocation: "gym",
    daysPerWeek: 3,
    dietaryPreference: "None",
    activityLevel: "moderate",
    mazeCoachTone: "motivational_not_corny",
    createdAt: now,
    updatedAt: now
  };
}

function createProfileDraft(profile: UserProfile | null): ProfileDraft {
  const baseProfile = createBaseProfile(profile);

  return {
    name: baseProfile.name,
    age: formatOptionalNumber(baseProfile.age),
    gender: baseProfile.gender ?? "",
    height: formatOptionalNumber(baseProfile.height),
    weight: formatOptionalNumber(baseProfile.weight),
    goalWeight: formatOptionalNumber(baseProfile.goalWeight)
  };
}

function createGoalsDraft(profile: UserProfile | null): GoalsDraft {
  const baseProfile = createBaseProfile(profile);

  return {
    fitnessGoal: baseProfile.fitnessGoal,
    experienceLevel: baseProfile.experienceLevel,
    trainingLocation: baseProfile.trainingLocation,
    daysPerWeek: baseProfile.daysPerWeek,
    dietaryPreference: baseProfile.dietaryPreference,
    activityLevel: baseProfile.activityLevel
  };
}

function cloneReminderSettings(settings: LocalReminderSettings): LocalReminderSettings {
  return {
    workout: { ...settings.workout, days: [...settings.workout.days] },
    meal: { ...settings.meal, days: [...settings.meal.days] },
    progressPhoto: { ...settings.progressPhoto, days: [...settings.progressPhoto.days] }
  };
}

function formatProfileSummary(profile: UserProfile | null) {
  if (!profile) {
    return "Edit personal info, height, weight, and goal weight.";
  }

  const height = profile.height ? `${profile.height}` : "--";
  const weight = profile.weight ? `${profile.weight}` : "--";
  return `${formatUnits(profile.units)} - height ${height} - weight ${weight}`;
}

function formatReminderSummary(settings: LocalReminderSettings | null) {
  if (!settings) {
    return "Recommended reminder settings available.";
  }

  const enabledCount = Object.values(settings).filter((schedule) => schedule.enabled).length;
  return `${enabledCount} reminders on - workouts, meals, and weekly photos.`;
}

function formatSyncDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatDays(days: number[]) {
  if (days.length === 7) {
    return "Every day";
  }

  return weekDayOptions
    .filter((day) => days.includes(day.value))
    .map((day) => day.label)
    .join(", ");
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatOptionalNumber(value?: number) {
  return typeof value === "number" ? String(value) : "";
}

const styles = StyleSheet.create({
  accountActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between"
  },
  cloudStatusRow: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  cloudStatusText: {
    color: theme.colors.accent
  },
  flex: {
    flex: 1
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  headerSpacer: {
    width: 40
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 38,
    justifyContent: "center",
    width: 38
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
  placeholderCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  pressed: {
    opacity: 0.72
  },
  stack: {
    gap: theme.spacing.md
  },
  syncErrorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: theme.colors.danger,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.xxs,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md
  },
  titleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
