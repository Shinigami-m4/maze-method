import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import {
  deleteCardioSession,
  deleteLoggedWorkout,
  getCalendarMonthSummaries,
  getDailyLogDetails,
  logRoutineForDate,
  saveCardioSession,
  saveDailyNote,
  saveLoggedWorkout,
  toDateKey
} from "../../database/calendarRepository";
import { getWorkoutRoutines } from "../../database/workoutRepository";
import { theme } from "../../theme/theme";
import {
  CalendarDaySummary,
  CardioLogEntry,
  CardioType,
  cardioTypes,
  DailyLogDetails,
  LoggedWorkoutEntry,
  LoggedWorkoutExerciseEntry
} from "../../types/calendarLogging";
import { WorkoutRoutineDetails } from "../../types/workouts";
import { CalendarField } from "./components/CalendarField";
import { CalendarModal } from "./components/CalendarModal";

type CalendarCell = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

type CardioDraft = {
  id?: string;
  activityType: CardioType;
  customActivityType: string;
  durationMinutes: string;
  distance: string;
  pace: string;
  speed: string;
  caloriesBurned: string;
  notes: string;
};

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const emptyDetails: DailyLogDetails = {
  date: toDateKey(new Date()),
  workouts: [],
  cardioSessions: [],
  meals: [],
  bodyWeightEntries: [],
  progressPhotos: []
};

