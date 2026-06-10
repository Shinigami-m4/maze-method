import React, { useCallback, useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { StateCard } from "../../components/StateCard";
import {
  deleteProgressPhoto,
  getProgressDashboard,
  saveBodyMeasurementEntry,
  saveBodyWeightEntry,
  saveManualPersonalRecord,
  saveProgressPhoto
} from "../../database/progressRepository";
import { getUnitPreference } from "../../storage/settingsStorage";
import { theme } from "../../theme/theme";
import { CardioLogEntry } from "../../types/calendarLogging";
import { BodyMeasurementEntry, PersonalRecord, ProgressPhoto, UnitPreference } from "../../types/models";
import {
  ChartPoint,
  ManualPersonalRecordInput,
  MeasurementType,
  measurementTypes,
  PersonalRecordSummary,
  ProgressDashboardData,
  ProgressDateRange,
  progressDateRanges,
  ProgressPhotoAngle,
  progressPhotoAngles
} from "../../types/progress";
import { ProgressField } from "./components/ProgressField";
import { ProgressModal } from "./components/ProgressModal";
import { SimpleBarChart } from "./components/SimpleBarChart";

type WeightDraft = {
  date: string;
  weight: string;
  notes: string;
};

type MeasurementDraft = {
  date: string;
  measurementType: MeasurementType;
  customMeasurementType: string;
  value: string;
  notes: string;
};

type PhotoDraft = {
  date: string;
  angle: ProgressPhotoAngle;
  localUri: string;
  notes: string;
};

type ComparisonDraft = {
  beforeId?: string;
  afterId?: string;
};

type PersonalRecordDraft = {
  exerciseName: string;
  recordType: PersonalRecord["recordType"];
  value: string;
  units: string;
  achievedAt: string;
  notes: string;
};

const recordTypeOptions: { label: string; value: PersonalRecord["recordType"] }[] = [
  { label: "Weight", value: "weight" },
  { label: "Reps", value: "reps" },
  { label: "Time", value: "time" },
  { label: "Distance", value: "distance" }
];

export function ProgressScreen() {
  const [selectedRange, setSelectedRange] = useState<ProgressDateRange>("90d");
  const [dashboard, setDashboard] = useState<ProgressDashboardData | null>(null);
  const [unitPreference, setUnitPreference] = useState<UnitPreference>("imperial");
  const [weightDraft, setWeightDraft] = useState<WeightDraft | null>(null);
  const [measurementDraft, setMeasurementDraft] = useState<MeasurementDraft | null>(null);
  const [photoDraft, setPhotoDraft] = useState<PhotoDraft | null>(null);
  const [comparisonDraft, setComparisonDraft] = useState<ComparisonDraft | null>(null);
  const [recordDraft, setRecordDraft] = useState<PersonalRecordDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoPermissionDenied, setPhotoPermissionDenied] = useState(false);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [nextDashboard, storedUnits] = await Promise.all([
        getProgressDashboard(selectedRange),
        getUnitPreference()
      ]);
      setDashboard(nextDashboard);
      setUnitPreference(storedUnits);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Progress data could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange]);

  useFocusEffect(
    useCallback(() => {
      void loadProgress();
    }, [loadProgress])
  );

  const weightUnitLabel = unitPreference === "metric" ? "kg" : "lb";
  const measurementUnitLabel = unitPreference === "metric" ? "cm" : "in";
  const weightPoints = useMemo(
    () => (dashboard ? dashboard.weightEntries.map(mapWeightToChartPoint) : []),
    [dashboard]
  );
  const cardioPoints = useMemo(
    () => (dashboard ? buildCardioPoints(dashboard.cardioSessions) : []),
    [dashboard]
  );
  const latestWeight = dashboard?.latestWeight;
  const weightDelta = dashboard ? getWeightDelta(dashboard.weightEntries) : undefined;
  const latestMacroPoint = dashboard?.macroPoints.at(-1);
  const latestStrengthPoint = dashboard?.strengthPoints.at(-1);
  const totalCardioMinutes =
    dashboard?.cardioSessions.reduce((sum, session) => sum + session.durationMinutes, 0) ?? 0;

  const handleSaveWeight = async () => {
    if (!weightDraft) {
      return;
    }

    const weight = parseOptionalNumber(weightDraft.weight);

    if (!isDateKey(weightDraft.date) || typeof weight !== "number") {
      Alert.alert("Weight entry needed", "Add a valid date and weight before saving.");
      return;
    }

    await saveBodyWeightEntry({
      date: weightDraft.date,
      weight,
      units: unitPreference,
      notes: weightDraft.notes.trim() || undefined
    });
    setWeightDraft(null);
    await loadProgress();
  };

  const handleSaveMeasurement = async () => {
    if (!measurementDraft) {
      return;
    }

    const value = parseOptionalNumber(measurementDraft.value);
    const measurementType =
      measurementDraft.measurementType === "Custom"
        ? measurementDraft.customMeasurementType.trim()
        : measurementDraft.measurementType;

    if (!isDateKey(measurementDraft.date) || !measurementType || typeof value !== "number") {
      Alert.alert("Measurement entry needed", "Add a valid date, measurement type, and value.");
      return;
    }

    await saveBodyMeasurementEntry({
      date: measurementDraft.date,
      measurementType,
      value,
      units: unitPreference,
      notes: measurementDraft.notes.trim() || undefined
    });
    setMeasurementDraft(null);
    await loadProgress();
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setPhotoPermissionDenied(true);
      return;
    }

    setPhotoPermissionDenied(false);

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: ["images"],
      quality: 0.75
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      const localUri = await copyPhotoIntoAppStorage(result.assets[0].uri);
      setPhotoDraft((draft) => ({
        ...(draft ?? createPhotoDraft()),
        localUri
      }));
    } catch {
      Alert.alert("Photo save failed", "The selected photo could not be copied into app storage.");
    }
  };

  const handleSavePhoto = async () => {
    if (!photoDraft) {
      return;
    }

    if (!isDateKey(photoDraft.date) || !photoDraft.localUri) {
      Alert.alert("Photo entry needed", "Choose a photo and add a valid date before saving.");
      return;
    }

    await saveProgressPhoto({
      date: photoDraft.date,
      angle: photoDraft.angle,
      localUri: photoDraft.localUri,
      notes: photoDraft.notes.trim() || undefined
    });
    setPhotoDraft(null);
    await loadProgress();
  };

  const deletePhotoAndRefresh = useCallback(async (photo: ProgressPhoto) => {
    await deleteProgressPhoto(photo.id);

    // The app keeps progress photos local by copying picked images into Expo document storage.
    if (FileSystem.documentDirectory && photo.localUri.startsWith(FileSystem.documentDirectory)) {
      await FileSystem.deleteAsync(photo.localUri, { idempotent: true }).catch(() => undefined);
    }

    await loadProgress();
  }, [loadProgress]);

  const handleDeletePhoto = useCallback((photo: ProgressPhoto) => {
    Alert.alert("Delete progress photo?", "This removes the photo entry from this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deletePhotoAndRefresh(photo);
        }
      }
    ]);
  }, [deletePhotoAndRefresh]);

  const handleSavePersonalRecord = async () => {
    if (!recordDraft) {
      return;
    }

    const value = parseOptionalNumber(recordDraft.value);

    if (!recordDraft.exerciseName.trim() || !isDateKey(recordDraft.achievedAt) || typeof value !== "number") {
      Alert.alert("Record entry needed", "Add an exercise name, date, and value before saving.");
      return;
    }

    const input: ManualPersonalRecordInput = {
      exerciseName: recordDraft.exerciseName.trim(),
      recordType: recordDraft.recordType,
      value,
      units: recordDraft.units.trim() || undefined,
      achievedAt: `${recordDraft.achievedAt}T12:00:00.000`,
      notes: recordDraft.notes.trim() || undefined
    };

    await saveManualPersonalRecord(input);
    setRecordDraft(null);
    await loadProgress();
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText muted variant="caption">
            Every Rep Has Direction
          </AppText>
          <AppText style={styles.title} variant="title">
            Progress
          </AppText>
          <AppText muted style={styles.subtitle}>
            Track weight, measurements, photos, strength, cardio, and records.
          </AppText>
        </View>
      </View>

      {isLoading ? (
        <StateCard
          body="Loading local charts, progress photos, measurements, and personal records."
          isLoading
          title="Loading progress"
          variant="loading"
        />
      ) : null}

      {errorMessage ? (
        <StateCard
          actionLabel="Retry"
          body={errorMessage}
          onAction={() => void loadProgress()}
          title="Progress data unavailable"
          variant="error"
        />
      ) : null}

      <Card accent style={styles.heroCard}>
        <View style={styles.metricGrid}>
          <Metric
            label="Current weight"
            value={latestWeight ? `${formatDecimal(latestWeight.weight)} ${weightUnitLabel}` : "--"}
          />
          <Metric
            label="Photos"
            value={`${dashboard?.photos.length ?? 0}`}
          />
          <Metric
            label="PRs"
            value={`${dashboard?.personalRecords.length ?? 0}`}
          />
        </View>
      </Card>

      <View style={styles.rangeRow}>
        {progressDateRanges.map((range) => (
          <OptionPill
            key={range.value}
            label={range.label}
            onPress={() => setSelectedRange(range.value)}
            selected={selectedRange === range.value}
          />
        ))}
      </View>

      <SectionHeader eyebrow="Charts" title="Performance Trends" />
      <View style={styles.stack}>
        <ChartCard
          actionLabel="Add"
          icon="scale-outline"
          onAction={() => setWeightDraft(createWeightDraft(latestWeight?.weight))}
          title="Weight Chart"
          value={latestWeight ? `${formatDecimal(latestWeight.weight)} ${weightUnitLabel}` : "No entries"}
          valueNote={
            typeof weightDelta === "number"
              ? `${weightDelta >= 0 ? "+" : ""}${formatDecimal(weightDelta)} ${weightUnitLabel} in range`
              : "Add two entries to see change"
          }
        >
          <SimpleBarChart
            emptyLabel="Log body weight to start the chart."
            points={weightPoints}
            valueFormatter={(value) => `${formatDecimal(value)} ${weightUnitLabel}`}
          />
        </ChartCard>

        <ChartCard
          icon="nutrition-outline"
          title="Calories & Macros"
          value={latestMacroPoint ? `${Math.round(latestMacroPoint.calories)} cal` : "No macro logs"}
          valueNote={
            latestMacroPoint
              ? `${Math.round(latestMacroPoint.proteinGrams)}g protein - ${Math.round(latestMacroPoint.carbGrams)}g carbs - ${Math.round(latestMacroPoint.fatGrams)}g fats`
              : "Nutrition entries from the Nutrition tab appear here"
          }
        >
          <SimpleBarChart
            emptyLabel="Log meals or daily totals to populate macro history."
            points={dashboard?.macroPoints ?? []}
            valueFormatter={(value) => `${Math.round(value)}`}
          />
        </ChartCard>

        <ChartCard
          icon="barbell-outline"
          title="Strength Progress"
          value={latestStrengthPoint ? `${Math.round(latestStrengthPoint.value)}` : "No volume yet"}
          valueNote={
            latestStrengthPoint
              ? `${latestStrengthPoint.exerciseName} volume`
              : "Logged sets, reps, and weight create this chart"
          }
        >
          <SimpleBarChart
            emptyLabel="Log workouts with weights to see strength volume."
            points={dashboard?.strengthPoints ?? []}
            valueFormatter={(value) => `${Math.round(value)}`}
          />
        </ChartCard>

        <ChartCard
          icon="walk-outline"
          title="Running & Cardio History"
          value={`${totalCardioMinutes} min`}
          valueNote={`${dashboard?.cardioSessions.length ?? 0} sessions in selected range`}
        >
          <SimpleBarChart
            emptyLabel="Manual cardio logs from Calendar appear here."
            points={cardioPoints}
            valueFormatter={(value) => `${Math.round(value)}m`}
          />
          <RecentCardioList sessions={dashboard?.cardioSessions ?? []} />
        </ChartCard>
      </View>

      <SectionHeader eyebrow="Measurements" title="Body Measurements" />
      <View style={styles.actionRow}>
        <PrimaryButton
          icon="add"
          label="Measurement"
          onPress={() => setMeasurementDraft(createMeasurementDraft())}
        />
      </View>
      <MeasurementSummary
        entries={dashboard?.latestMeasurements ?? []}
        measurementUnitLabel={measurementUnitLabel}
      />

      <SectionHeader eyebrow="Photos" title="Progress Photos" />
      <PhotoReminderCard status={dashboard?.photoReminder} />
      {photoPermissionDenied ? (
        <StateCard
          actionLabel="Try Again"
          body="Photo library access is off. Allow photo access in iOS Settings to add local progress photos."
          icon="images-outline"
          onAction={() => void handlePickPhoto()}
          title="Photo permission needed"
          variant="permission"
        />
      ) : null}
      <View style={styles.actionRow}>
        <PrimaryButton
          icon="images-outline"
          label="Add Photo"
          onPress={() => setPhotoDraft(createPhotoDraft())}
        />
        <PrimaryButton
          disabled={(dashboard?.photos.length ?? 0) < 2}
          icon="git-compare-outline"
          label="Compare"
          onPress={() => setComparisonDraft(createComparisonDraft(dashboard?.photos ?? []))}
          variant="ghost"
        />
      </View>
      <PhotoGrid photos={dashboard?.photos ?? []} onDelete={handleDeletePhoto} />

      <SectionHeader eyebrow="Records" title="Personal Records" />
      <View style={styles.actionRow}>
        <PrimaryButton
          icon="trophy-outline"
          label="Manual PR"
          onPress={() => setRecordDraft(createRecordDraft(weightUnitLabel))}
        />
      </View>
      <PersonalRecordList records={dashboard?.personalRecords ?? []} />

      <WeightModal
        draft={weightDraft}
        onChangeDraft={setWeightDraft}
        onClose={() => setWeightDraft(null)}
        onSave={() => void handleSaveWeight()}
        weightUnitLabel={weightUnitLabel}
      />
      <MeasurementModal
        draft={measurementDraft}
        measurementUnitLabel={measurementUnitLabel}
        onChangeDraft={setMeasurementDraft}
        onClose={() => setMeasurementDraft(null)}
        onSave={() => void handleSaveMeasurement()}
      />
      <PhotoModal
        draft={photoDraft}
        onChangeDraft={setPhotoDraft}
        onClose={() => setPhotoDraft(null)}
        onPickPhoto={() => void handlePickPhoto()}
        onSave={() => void handleSavePhoto()}
      />
      <PhotoComparisonModal
        draft={comparisonDraft}
        onChangeDraft={setComparisonDraft}
        onClose={() => setComparisonDraft(null)}
        photos={dashboard?.photos ?? []}
      />
      <PersonalRecordModal
        draft={recordDraft}
        onChangeDraft={setRecordDraft}
        onClose={() => setRecordDraft(null)}
        onSave={() => void handleSavePersonalRecord()}
      />
    </Screen>
  );
}