export function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [summaries, setSummaries] = useState<CalendarDaySummary[]>([]);
  const [details, setDetails] = useState<DailyLogDetails>(emptyDetails);
  const [savedRoutines, setSavedRoutines] = useState<WorkoutRoutineDetails[]>([]);
  const [isRoutinePickerOpen, setIsRoutinePickerOpen] = useState(false);
  const [cardioDraft, setCardioDraft] = useState<CardioDraft | null>(null);
  const [dailyNoteDraft, setDailyNoteDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadMonth = useCallback(async () => {
    const nextSummaries = await getCalendarMonthSummaries(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    setSummaries(nextSummaries);
  }, [currentMonth]);

  const loadDailyDetails = useCallback(async () => {
    const [nextDetails, routines] = await Promise.all([
      getDailyLogDetails(selectedDate),
      getWorkoutRoutines()
    ]);
    setDetails(nextDetails);
    setDailyNoteDraft(nextDetails.dailyNote?.note ?? "");
    setSavedRoutines(routines);
  }, [selectedDate]);

  const refreshCalendar = useCallback(async () => {
    await Promise.all([loadMonth(), loadDailyDetails()]);
  }, [loadDailyDetails, loadMonth]);

  useFocusEffect(
    useCallback(() => {
      void refreshCalendar();
    }, [refreshCalendar])
  );

  useEffect(() => {
    void refreshCalendar();
  }, [refreshCalendar]);

  const summaryByDate = useMemo(
    () => new Map(summaries.map((summary) => [summary.date, summary])),
    [summaries]
  );
  const calendarCells = useMemo(() => buildCalendarCells(currentMonth), [currentMonth]);
  const selectedSummary = summaryByDate.get(selectedDate);
  const monthLabel = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  const handleLogRoutine = async (routineId: string) => {
    setIsSaving(true);
    try {
      await logRoutineForDate(routineId, selectedDate);
      setIsRoutinePickerOpen(false);
      await refreshCalendar();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWorkout = async (workout: LoggedWorkoutEntry) => {
    await saveLoggedWorkout(workout);
    await refreshCalendar();
  };

  const handleDeleteWorkout = (workoutId: string) => {
    Alert.alert("Delete logged workout?", "This removes the workout history for this day.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteLoggedWorkout(workoutId).then(refreshCalendar);
        }
      }
    ]);
  };

  const handleSaveCardio = async () => {
    if (!cardioDraft) {
      return;
    }

    const durationMinutes = parseNumber(cardioDraft.durationMinutes, 0);

    if (durationMinutes <= 0) {
      Alert.alert("Duration required", "Add cardio duration before saving.");
      return;
    }

    await saveCardioSession({
      id: cardioDraft.id,
      date: selectedDate,
      activityType:
        cardioDraft.activityType === "Custom"
          ? cardioDraft.customActivityType.trim() || "Custom cardio"
          : cardioDraft.activityType,
      durationMinutes,
      distance: parseOptionalNumber(cardioDraft.distance),
      pace: cardioDraft.pace.trim() || undefined,
      speed: parseOptionalNumber(cardioDraft.speed),
      caloriesBurned: parseOptionalNumber(cardioDraft.caloriesBurned),
      notes: cardioDraft.notes.trim() || undefined
    });
    setCardioDraft(null);
    await refreshCalendar();
  };

  const handleDeleteCardio = (cardioId: string) => {
    Alert.alert("Delete cardio session?", "This removes the cardio log for this day.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteCardioSession(cardioId).then(refreshCalendar);
        }
      }
    ]);
  };

  const handleSaveDailyNote = async () => {
    await saveDailyNote(selectedDate, dailyNoteDraft);
    await refreshCalendar();
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <AppText muted variant="caption">
            Every Rep Has Direction
          </AppText>
          <AppText style={styles.title} variant="title">
            Calendar
          </AppText>
        </View>
        <View style={styles.monthControls}>
          <IconButton
            accessibilityLabel="Previous month"
            icon="chevron-back"
            onPress={() => {
              const nextMonth = addMonths(currentMonth, -1);
              setCurrentMonth(nextMonth);
              setSelectedDate(toDateKey(nextMonth));
            }}
          />
          <IconButton
            accessibilityLabel="Next month"
            icon="chevron-forward"
            onPress={() => {
              const nextMonth = addMonths(currentMonth, 1);
              setCurrentMonth(nextMonth);
              setSelectedDate(toDateKey(nextMonth));
            }}
          />
        </View>
      </View>

      <Card style={styles.calendarCard}>
        <View style={styles.cardTopRow}>
          <AppText variant="heading">{monthLabel}</AppText>
          <PrimaryButton
            icon="calendar-outline"
            label="Today"
            onPress={() => {
              const today = new Date();
              setCurrentMonth(startOfMonth(today));
              setSelectedDate(toDateKey(today));
            }}
            variant="ghost"
          />
        </View>
        <View style={styles.weekdayRow}>
          {weekdayLabels.map((label, index) => (
            <AppText key={`${label}-${index}`} muted style={styles.weekdayLabel} variant="caption">
              {label}
            </AppText>
          ))}
        </View>
        <View style={styles.grid}>
          {calendarCells.map((cell) => (
            <CalendarDayCell
              key={cell.dateKey}
              cell={cell}
              isSelected={cell.dateKey === selectedDate}
              isToday={cell.dateKey === toDateKey(new Date())}
              onPress={() => {
                setSelectedDate(cell.dateKey);
                if (!cell.isCurrentMonth) {
                  setCurrentMonth(startOfMonth(cell.date));
                }
              }}
              summary={summaryByDate.get(cell.dateKey)}
            />
          ))}
        </View>
        <IndicatorLegend />
      </Card>

      <DailySummaryStrip summary={selectedSummary} />

      <View style={styles.sectionTitleRow}>
        <SectionHeader title={formatSelectedDate(selectedDate)} />
        <PrimaryButton
          icon="add"
          label="Routine"
          onPress={() => setIsRoutinePickerOpen(true)}
          variant="ghost"
        />
      </View>

      <DailyWorkoutSection
        details={details}
        onChangeDetails={setDetails}
        onDeleteWorkout={handleDeleteWorkout}
        onSaveWorkout={(workout) => void handleSaveWorkout(workout)}
      />

      <DailyCardioSection
        cardioSessions={details.cardioSessions}
        onAdd={() => setCardioDraft(createEmptyCardioDraft())}
        onDelete={(cardioId) => handleDeleteCardio(cardioId)}
        onEdit={(cardio) => setCardioDraft(createCardioDraft(cardio))}
      />

      <DailyNutritionSection details={details} />
      <DailyProgressSection details={details} />

      <SectionHeader title="Daily Notes" />
      <Card style={styles.stack}>
        <CalendarField
          label="Notes"
          multiline
          onChangeText={setDailyNoteDraft}
          placeholder="Energy, soreness, schedule, or anything worth remembering."
          value={dailyNoteDraft}
        />
        <PrimaryButton icon="save-outline" label="Save Note" onPress={() => void handleSaveDailyNote()} />
      </Card>

      <RoutinePickerModal
        isSaving={isSaving}
        onClose={() => setIsRoutinePickerOpen(false)}
        onLogRoutine={(routineId) => void handleLogRoutine(routineId)}
        routines={savedRoutines}
        selectedDate={selectedDate}
        visible={isRoutinePickerOpen}
      />

      <CardioModal
        draft={cardioDraft}
        onChangeDraft={setCardioDraft}
        onClose={() => setCardioDraft(null)}
        onSave={() => void handleSaveCardio()}
      />
    </Screen>
  );
}