function ChartCard({
  icon,
  title,
  value,
  valueNote,
  actionLabel,
  onAction,
  children
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
  valueNote: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View style={styles.cardTopRow}>
        <View style={styles.chartTitleRow}>
          <View style={styles.iconBadge}>
            <Ionicons color={theme.colors.accent} name={icon} size={18} />
          </View>
          <View style={styles.flex}>
            <AppText variant="subheading">{title}</AppText>
            <AppText muted>{valueNote}</AppText>
          </View>
        </View>
        {actionLabel && onAction ? (
          <PrimaryButton icon="add" label={actionLabel} onPress={onAction} variant="ghost" />
        ) : null}
      </View>
      <AppText style={styles.chartValue} variant="heading">
        {value}
      </AppText>
      <View style={styles.chartWrap}>{children}</View>
    </Card>
  );
}

function MeasurementSummary({
  entries,
  measurementUnitLabel
}: {
  entries: BodyMeasurementEntry[];
  measurementUnitLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="body-outline" size={24} />
        <View style={styles.flex}>
          <AppText variant="subheading">No measurements yet</AppText>
          <AppText muted>Track only the measurements that matter for your goal.</AppText>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.measurementGrid}>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.measurementItem}>
            <AppText style={styles.accentText} variant="heading">
              {formatDecimal(entry.value)} {measurementUnitLabel}
            </AppText>
            <AppText muted variant="caption">
              {entry.measurementType}
            </AppText>
            <AppText subtle variant="caption">
              {formatShortDate(entry.date)}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

function PhotoReminderCard({ status }: { status?: ProgressDashboardData["photoReminder"] }) {
  const label = status?.isDue ? "Weekly photo due" : "Weekly photo on track";
  const detail = status?.lastPhotoDate
    ? status.isDue
      ? `${status.daysSinceLastPhoto ?? 0} days since last check-in`
      : `Next check-in ${formatShortDate(status.nextDueDate ?? "")}`
    : "Add a front, side, back, or other angle when ready.";

  return (
    <Card accent style={styles.reminderCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">{label}</AppText>
          <AppText muted>{detail}</AppText>
        </View>
        <Ionicons color={theme.colors.accent} name="camera-outline" size={24} />
      </View>
    </Card>
  );
}

const PhotoGrid = React.memo(function PhotoGrid({
  photos,
  onDelete
}: {
  photos: ProgressPhoto[];
  onDelete: (photo: ProgressPhoto) => void;
}) {
  if (photos.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="images-outline" size={24} />
        <View style={styles.flex}>
          <AppText variant="subheading">No progress photos saved</AppText>
          <AppText muted>Photos stay local to this phone for version 1.</AppText>
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.photoGrid}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.photoCard}>
          <Image resizeMode="cover" source={{ uri: photo.localUri }} style={styles.photoThumb} />
          <View style={styles.photoMeta}>
            <View style={styles.flex}>
              <AppText numberOfLines={1} variant="caption">
                {formatAngle(photo.angle)}
              </AppText>
              <AppText subtle variant="caption">
                {formatShortDate(photo.date)}
              </AppText>
            </View>
            <IconButton
              accessibilityLabel="Delete photo"
              icon="trash-outline"
              onPress={() => onDelete(photo)}
              style={styles.smallIconButton}
            />
          </View>
        </View>
      ))}
    </View>
  );
});