function CalendarDayCell({
  cell,
  summary,
  isSelected,
  isToday,
  onPress
}: {
  cell: CalendarCell;
  summary?: CalendarDaySummary;
  isSelected: boolean;
  isToday: boolean;
  onPress: () => void;
}) {
  const indicatorCount = getIndicatorCount(summary);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayCell,
        !cell.isCurrentMonth && styles.dayCellMuted,
        isSelected && styles.dayCellSelected,
        pressed && styles.pressed
      ]}
    >
      <AppText
        style={[
          styles.dayNumber,
          !cell.isCurrentMonth && styles.outsideMonthText,
          isToday && styles.todayText
        ]}
        variant="caption"
      >
        {cell.dayNumber}
      </AppText>
      <View style={styles.indicatorRow}>
        {Array.from({ length: Math.min(indicatorCount, 6) }).map((_, index) => (
          <View key={`${cell.dateKey}-${index}`} style={styles.indicatorDot} />
        ))}
      </View>
    </Pressable>
  );
}

function DailySummaryStrip({ summary }: { summary?: CalendarDaySummary }) {
  return (
    <View style={styles.summaryStrip}>
      <SummaryPill icon="barbell-outline" label={`${summary?.workoutCount ?? 0} workouts`} />
      <SummaryPill icon="walk-outline" label={`${summary?.cardioCount ?? 0} cardio`} />
      <SummaryPill icon="nutrition-outline" label={`${summary?.mealCount ?? 0} meals`} />
      <SummaryPill icon="camera-outline" label={`${summary?.progressPhotoCount ?? 0} photos`} />
    </View>
  );
}

function DailyWorkoutSection({
  details,
  onChangeDetails,
  onSaveWorkout,
  onDeleteWorkout
}: {
  details: DailyLogDetails;
  onChangeDetails: (details: DailyLogDetails) => void;
  onSaveWorkout: (workout: LoggedWorkoutEntry) => void;
  onDeleteWorkout: (workoutId: string) => void;
}) {
  const updateWorkout = (workoutId: string, updater: (workout: LoggedWorkoutEntry) => LoggedWorkoutEntry) => {
    onChangeDetails({
      ...details,
      workouts: details.workouts.map((workout) =>
        workout.id === workoutId ? updater(workout) : workout
      )
    });
  };

  return (
    <>
      <SectionHeader title="Workout Completed" />
      {details.workouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No workout logged"
          value="Use a saved routine to copy exercises into this day's history."
        />
      ) : (
        <View style={styles.stack}>
          {details.workouts.map((workout) => (
            <LoggedWorkoutCard
              key={workout.id}
              onDelete={() => onDeleteWorkout(workout.id)}
              onSave={() => onSaveWorkout(workout)}
              onUpdate={(updatedWorkout) => updateWorkout(workout.id, () => updatedWorkout)}
              workout={workout}
            />
          ))}
        </View>
      )}
    </>
  );
}