function RecentCardioList({ sessions }: { sessions: CardioLogEntry[] }) {
  const recentSessions = sessions.slice(-3).reverse();

  if (recentSessions.length === 0) {
    return null;
  }

  return (
    <View style={styles.recentList}>
      {recentSessions.map((session) => (
        <View key={session.id} style={styles.listRow}>
          <View style={styles.flex}>
            <AppText variant="caption">{session.activityType}</AppText>
            <AppText subtle variant="caption">
              {formatShortDate(session.date)}
            </AppText>
          </View>
          <AppText muted variant="caption">
            {session.durationMinutes} min
          </AppText>
        </View>
      ))}
    </View>
  );
}

function PersonalRecordList({ records }: { records: PersonalRecordSummary[] }) {
  if (records.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Ionicons color={theme.colors.accent} name="trophy-outline" size={24} />
        <View style={styles.flex}>
          <AppText variant="subheading">No records detected yet</AppText>
          <AppText muted>Workout logs will automatically surface weight, reps, and volume PRs.</AppText>
        </View>
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.stack}>
        {records.slice(0, 12).map((record) => (
          <View key={record.id} style={styles.recordRow}>
            <View style={styles.flex}>
              <View style={styles.inlineRow}>
                <AppText variant="subheading">{record.exerciseName}</AppText>
                <View style={styles.sourcePill}>
                  <AppText variant="caption">{record.source === "auto" ? "Auto" : "Manual"}</AppText>
                </View>
              </View>
              <AppText muted>
                {formatRecordType(record.recordType)} - {formatDecimal(record.value)} {record.units}
              </AppText>
              {record.notes ? (
                <AppText subtle style={styles.cardGap} variant="caption">
                  {record.notes}
                </AppText>
              ) : null}
            </View>
            <AppText subtle variant="caption">
              {formatShortDate(record.achievedAt.slice(0, 10))}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

function WeightModal({
  draft,
  onChangeDraft,
  onClose,
  onSave,
  weightUnitLabel
}: {
  draft: WeightDraft | null;
  onChangeDraft: (draft: WeightDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
  weightUnitLabel: string;
}) {
  const updateDraft = (updates: Partial<WeightDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <ProgressModal visible={Boolean(draft)} title="Weight Entry" onClose={onClose}>
      {draft ? (
        <>
          <ProgressField label="Date" onChangeText={(date) => updateDraft({ date })} value={draft.date} />
          <ProgressField
            keyboardType="decimal-pad"
            label={`Weight (${weightUnitLabel})`}
            onChangeText={(weight) => updateDraft({ weight })}
            value={draft.weight}
          />
          <ProgressField
            label="Notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Energy, sleep, water, or context."
            value={draft.notes}
          />
          <PrimaryButton icon="save-outline" label="Save Weight" onPress={onSave} />
        </>
      ) : null}
    </ProgressModal>
  );
}

function MeasurementModal({
  draft,
  measurementUnitLabel,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: MeasurementDraft | null;
  measurementUnitLabel: string;
  onChangeDraft: (draft: MeasurementDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<MeasurementDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <ProgressModal visible={Boolean(draft)} title="Measurement" onClose={onClose}>
      {draft ? (
        <>
          <ProgressField label="Date" onChangeText={(date) => updateDraft({ date })} value={draft.date} />
          <AppText muted variant="caption">
            Measurement
          </AppText>
          <View style={styles.optionWrap}>
            {measurementTypes.map((type) => (
              <OptionPill
                key={type}
                label={type}
                onPress={() => updateDraft({ measurementType: type })}
                selected={draft.measurementType === type}
              />
            ))}
          </View>
          {draft.measurementType === "Custom" ? (
            <ProgressField
              label="Custom name"
              onChangeText={(customMeasurementType) => updateDraft({ customMeasurementType })}
              placeholder="Forearm, calf, etc."
              value={draft.customMeasurementType}
            />
          ) : null}
          <ProgressField
            keyboardType="decimal-pad"
            label={`Value (${measurementUnitLabel})`}
            onChangeText={(value) => updateDraft({ value })}
            value={draft.value}
          />
          <ProgressField
            label="Notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Optional context."
            value={draft.notes}
          />
          <PrimaryButton icon="save-outline" label="Save Measurement" onPress={onSave} />
        </>
      ) : null}
    </ProgressModal>
  );
}

function PhotoModal({
  draft,
  onChangeDraft,
  onClose,
  onPickPhoto,
  onSave
}: {
  draft: PhotoDraft | null;
  onChangeDraft: (draft: PhotoDraft | null) => void;
  onClose: () => void;
  onPickPhoto: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<PhotoDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <ProgressModal visible={Boolean(draft)} title="Progress Photo" onClose={onClose}>
      {draft ? (
        <>
          <ProgressField label="Date" onChangeText={(date) => updateDraft({ date })} value={draft.date} />
          <AppText muted variant="caption">
            Angle
          </AppText>
          <View style={styles.optionWrap}>
            {progressPhotoAngles.map((angle) => (
              <OptionPill
                key={angle.value}
                label={angle.label}
                onPress={() => updateDraft({ angle: angle.value })}
                selected={draft.angle === angle.value}
              />
            ))}
          </View>
          {draft.localUri ? <Image source={{ uri: draft.localUri }} style={styles.previewImage} /> : null}
          <PrimaryButton
            icon="image-outline"
            label={draft.localUri ? "Change Photo" : "Choose Photo"}
            onPress={onPickPhoto}
            variant="ghost"
          />
          <ProgressField
            label="Notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Lighting, angle, or weekly check-in notes."
            value={draft.notes}
          />
          <PrimaryButton disabled={!draft.localUri} icon="save-outline" label="Save Photo" onPress={onSave} />
        </>
      ) : null}
    </ProgressModal>
  );
}

function PhotoComparisonModal({
  draft,
  onChangeDraft,
  onClose,
  photos
}: {
  draft: ComparisonDraft | null;
  onChangeDraft: (draft: ComparisonDraft | null) => void;
  onClose: () => void;
  photos: ProgressPhoto[];
}) {
  const beforePhoto = photos.find((photo) => photo.id === draft?.beforeId);
  const afterPhoto = photos.find((photo) => photo.id === draft?.afterId);

  const updateDraft = (updates: Partial<ComparisonDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <ProgressModal visible={Boolean(draft)} title="Photo Comparison" onClose={onClose}>
      {draft ? (
        <>
          <View style={styles.comparisonRow}>
            <ComparisonSlot label="Before" photo={beforePhoto} />
            <ComparisonSlot label="After" photo={afterPhoto} />
          </View>
          <AppText muted variant="caption">
            Before
          </AppText>
          <PhotoPickerRow
            photos={photos}
            selectedId={draft.beforeId}
            onSelect={(beforeId) => updateDraft({ beforeId })}
          />
          <AppText muted variant="caption">
            After
          </AppText>
          <PhotoPickerRow
            photos={photos}
            selectedId={draft.afterId}
            onSelect={(afterId) => updateDraft({ afterId })}
          />
        </>
      ) : null}
    </ProgressModal>
  );
}

function ComparisonSlot({ label, photo }: { label: string; photo?: ProgressPhoto }) {
  return (
    <View style={styles.comparisonSlot}>
      {photo ? (
        <Image source={{ uri: photo.localUri }} style={styles.comparisonImage} />
      ) : (
        <View style={styles.comparisonEmpty}>
          <Ionicons color={theme.colors.accent} name="image-outline" size={24} />
        </View>
      )}
      <AppText variant="caption">{label}</AppText>
      <AppText subtle variant="caption">
        {photo ? `${formatAngle(photo.angle)} - ${formatShortDate(photo.date)}` : "Select photo"}
      </AppText>
    </View>
  );
}

function PhotoPickerRow({
  photos,
  selectedId,
  onSelect
}: {
  photos: ProgressPhoto[];
  selectedId?: string;
  onSelect: (photoId: string) => void;
}) {
  return (
    <View style={styles.photoPickerGrid}>
      {photos.map((photo) => (
        <Pressable
          key={photo.id}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedId === photo.id }}
          onPress={() => onSelect(photo.id)}
          style={({ pressed }) => [
            styles.photoPickerItem,
            selectedId === photo.id && styles.photoPickerSelected,
            pressed && styles.pressed
          ]}
        >
          <Image source={{ uri: photo.localUri }} style={styles.photoPickerThumb} />
          <AppText numberOfLines={1} variant="caption">
            {formatShortDate(photo.date)}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function PersonalRecordModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: PersonalRecordDraft | null;
  onChangeDraft: (draft: PersonalRecordDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<PersonalRecordDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <ProgressModal visible={Boolean(draft)} title="Manual PR" onClose={onClose}>
      {draft ? (
        <>
          <ProgressField
            label="Exercise"
            onChangeText={(exerciseName) => updateDraft({ exerciseName })}
            placeholder="Bench Press"
            value={draft.exerciseName}
          />
          <ProgressField
            label="Date"
            onChangeText={(achievedAt) => updateDraft({ achievedAt })}
            value={draft.achievedAt}
          />
          <AppText muted variant="caption">
            Record type
          </AppText>
          <View style={styles.optionWrap}>
            {recordTypeOptions.map((option) => (
              <OptionPill
                key={option.value}
                label={option.label}
                onPress={() => updateDraft({ recordType: option.value })}
                selected={draft.recordType === option.value}
              />
            ))}
          </View>
          <View style={styles.formGrid}>
            <ProgressField
              keyboardType="decimal-pad"
              label="Value"
              onChangeText={(value) => updateDraft({ value })}
              value={draft.value}
            />
            <ProgressField
              label="Units"
              onChangeText={(units) => updateDraft({ units })}
              value={draft.units}
            />
          </View>
          <ProgressField
            label="PR notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Context, form, tempo, or milestone notes."
            value={draft.notes}
          />
          <PrimaryButton icon="save-outline" label="Save PR" onPress={onSave} />
        </>
      ) : null}
    </ProgressModal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText style={styles.metricValue} variant="heading">
        {value}
      </AppText>
      <AppText muted variant="caption">
        {label}
      </AppText>
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

function createWeightDraft(latestWeight?: number): WeightDraft {
  return {
    date: toDateKey(new Date()),
    weight: typeof latestWeight === "number" ? String(latestWeight) : "",
    notes: ""
  };
}

function createMeasurementDraft(): MeasurementDraft {
  return {
    date: toDateKey(new Date()),
    measurementType: "Waist",
    customMeasurementType: "",
    value: "",
    notes: ""
  };
}

function createPhotoDraft(): PhotoDraft {
  return {
    date: toDateKey(new Date()),
    angle: "front",
    localUri: "",
    notes: ""
  };
}

function createComparisonDraft(photos: ProgressPhoto[]): ComparisonDraft {
  return {
    beforeId: photos.at(-1)?.id ?? photos[0]?.id,
    afterId: photos[0]?.id ?? photos.at(-1)?.id
  };
}

function createRecordDraft(weightUnitLabel: string): PersonalRecordDraft {
  return {
    exerciseName: "",
    recordType: "weight",
    value: "",
    units: weightUnitLabel,
    achievedAt: toDateKey(new Date()),
    notes: ""
  };
}

function mapWeightToChartPoint(entry: { id: string; date: string; weight: number }): ChartPoint {
  return {
    id: entry.id,
    date: entry.date,
    label: formatShortDate(entry.date),
    value: entry.weight
  };
}

function buildCardioPoints(sessions: CardioLogEntry[]): ChartPoint[] {
  const pointsByDate = new Map<string, ChartPoint>();

  for (const session of sessions) {
    const current = pointsByDate.get(session.date);

    if (current) {
      current.value += session.durationMinutes;
      current.meta = `${Number(current.meta ?? 1) + 1}`;
    } else {
      pointsByDate.set(session.date, {
        id: `cardio-${session.date}`,
        date: session.date,
        label: formatShortDate(session.date),
        value: session.durationMinutes,
        meta: "1"
      });
    }
  }

  return Array.from(pointsByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function copyPhotoIntoAppStorage(sourceUri: string) {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    return sourceUri;
  }

  const photosDirectory = `${documentDirectory}progress-photos/`;
  const extension = getUriExtension(sourceUri);
  const destinationUri = `${photosDirectory}progress-${Date.now()}.${extension}`;

  await FileSystem.makeDirectoryAsync(photosDirectory, { intermediates: true });
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  return destinationUri;
}

function getUriExtension(uri: string) {
  const path = uri.split("?")[0] ?? "";
  const extension = path.split(".").pop()?.toLowerCase();

  if (!extension || extension.length > 5 || extension.includes("/")) {
    return "jpg";
  }

  return extension;
}

function getWeightDelta(entries: { weight: number }[]) {
  if (entries.length < 2) {
    return undefined;
  }

  return entries[entries.length - 1].weight - entries[0].weight;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(dateKey: string) {
  if (!isDateKey(dateKey)) {
    return "--";
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function formatDecimal(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatAngle(angle?: ProgressPhoto["angle"]) {
  if (!angle) {
    return "Other";
  }

  return angle.charAt(0).toUpperCase() + angle.slice(1);
}

function formatRecordType(recordType: PersonalRecordSummary["recordType"]) {
  if (recordType === "volume") {
    return "Volume";
  }

  return recordType.charAt(0).toUpperCase() + recordType.slice(1);
}

const styles = StyleSheet.create({
  accentText: {
    color: theme.colors.accent
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  cardGap: {
    marginTop: theme.spacing.xs
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between"
  },
  chartTitleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.md
  },
  chartValue: {
    color: theme.colors.text,
    marginTop: theme.spacing.md
  },
  chartWrap: {
    marginTop: theme.spacing.md
  },
  comparisonEmpty: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    height: 220,
    justifyContent: "center",
    width: "100%"
  },
  comparisonImage: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radii.md,
    height: 220,
    width: "100%"
  },
  comparisonRow: {
    flexDirection: "row",
    gap: theme.spacing.sm
  },
  comparisonSlot: {
    flex: 1,
    gap: theme.spacing.xs
  },
  emptyCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  flex: {
    flex: 1
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  heroCard: {
    marginTop: theme.spacing.xl
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
  inlineRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  listRow: {
    alignItems: "center",
    borderTopColor: theme.colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    paddingTop: theme.spacing.sm
  },
  measurementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  measurementItem: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: 132,
    flexGrow: 1,
    padding: theme.spacing.md
  },
  metric: {
    flexBasis: 96,
    flexGrow: 1
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  metricValue: {
    color: theme.colors.text
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
  photoCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexBasis: "47%",
    flexGrow: 1,
    overflow: "hidden"
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  photoMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: theme.spacing.sm
  },
  photoPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  photoPickerItem: {
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
    width: 86
  },
  photoPickerSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  photoPickerThumb: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radii.sm,
    height: 68,
    width: "100%"
  },
  photoThumb: {
    backgroundColor: theme.colors.surfaceRaised,
    height: 156,
    width: "100%"
  },
  pressed: {
    opacity: 0.72
  },
  previewImage: {
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.radii.md,
    height: 260,
    width: "100%"
  },
  rangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg
  },
  recentList: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md
  },
  recordRow: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    padding: theme.spacing.md
  },
  reminderCard: {
    marginBottom: theme.spacing.md
  },
  smallIconButton: {
    height: 34,
    width: 34
  },
  sourcePill: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2
  },
  stack: {
    gap: theme.spacing.md
  },
  subtitle: {
    marginTop: theme.spacing.xs
  },
  title: {
    marginTop: theme.spacing.xs
  }
});