function LoggedWorkoutCard({
  workout,
  onUpdate,
  onSave,
  onDelete
}: {
  workout: LoggedWorkoutEntry;
  onUpdate: (workout: LoggedWorkoutEntry) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const completedCount = workout.exercises.filter((exercise) => exercise.isCompleted).length;

  const updateExercise = (
    exerciseId: string,
    updates: Partial<LoggedWorkoutExerciseEntry>
  ) => {
    onUpdate({
      ...workout,
      exercises: workout.exercises.map((exercise) =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      )
    });
  };

  return (
    <Card accent={completedCount > 0}>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">{workout.routineName}</AppText>
          <AppText muted>
            {completedCount}/{workout.exercises.length} complete
          </AppText>
        </View>
        <IconButton accessibilityLabel="Delete workout" icon="trash-outline" onPress={onDelete} />
      </View>
      <CalendarField
        label="Workout notes"
        multiline
        onChangeText={(notes) => onUpdate({ ...workout, notes })}
        placeholder="How the session felt, load notes, or adjustments."
        value={workout.notes ?? ""}
      />
      <View style={styles.stack}>
        {workout.exercises.map((exercise, index) => (
          <LoggedExerciseEditor
            key={exercise.id}
            exercise={exercise}
            index={index}
            onUpdate={(updates) => updateExercise(exercise.id, updates)}
          />
        ))}
      </View>
      <PrimaryButton icon="save-outline" label="Save Workout" onPress={onSave} />
    </Card>
  );
}

function LoggedExerciseEditor({
  exercise,
  index,
  onUpdate
}: {
  exercise: LoggedWorkoutExerciseEntry;
  index: number;
  onUpdate: (updates: Partial<LoggedWorkoutExerciseEntry>) => void;
}) {
  return (
    <Card style={styles.innerCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">
            {index + 1}. {exercise.exerciseName}
          </AppText>
          {exercise.muscleGroup ? <AppText muted>{exercise.muscleGroup}</AppText> : null}
        </View>
        <Switch
          ios_backgroundColor={theme.colors.surfaceRaised}
          onValueChange={(isCompleted) => onUpdate({ isCompleted })}
          thumbColor={theme.colors.text}
          trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
          value={exercise.isCompleted}
        />
      </View>
      <View style={styles.formGrid}>
        <CalendarField
          keyboardType="number-pad"
          label="Sets"
          onChangeText={(sets) => onUpdate({ sets: parseOptionalNumber(sets) })}
          value={formatOptionalNumber(exercise.sets)}
        />
        <CalendarField
          label="Reps"
          onChangeText={(reps) => onUpdate({ reps })}
          value={exercise.reps ?? ""}
        />
        <CalendarField
          keyboardType="decimal-pad"
          label="Weight"
          onChangeText={(weight) => onUpdate({ weight: parseOptionalNumber(weight) })}
          placeholder="Optional"
          value={formatOptionalNumber(exercise.weight)}
        />
        <CalendarField
          keyboardType="number-pad"
          label="Rest sec"
          onChangeText={(restSeconds) => onUpdate({ restSeconds: parseOptionalNumber(restSeconds) })}
          placeholder="90"
          value={formatOptionalNumber(exercise.restSeconds)}
        />
      </View>
      <CalendarField
        label="Notes"
        multiline
        onChangeText={(notes) => onUpdate({ notes })}
        placeholder="Set notes, substitutions, or form cues."
        value={exercise.notes ?? ""}
      />
      <View style={styles.switchLine}>
        <AppText>PR flag</AppText>
        <Switch
          ios_backgroundColor={theme.colors.surfaceRaised}
          onValueChange={(isPersonalRecord) => onUpdate({ isPersonalRecord })}
          thumbColor={theme.colors.text}
          trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
          value={exercise.isPersonalRecord}
        />
      </View>
    </Card>
  );
}

function DailyCardioSection({
  cardioSessions,
  onAdd,
  onEdit,
  onDelete
}: {
  cardioSessions: CardioLogEntry[];
  onAdd: () => void;
  onEdit: (cardio: CardioLogEntry) => void;
  onDelete: (cardioId: string) => void;
}) {
  return (
    <>
      <View style={styles.sectionTitleRow}>
        <SectionHeader title="Cardio Session" />
        <PrimaryButton icon="add" label="Cardio" onPress={onAdd} variant="ghost" />
      </View>
      {cardioSessions.length === 0 ? (
        <EmptyState
          icon="walk-outline"
          title="No cardio logged"
          value="Manual cardio only: duration, distance, pace or speed, calories, and notes."
        />
      ) : (
        <View style={styles.stack}>
          {cardioSessions.map((cardio) => (
            <Card key={cardio.id}>
              <View style={styles.cardTopRow}>
                <View style={styles.flex}>
                  <AppText variant="subheading">{cardio.activityType}</AppText>
                  <AppText muted>
                    {cardio.durationMinutes} min
                    {typeof cardio.distance === "number" ? ` · ${cardio.distance} mi` : ""}
                    {cardio.pace ? ` · ${cardio.pace}` : ""}
                  </AppText>
                </View>
                <View style={styles.iconRow}>
                  <IconButton accessibilityLabel="Edit cardio" icon="create-outline" onPress={() => onEdit(cardio)} />
                  <IconButton accessibilityLabel="Delete cardio" icon="trash-outline" onPress={() => onDelete(cardio.id)} />
                </View>
              </View>
              {typeof cardio.speed === "number" || typeof cardio.caloriesBurned === "number" ? (
                <AppText muted style={styles.cardGap}>
                  {typeof cardio.speed === "number" ? `${cardio.speed} mph` : ""}
                  {typeof cardio.speed === "number" && typeof cardio.caloriesBurned === "number" ? " · " : ""}
                  {typeof cardio.caloriesBurned === "number" ? `${cardio.caloriesBurned} cal` : ""}
                </AppText>
              ) : null}
              {cardio.notes ? <AppText style={styles.cardGap}>{cardio.notes}</AppText> : null}
            </Card>
          ))}
        </View>
      )}
    </>
  );
}

function DailyNutritionSection({ details }: { details: DailyLogDetails }) {
  const totals = details.macroLog ?? summarizeMeals(details.meals);

  return (
    <>
      <SectionHeader title="Meals / Macros" />
      <Card>
        <View style={styles.metricGrid}>
          <Metric label="Meals" value={String(details.meals.length)} />
          <Metric label="Calories" value={formatMetric(totals.calories)} />
          <Metric label="Protein" value={formatMetric(totals.proteinGrams, "g")} />
          <Metric label="Carbs" value={formatMetric(totals.carbGrams, "g")} />
          <Metric label="Fat" value={formatMetric(totals.fatGrams, "g")} />
        </View>
      </Card>
    </>
  );
}

function DailyProgressSection({ details }: { details: DailyLogDetails }) {
  return (
    <>
      <SectionHeader title="Progress" />
      <View style={styles.stack}>
        <Card>
          <View style={styles.cardTopRow}>
            <View style={styles.flex}>
              <AppText variant="subheading">Body weight</AppText>
              <AppText muted>
                {details.bodyWeightEntries.length
                  ? `${details.bodyWeightEntries[0].weight} ${details.bodyWeightEntries[0].units === "imperial" ? "lb" : "kg"}`
                  : "No body weight entry"}
              </AppText>
            </View>
            <Ionicons color={theme.colors.accent} name="scale-outline" size={22} />
          </View>
        </Card>
        <Card>
          <View style={styles.cardTopRow}>
            <View style={styles.flex}>
              <AppText variant="subheading">Progress photos</AppText>
              <AppText muted>
                {details.progressPhotos.length
                  ? `${details.progressPhotos.length} photo metadata entries`
                  : "No progress photos"}
              </AppText>
            </View>
            <Ionicons color={theme.colors.accent} name="camera-outline" size={22} />
          </View>
        </Card>
      </View>
    </>
  );
}

function RoutinePickerModal({
  visible,
  routines,
  selectedDate,
  isSaving,
  onClose,
  onLogRoutine
}: {
  visible: boolean;
  routines: WorkoutRoutineDetails[];
  selectedDate: string;
  isSaving: boolean;
  onClose: () => void;
  onLogRoutine: (routineId: string) => void;
}) {
  return (
    <CalendarModal visible={visible} title="Log Routine" onClose={onClose}>
      <AppText muted>Copy a saved routine into {formatSelectedDate(selectedDate)}. Later routine edits will not change this workout history.</AppText>
      {routines.length === 0 ? (
        <EmptyState
          icon="repeat-outline"
          title="No saved routines"
          value="Create a routine in the Workouts tab first."
        />
      ) : (
        <View style={styles.stack}>
          {routines.map((routine) => (
            <Card key={routine.id} accent={routine.isActive}>
              <View style={styles.cardTopRow}>
                <View style={styles.flex}>
                  <AppText variant="subheading">{routine.name}</AppText>
                  <AppText muted>
                    {routine.exercises.length} exercises · {routine.isActive ? "Active" : "Inactive"}
                  </AppText>
                </View>
                <PrimaryButton
                  disabled={isSaving}
                  icon="add"
                  label={isSaving ? "Logging" : "Log"}
                  onPress={() => onLogRoutine(routine.id)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </CalendarModal>
  );
}

function CardioModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: CardioDraft | null;
  onChangeDraft: (draft: CardioDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<CardioDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <CalendarModal visible={Boolean(draft)} title="Cardio Log" onClose={onClose}>
      {draft ? (
        <>
          <AppText muted variant="caption">
            Cardio type
          </AppText>
          <HorizontalOptions
            options={cardioTypes}
            selected={draft.activityType}
            onSelect={(activityType) => updateDraft({ activityType })}
          />
          {draft.activityType === "Custom" ? (
            <CalendarField
              label="Custom type"
              onChangeText={(customActivityType) => updateDraft({ customActivityType })}
              placeholder="Sled push, boxing, sport..."
              value={draft.customActivityType}
            />
          ) : null}
          <View style={styles.formGrid}>
            <CalendarField
              keyboardType="number-pad"
              label="Duration min"
              onChangeText={(durationMinutes) => updateDraft({ durationMinutes })}
              value={draft.durationMinutes}
            />
            <CalendarField
              keyboardType="decimal-pad"
              label="Distance"
              onChangeText={(distance) => updateDraft({ distance })}
              placeholder="Optional"
              value={draft.distance}
            />
            <CalendarField
              label="Pace"
              onChangeText={(pace) => updateDraft({ pace })}
              placeholder="9:30 / mi"
              value={draft.pace}
            />
            <CalendarField
              keyboardType="decimal-pad"
              label="Speed"
              onChangeText={(speed) => updateDraft({ speed })}
              placeholder="mph"
              value={draft.speed}
            />
            <CalendarField
              keyboardType="number-pad"
              label="Calories"
              onChangeText={(caloriesBurned) => updateDraft({ caloriesBurned })}
              placeholder="Optional"
              value={draft.caloriesBurned}
            />
          </View>
          <CalendarField
            label="Notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Manual cardio only. No GPS route tracking in version 1."
            value={draft.notes}
          />
          <PrimaryButton icon="save-outline" label="Save Cardio" onPress={onSave} />
        </>
      ) : null}
    </CalendarModal>
  );
}

function HorizontalOptions<T extends string>({
  options,
  selected,
  onSelect
}: {
  options: T[];
  selected: T;
  onSelect: (option: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.optionRow}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: option === selected }}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.optionChip,
              option === selected && styles.optionChipSelected,
              pressed && styles.pressed
            ]}
          >
            <AppText variant="caption">{option}</AppText>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function EmptyState({
  icon,
  title,
  value
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  value: string;
}) {
  return (
    <Card style={styles.emptyCard}>
      <Ionicons color={theme.colors.accent} name={icon} size={26} />
      <View style={styles.flex}>
        <AppText variant="subheading">{title}</AppText>
        <AppText muted>{value}</AppText>
      </View>
    </Card>
  );
}

function IndicatorLegend() {
  return (
    <View style={styles.legendRow}>
      <LegendItem label="Workout" />
      <LegendItem label="Cardio" />
      <LegendItem label="Meal" />
      <LegendItem label="Progress" />
    </View>
  );
}

function LegendItem({ label }: { label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={styles.indicatorDot} />
      <AppText subtle variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function SummaryPill({
  icon,
  label
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.summaryPill}>
      <Ionicons color={theme.colors.accent} name={icon} size={16} />
      <AppText variant="caption">{label}</AppText>
    </View>
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

function buildCalendarCells(month: Date): CalendarCell[] {
  const firstDay = startOfMonth(month);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    cells.push({
      date,
      dateKey: toDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month.getMonth()
    });
  }

  return cells;
}

function getIndicatorCount(summary?: CalendarDaySummary) {
  if (!summary) {
    return 0;
  }

  return [
    summary.workoutCount > 0,
    summary.cardioCount > 0,
    summary.mealCount > 0 || summary.hasMacroLog,
    summary.bodyWeightCount > 0,
    summary.progressPhotoCount > 0,
    summary.hasNote
  ].filter(Boolean).length;
}

function createEmptyCardioDraft(): CardioDraft {
  return {
    activityType: "Running",
    customActivityType: "",
    durationMinutes: "",
    distance: "",
    pace: "",
    speed: "",
    caloriesBurned: "",
    notes: ""
  };
}

function createCardioDraft(cardio: CardioLogEntry): CardioDraft {
  const isKnownType = cardioTypes.includes(cardio.activityType as CardioType);

  return {
    id: cardio.id,
    activityType: isKnownType ? (cardio.activityType as CardioType) : "Custom",
    customActivityType: isKnownType ? "" : cardio.activityType,
    durationMinutes: String(cardio.durationMinutes),
    distance: formatOptionalNumber(cardio.distance),
    pace: cardio.pace ?? "",
    speed: formatOptionalNumber(cardio.speed),
    caloriesBurned: formatOptionalNumber(cardio.caloriesBurned),
    notes: cardio.notes ?? ""
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatSelectedDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function parseNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function summarizeMeals(meals: DailyLogDetails["meals"]) {
  return meals.reduce(
    (totals, meal) => ({
      calories: (totals.calories ?? 0) + (meal.calories ?? 0),
      proteinGrams: (totals.proteinGrams ?? 0) + (meal.proteinGrams ?? 0),
      carbGrams: (totals.carbGrams ?? 0) + (meal.carbGrams ?? 0),
      fatGrams: (totals.fatGrams ?? 0) + (meal.fatGrams ?? 0)
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbGrams: 0,
      fatGrams: 0
    }
  );
}

function formatMetric(value?: number, suffix = "") {
  if (typeof value !== "number" || value === 0) {
    return "--";
  }

  return `${Math.round(value)}${suffix}`;
}

const styles = StyleSheet.create({
  calendarCard: {
    marginTop: theme.spacing.xl
  },
  cardGap: {
    marginTop: theme.spacing.sm
  },
  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between"
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: "center",
    width: "13.2%"
  },
  dayCellMuted: {
    opacity: 0.38
  },
  dayCellSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  dayNumber: {
    marginBottom: theme.spacing.xxs
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    rowGap: theme.spacing.xs
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  iconRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  indicatorDot: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.pill,
    height: 4,
    width: 4
  },
  indicatorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    height: 10,
    justifyContent: "center",
    maxWidth: 22
  },
  innerCard: {
    backgroundColor: theme.colors.background
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xxs
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md
  },
  metric: {
    flexBasis: 86,
    flexGrow: 1
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  metricValue: {
    color: theme.colors.accent
  },
  monthControls: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  optionChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  optionChipSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  optionRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.lg
  },
  outsideMonthText: {
    color: theme.colors.textSubtle
  },
  pressed: {
    opacity: 0.72
  },
  sectionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  stack: {
    gap: theme.spacing.md
  },
  summaryPill: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  summaryStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md
  },
  switchLine: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    marginTop: theme.spacing.xs
  },
  todayText: {
    color: theme.colors.accent
  },
  weekdayLabel: {
    textAlign: "center",
    width: "13.2%"
  },
  weekdayRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg
  }
});
