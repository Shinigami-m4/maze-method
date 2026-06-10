import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { StateCard } from "../../components/StateCard";
import {
  addExerciseResourceLink,
  deleteExerciseResourceLink,
  deleteWorkoutRoutine,
  duplicateWorkoutRoutine,
  getWorkoutDashboardData,
  saveCustomExercise,
  saveExercisePersonalNotes,
  saveWorkoutRoutine,
  setWorkoutRoutineActive
} from "../../database/workoutRepository";
import { theme } from "../../theme/theme";
import {
  CustomExerciseInput,
  ExerciseLibraryItem,
  ExerciseResourceLink,
  MuscleGroup,
  muscleGroups,
  RoutineExercise,
  WorkoutDashboardData,
  WorkoutRoutineDetails
} from "../../types/workouts";
import { createLocalId } from "../../utils/id";
import { Chip } from "./components/Chip";
import { WorkoutField } from "./components/WorkoutField";
import { WorkoutModal } from "./components/WorkoutModal";

type GroupFilter = MuscleGroup | "All";

type RoutineDraft = {
  id: string;
  name: string;
  notes: string;
  muscleGroups: MuscleGroup[];
  isActive: boolean;
  exercises: RoutineExercise[];
};

type CustomExerciseDraft = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  defaultSets: string;
  defaultReps: string;
  instructions: string;
  customNotes: string;
};

const emptyDashboard: WorkoutDashboardData = {
  routines: [],
  exercises: [],
  recentWorkouts: [],
  personalRecords: []
};

const defaultCustomExerciseDraft: CustomExerciseDraft = {
  name: "",
  muscleGroup: "Chest",
  equipment: "",
  defaultSets: "3",
  defaultReps: "8-12",
  instructions: "",
  customNotes: ""
};

export function WorkoutsScreen() {
  const [dashboard, setDashboard] = useState<WorkoutDashboardData>(emptyDashboard);
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("All");
  const [librarySearch, setLibrarySearch] = useState("");
  const [routineSearch, setRoutineSearch] = useState("");
  const [routineDraft, setRoutineDraft] = useState<RoutineDraft | null>(null);
  const [customExerciseDraft, setCustomExerciseDraft] =
    useState<CustomExerciseDraft>(defaultCustomExerciseDraft);
  const [isCustomExerciseOpen, setIsCustomExerciseOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibraryItem | null>(null);
  const [exerciseNotesDraft, setExerciseNotesDraft] = useState("");
  const [linkDraft, setLinkDraft] = useState({ url: "", label: "", notes: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (selectedExerciseId?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextDashboard = await getWorkoutDashboardData();
      setDashboard(nextDashboard);

      if (selectedExerciseId) {
        const updatedExercise = nextDashboard.exercises.find((item) => item.id === selectedExerciseId);
        if (updatedExercise) {
          setSelectedExercise(updatedExercise);
          setExerciseNotesDraft(updatedExercise.customNotes ?? "");
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Workout data could not load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  const filteredExercises = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();

    return dashboard.exercises.filter((exercise) => {
      const matchesGroup = groupFilter === "All" || exercise.muscleGroup === groupFilter;
      const matchesSearch =
        !query ||
        exercise.name.toLowerCase().includes(query) ||
        exercise.equipment.toLowerCase().includes(query);

      return matchesGroup && matchesSearch;
    });
  }, [dashboard.exercises, groupFilter, librarySearch]);

  const routineCandidates = useMemo(() => {
    if (!routineDraft) {
      return [];
    }

    const query = routineSearch.trim().toLowerCase();

    return dashboard.exercises.filter((exercise) => {
      const matchesRoutineGroups =
        routineDraft.muscleGroups.length === 0 ||
        routineDraft.muscleGroups.includes(exercise.muscleGroup);
      const matchesSearch = !query || exercise.name.toLowerCase().includes(query);

      return matchesRoutineGroups && matchesSearch;
    });
  }, [dashboard.exercises, routineDraft, routineSearch]);

  const openRoutineEditor = (routine?: WorkoutRoutineDetails) => {
    const id = routine?.id ?? createLocalId("routine");

    setRoutineSearch("");
    setRoutineDraft({
      id,
      name: routine?.name ?? "",
      notes: routine?.notes ?? "",
      muscleGroups: routine?.muscleGroups ?? [],
      isActive: routine?.isActive ?? true,
      exercises:
        routine?.exercises.map((exercise) => ({
          ...exercise,
          routineId: id
        })) ?? []
    });
  };

  const openExerciseDetail = (exercise: ExerciseLibraryItem) => {
    setSelectedExercise(exercise);
    setExerciseNotesDraft(exercise.customNotes ?? "");
    setLinkDraft({ url: "", label: "", notes: "" });
  };

  const saveRoutineDraft = async () => {
    if (!routineDraft || !routineDraft.name.trim()) {
      Alert.alert("Routine name required", "Add a name before saving this routine.");
      return;
    }

    setIsSaving(true);
    try {
      await saveWorkoutRoutine({
        id: routineDraft.id,
        name: routineDraft.name.trim(),
        notes: routineDraft.notes.trim() || undefined,
        muscleGroups: routineDraft.muscleGroups,
        isActive: routineDraft.isActive,
        exercises: routineDraft.exercises.map((exercise, index) => ({
          ...exercise,
          orderIndex: index
        }))
      });
      setRoutineDraft(null);
      await loadDashboard();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoutine = (routineId: string) => {
    Alert.alert("Delete routine?", "This removes the routine and its exercise setup from this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteWorkoutRoutine(routineId).then(() => loadDashboard());
        }
      }
    ]);
  };

  const handleDuplicateRoutine = async (routineId: string) => {
    await duplicateWorkoutRoutine(routineId);
    await loadDashboard();
  };

  const handleToggleRoutineActive = async (routine: WorkoutRoutineDetails) => {
    await setWorkoutRoutineActive(routine.id, !routine.isActive);
    await loadDashboard();
  };

  const saveCustomExerciseDraft = async () => {
    if (!customExerciseDraft.name.trim()) {
      Alert.alert("Exercise name required", "Add a name before saving this custom exercise.");
      return;
    }

    const input: CustomExerciseInput = {
      name: customExerciseDraft.name.trim(),
      muscleGroup: customExerciseDraft.muscleGroup,
      equipment: customExerciseDraft.equipment.trim() || "Custom",
      defaultSets: parseNumber(customExerciseDraft.defaultSets, 3),
      defaultReps: customExerciseDraft.defaultReps.trim() || "8-12",
      instructions:
        customExerciseDraft.instructions.trim() ||
        "Use controlled form and adjust loading to match the goal.",
      customNotes: customExerciseDraft.customNotes.trim() || undefined
    };

    await saveCustomExercise(input);
    setCustomExerciseDraft(defaultCustomExerciseDraft);
    setIsCustomExerciseOpen(false);
    await loadDashboard();
  };

  const handleSaveExerciseNotes = async () => {
    if (!selectedExercise) {
      return;
    }

    await saveExercisePersonalNotes(selectedExercise, exerciseNotesDraft);
    await loadDashboard(selectedExercise.id);
  };

  const handleAddResourceLink = async () => {
    if (!selectedExercise || !linkDraft.url.trim()) {
      Alert.alert("URL required", "Add a TikTok, Instagram, YouTube, or web URL.");
      return;
    }

    const url = normalizeUrl(linkDraft.url);
    const label = linkDraft.label.trim() || suggestResourceLabel(url);

    await addExerciseResourceLink(selectedExercise.id, {
      url,
      label,
      notes: linkDraft.notes.trim() || undefined
    });
    setLinkDraft({ url: "", label: "", notes: "" });
    await loadDashboard(selectedExercise.id);
  };

  const handleDeleteResourceLink = async (linkId: string) => {
    if (!selectedExercise) {
      return;
    }

    await deleteExerciseResourceLink(linkId);
    await loadDashboard(selectedExercise.id);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <AppText muted variant="caption">
            Every Rep Has Direction
          </AppText>
          <AppText style={styles.title} variant="title">
            Workouts
          </AppText>
        </View>
        <PrimaryButton icon="add" label="Routine" onPress={() => openRoutineEditor()} />
      </View>

      {isLoading ? (
        <StateCard
          body="Loading local routines, exercise library, recent workouts, and personal records."
          isLoading
          title="Loading workouts"
          variant="loading"
        />
      ) : null}

      {errorMessage ? (
        <StateCard
          actionLabel="Retry"
          body={errorMessage}
          onAction={() => void loadDashboard()}
          title="Workout data unavailable"
          variant="error"
        />
      ) : null}

      <SectionHeader title="My Routines" />
      {dashboard.routines.length === 0 ? (
        <EmptyState
          icon="repeat-outline"
          title="No routines yet"
          value="Create your first path with exercises, sets, reps, rest, and notes."
        />
      ) : (
        <View style={styles.stack}>
          {dashboard.routines.map((routine) => (
            <RoutineCard
              key={routine.id}
              onDelete={() => handleDeleteRoutine(routine.id)}
              onDuplicate={() => void handleDuplicateRoutine(routine.id)}
              onEdit={() => openRoutineEditor(routine)}
              onToggleActive={() => void handleToggleRoutineActive(routine)}
              routine={routine}
            />
          ))}
        </View>
      )}

      <SectionHeader title="Exercise Library" />
      <View style={styles.sectionActions}>
        <WorkoutField
          label="Search"
          onChangeText={setLibrarySearch}
          placeholder="Bench, cable, row..."
          value={librarySearch}
          style={styles.searchField}
        />
        <PrimaryButton
          icon="add"
          label="Custom"
          onPress={() => setIsCustomExerciseOpen(true)}
          variant="ghost"
        />
      </View>
      <HorizontalChips
        labels={["All", ...muscleGroups]}
        onSelect={(label) => setGroupFilter(label as GroupFilter)}
        selected={groupFilter}
      />
      <View style={styles.stack}>
        {filteredExercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onPress={() => openExerciseDetail(exercise)}
          />
        ))}
      </View>

      <SectionHeader title="Recent Workouts" />
      {dashboard.recentWorkouts.length === 0 ? (
        <EmptyState
          icon="barbell-outline"
          title="No logged workouts"
          value="Workout logs from future sessions will appear here."
        />
      ) : (
        <View style={styles.stack}>
          {dashboard.recentWorkouts.map((workout) => (
            <Card key={workout.id}>
              <AppText variant="subheading">{formatDateLabel(workout.startedAt)}</AppText>
              {workout.notes ? <AppText muted>{workout.notes}</AppText> : null}
            </Card>
          ))}
        </View>
      )}

      <SectionHeader title="Personal Records" />
      {dashboard.personalRecords.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="No PRs saved"
          value="PR flags and logged records will summarize here."
        />
      ) : (
        <View style={styles.stack}>
          {dashboard.personalRecords.map((record) => (
            <Card key={record.id}>
              <AppText variant="subheading">{record.exerciseName}</AppText>
              <AppText muted>
                {record.value} {record.units ?? ""} · {record.recordType}
              </AppText>
            </Card>
          ))}
        </View>
      )}

      <RoutineEditorModal
        candidateExercises={routineCandidates}
        draft={routineDraft}
        isSaving={isSaving}
        onAddExercise={(exercise) => {
          setRoutineDraft((current) => (current ? addExerciseToRoutine(current, exercise) : current));
        }}
        onChangeDraft={setRoutineDraft}
        onClose={() => setRoutineDraft(null)}
        onSave={() => void saveRoutineDraft()}
        routineSearch={routineSearch}
        setRoutineSearch={setRoutineSearch}
      />

      <CustomExerciseModal
        draft={customExerciseDraft}
        onChangeDraft={setCustomExerciseDraft}
        onClose={() => setIsCustomExerciseOpen(false)}
        onSave={() => void saveCustomExerciseDraft()}
        visible={isCustomExerciseOpen}
      />

      <ExerciseDetailModal
        exercise={selectedExercise}
        linkDraft={linkDraft}
        notesDraft={exerciseNotesDraft}
        onAddLink={() => void handleAddResourceLink()}
        onChangeLinkDraft={(nextLinkDraft) => setLinkDraft(nextLinkDraft)}
        onChangeNotes={setExerciseNotesDraft}
        onClose={() => setSelectedExercise(null)}
        onDeleteLink={(linkId) => void handleDeleteResourceLink(linkId)}
        onOpenLink={(url) => void openExternalLink(url)}
        onSaveNotes={() => void handleSaveExerciseNotes()}
      />
    </Screen>
  );
}

function RoutineCard({
  routine,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive
}: {
  routine: WorkoutRoutineDetails;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <Card accent={routine.isActive}>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">{routine.name}</AppText>
          <AppText muted>
            {routine.exercises.length} exercises · {routine.isActive ? "Active" : "Inactive"}
          </AppText>
        </View>
        <View style={styles.statusPill}>
          <AppText variant="caption">{routine.isActive ? "Active" : "Off"}</AppText>
        </View>
      </View>
      {routine.notes ? <AppText muted style={styles.cardGap}>{routine.notes}</AppText> : null}
      <AppText subtle style={styles.cardGap} variant="caption">
        {routine.muscleGroups.length ? routine.muscleGroups.join(" · ") : "No muscle groups selected"}
      </AppText>
      {routine.exercises.slice(0, 4).map((exercise, index) => (
        <AppText key={exercise.id} muted>
          {index + 1}. {exercise.exerciseName} · {exercise.sets} x {exercise.reps}
        </AppText>
      ))}
      {routine.exercises.length > 4 ? (
        <AppText subtle>+{routine.exercises.length - 4} more</AppText>
      ) : null}
      <View style={styles.actionRow}>
        <SmallAction icon="create-outline" label="Edit" onPress={onEdit} />
        <SmallAction icon="copy-outline" label="Duplicate" onPress={onDuplicate} />
        <SmallAction
          icon={routine.isActive ? "pause-outline" : "play-outline"}
          label={routine.isActive ? "Deactivate" : "Activate"}
          onPress={onToggleActive}
        />
        <SmallAction destructive icon="trash-outline" label="Delete" onPress={onDelete} />
      </View>
    </Card>
  );
}

function ExerciseCard({
  exercise,
  onPress
}: {
  exercise: ExerciseLibraryItem;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Card>
        <View style={styles.cardTopRow}>
          <View style={styles.flex}>
            <AppText variant="subheading">{exercise.name}</AppText>
            <AppText muted>
              {exercise.muscleGroup} · {exercise.equipment}
            </AppText>
          </View>
          <Ionicons color={theme.colors.accent} name="chevron-forward" size={18} />
        </View>
        <AppText muted style={styles.cardGap}>
          {exercise.defaultSets} sets · {exercise.defaultReps} reps
        </AppText>
        <AppText subtle>{exercise.instructions}</AppText>
        <View style={styles.metaRow}>
          {exercise.isBuiltIn ? <MetaPill label="Built-in" /> : <MetaPill label="Custom" />}
          {exercise.customNotes ? <MetaPill label="Notes" /> : null}
          {exercise.resourceLinks.length ? <MetaPill label={`${exercise.resourceLinks.length} links`} /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

function RoutineEditorModal({
  draft,
  candidateExercises,
  routineSearch,
  setRoutineSearch,
  isSaving,
  onChangeDraft,
  onAddExercise,
  onClose,
  onSave
}: {
  draft: RoutineDraft | null;
  candidateExercises: ExerciseLibraryItem[];
  routineSearch: string;
  setRoutineSearch: (value: string) => void;
  isSaving: boolean;
  onChangeDraft: (draft: RoutineDraft | null) => void;
  onAddExercise: (exercise: ExerciseLibraryItem) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<RoutineDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <WorkoutModal visible={Boolean(draft)} title="Routine Builder" onClose={onClose}>
      {draft ? (
        <>
          <WorkoutField
            label="Routine name"
            onChangeText={(name) => updateDraft({ name })}
            placeholder="Push Strength"
            value={draft.name}
          />
          <WorkoutField
            label="Routine notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Focus, tempo, warm-up, or intent."
            value={draft.notes}
          />
          <View style={styles.switchRow}>
            <View>
              <AppText variant="subheading">Active routine</AppText>
              <AppText muted>Inactive routines stay saved but are not highlighted.</AppText>
            </View>
            <Switch
              ios_backgroundColor={theme.colors.surfaceRaised}
              onValueChange={(isActive) => updateDraft({ isActive })}
              thumbColor={theme.colors.text}
              trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
              value={draft.isActive}
            />
          </View>

          <AppText muted variant="caption">
            Muscle groups
          </AppText>
          <HorizontalChips
            labels={muscleGroups}
            onSelect={(label) =>
              updateDraft({ muscleGroups: toggleArrayItem(draft.muscleGroups, label as MuscleGroup) })
            }
            selectedItems={draft.muscleGroups}
          />

          <AppText variant="heading">Routine exercises</AppText>
          {draft.exercises.length === 0 ? (
            <EmptyState
              icon="add-circle-outline"
              title="No exercises added"
              value="Add exercises from the library below."
            />
          ) : (
            <View style={styles.stack}>
              {draft.exercises.map((exercise, index) => (
                <RoutineExerciseEditor
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  onMoveDown={() => updateDraft({ exercises: moveRoutineExercise(draft.exercises, index, 1) })}
                  onMoveUp={() => updateDraft({ exercises: moveRoutineExercise(draft.exercises, index, -1) })}
                  onRemove={() => updateDraft({ exercises: draft.exercises.filter((item) => item.id !== exercise.id) })}
                  onUpdate={(updates) =>
                    updateDraft({
                      exercises: draft.exercises.map((item) =>
                        item.id === exercise.id ? { ...item, ...updates } : item
                      )
                    })
                  }
                />
              ))}
            </View>
          )}

          <AppText variant="heading">Add exercises</AppText>
          <WorkoutField
            label="Search library"
            onChangeText={setRoutineSearch}
            placeholder="Search exercises"
            value={routineSearch}
          />
          <View style={styles.stack}>
            {candidateExercises.slice(0, 30).map((exercise) => (
              <Card key={exercise.id}>
                <View style={styles.cardTopRow}>
                  <View style={styles.flex}>
                    <AppText variant="subheading">{exercise.name}</AppText>
                    <AppText muted>
                      {exercise.muscleGroup} · {exercise.equipment}
                    </AppText>
                  </View>
                  <PrimaryButton icon="add" label="Add" onPress={() => onAddExercise(exercise)} />
                </View>
              </Card>
            ))}
          </View>

          <PrimaryButton
            disabled={isSaving}
            icon="save-outline"
            label={isSaving ? "Saving" : "Save Routine"}
            onPress={onSave}
            style={styles.fullWidthButton}
          />
        </>
      ) : null}
    </WorkoutModal>
  );
}

function RoutineExerciseEditor({
  exercise,
  index,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onRemove
}: {
  exercise: RoutineExercise;
  index: number;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <Card>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">
            {index + 1}. {exercise.exerciseName}
          </AppText>
          <AppText muted>
            {exercise.muscleGroup} · {exercise.equipment ?? "Equipment"}
          </AppText>
        </View>
        <View style={styles.iconRow}>
          <IconButton accessibilityLabel="Move up" icon="chevron-up" onPress={onMoveUp} />
          <IconButton accessibilityLabel="Move down" icon="chevron-down" onPress={onMoveDown} />
          <IconButton accessibilityLabel="Remove exercise" icon="trash-outline" onPress={onRemove} />
        </View>
      </View>

      <View style={styles.formGrid}>
        <WorkoutField
          keyboardType="number-pad"
          label="Sets"
          onChangeText={(sets) => onUpdate({ sets: parseNumber(sets, 0) })}
          value={String(exercise.sets)}
        />
        <WorkoutField
          label="Reps"
          onChangeText={(reps) => onUpdate({ reps })}
          value={exercise.reps}
        />
        <WorkoutField
          keyboardType="decimal-pad"
          label="Weight"
          onChangeText={(weight) => onUpdate({ weight: parseOptionalNumber(weight) })}
          placeholder="Optional"
          value={formatOptionalNumber(exercise.weight)}
        />
        <WorkoutField
          keyboardType="number-pad"
          label="Rest sec"
          onChangeText={(restSeconds) => onUpdate({ restSeconds: parseOptionalNumber(restSeconds) })}
          placeholder="90"
          value={formatOptionalNumber(exercise.restSeconds)}
        />
      </View>
      <WorkoutField
        label="Exercise notes"
        multiline
        onChangeText={(notes) => onUpdate({ notes })}
        placeholder="Cues, setup, tempo, or target load."
        value={exercise.notes ?? ""}
      />
      <View style={styles.switchRow}>
        <AppText>PR flag</AppText>
        <Switch
          ios_backgroundColor={theme.colors.surfaceRaised}
          onValueChange={(isPersonalRecord) => onUpdate({ isPersonalRecord })}
          thumbColor={theme.colors.text}
          trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
          value={exercise.isPersonalRecord}
        />
      </View>
      <View style={styles.switchRow}>
        <AppText>Completed</AppText>
        <Switch
          ios_backgroundColor={theme.colors.surfaceRaised}
          onValueChange={(isCompleted) => onUpdate({ isCompleted })}
          thumbColor={theme.colors.text}
          trackColor={{ false: theme.colors.surfaceRaised, true: theme.colors.accent }}
          value={exercise.isCompleted}
        />
      </View>
    </Card>
  );
}

function CustomExerciseModal({
  visible,
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  visible: boolean;
  draft: CustomExerciseDraft;
  onChangeDraft: (draft: CustomExerciseDraft) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<CustomExerciseDraft>) => {
    onChangeDraft({ ...draft, ...updates });
  };

  return (
    <WorkoutModal visible={visible} title="Custom Exercise" onClose={onClose}>
      <WorkoutField
        label="Exercise name"
        onChangeText={(name) => updateDraft({ name })}
        placeholder="Machine Row Variation"
        value={draft.name}
      />
      <AppText muted variant="caption">
        Muscle group
      </AppText>
      <HorizontalChips
        labels={muscleGroups}
        onSelect={(label) => updateDraft({ muscleGroup: label as MuscleGroup })}
        selected={draft.muscleGroup}
      />
      <WorkoutField
        label="Equipment"
        onChangeText={(equipment) => updateDraft({ equipment })}
        placeholder="Cable, dumbbells, machine..."
        value={draft.equipment}
      />
      <View style={styles.formGrid}>
        <WorkoutField
          keyboardType="number-pad"
          label="Default sets"
          onChangeText={(defaultSets) => updateDraft({ defaultSets })}
          value={draft.defaultSets}
        />
        <WorkoutField
          label="Default reps"
          onChangeText={(defaultReps) => updateDraft({ defaultReps })}
          value={draft.defaultReps}
        />
      </View>
      <WorkoutField
        label="Instructions"
        multiline
        onChangeText={(instructions) => updateDraft({ instructions })}
        placeholder="Setup, movement path, and form cues."
        value={draft.instructions}
      />
      <WorkoutField
        label="Personal notes"
        multiline
        onChangeText={(customNotes) => updateDraft({ customNotes })}
        placeholder="Your machine setup, seat height, or trainer cue."
        value={draft.customNotes}
      />
      <PrimaryButton icon="save-outline" label="Save Exercise" onPress={onSave} />
    </WorkoutModal>
  );
}

function ExerciseDetailModal({
  exercise,
  notesDraft,
  linkDraft,
  onChangeNotes,
  onChangeLinkDraft,
  onSaveNotes,
  onAddLink,
  onDeleteLink,
  onOpenLink,
  onClose
}: {
  exercise: ExerciseLibraryItem | null;
  notesDraft: string;
  linkDraft: { url: string; label: string; notes: string };
  onChangeNotes: (value: string) => void;
  onChangeLinkDraft: (draft: { url: string; label: string; notes: string }) => void;
  onSaveNotes: () => void;
  onAddLink: () => void;
  onDeleteLink: (linkId: string) => void;
  onOpenLink: (url: string) => void;
  onClose: () => void;
}) {
  return (
    <WorkoutModal visible={Boolean(exercise)} title="Exercise Details" onClose={onClose}>
      {exercise ? (
        <>
          <Card accent>
            <AppText variant="heading">{exercise.name}</AppText>
            <AppText muted style={styles.cardGap}>
              {exercise.muscleGroup} · {exercise.equipment}
            </AppText>
            <AppText muted>
              Suggested: {exercise.defaultSets} sets · {exercise.defaultReps} reps
            </AppText>
            <AppText style={styles.cardGap}>{exercise.instructions}</AppText>
          </Card>

          <WorkoutField
            label="Personal notes"
            multiline
            onChangeText={onChangeNotes}
            placeholder="Your cues, setup reminders, or mistakes to avoid."
            value={notesDraft}
          />
          <PrimaryButton icon="save-outline" label="Save Notes" onPress={onSaveNotes} />

          <AppText variant="heading">Resource links</AppText>
          {exercise.resourceLinks.length === 0 ? (
            <EmptyState
              icon="link-outline"
              title="No links yet"
              value="Add TikTok, Instagram Reel, YouTube, or other form resources."
            />
          ) : (
            <View style={styles.stack}>
              {exercise.resourceLinks.map((link) => (
                <ResourceLinkCard
                  key={link.id}
                  link={link}
                  onDelete={() => onDeleteLink(link.id)}
                  onOpen={() => onOpenLink(link.url)}
                />
              ))}
            </View>
          )}

          <WorkoutField
            autoCapitalize="none"
            keyboardType="url"
            label="URL"
            onChangeText={(url) => {
              const suggested = !linkDraft.label ? suggestResourceLabel(normalizeUrl(url)) : linkDraft.label;
              onChangeLinkDraft({ ...linkDraft, url, label: suggested });
            }}
            placeholder="https://youtube.com/..."
            value={linkDraft.url}
          />
          <WorkoutField
            label="Label"
            onChangeText={(label) => onChangeLinkDraft({ ...linkDraft, label })}
            placeholder="Good form example"
            value={linkDraft.label}
          />
          <WorkoutField
            label="Link notes"
            multiline
            onChangeText={(notes) => onChangeLinkDraft({ ...linkDraft, notes })}
            placeholder="What to watch for in this clip."
            value={linkDraft.notes}
          />
          <PrimaryButton icon="add" label="Add Link" onPress={onAddLink} />
        </>
      ) : null}
    </WorkoutModal>
  );
}

function ResourceLinkCard({
  link,
  onOpen,
  onDelete
}: {
  link: ExerciseResourceLink;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">{link.label}</AppText>
          <AppText muted numberOfLines={1}>
            {link.url}
          </AppText>
        </View>
        <View style={styles.iconRow}>
          <IconButton accessibilityLabel="Open link" icon="open-outline" onPress={onOpen} />
          <IconButton accessibilityLabel="Delete link" icon="trash-outline" onPress={onDelete} />
        </View>
      </View>
      {link.notes ? <AppText muted style={styles.cardGap}>{link.notes}</AppText> : null}
    </Card>
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

function SmallAction({
  icon,
  label,
  destructive = false,
  onPress
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  destructive?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, destructive && styles.destructiveAction, pressed && styles.pressed]}
    >
      <Ionicons color={destructive ? theme.colors.danger : theme.colors.text} name={icon} size={16} />
      <AppText style={destructive && styles.destructiveText} variant="caption">
        {label}
      </AppText>
    </Pressable>
  );
}

function MetaPill({ label }: { label: string }) {
  return (
    <View style={styles.metaPill}>
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

function HorizontalChips({
  labels,
  selected,
  selectedItems,
  onSelect
}: {
  labels: string[];
  selected?: string;
  selectedItems?: string[];
  onSelect: (label: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chipRow}>
        {labels.map((label) => (
          <Chip
            key={label}
            label={label}
            onPress={() => onSelect(label)}
            selected={selected === label || Boolean(selectedItems?.includes(label))}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function addExerciseToRoutine(draft: RoutineDraft, exercise: ExerciseLibraryItem): RoutineDraft {
  const newExercise: RoutineExercise = {
    id: createLocalId("routine-exercise"),
    routineId: draft.id,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    orderIndex: draft.exercises.length,
    sets: exercise.defaultSets,
    reps: exercise.defaultReps,
    restSeconds: 90,
    isPersonalRecord: false,
    isCompleted: false
  };

  return {
    ...draft,
    muscleGroups: draft.muscleGroups.includes(exercise.muscleGroup)
      ? draft.muscleGroups
      : [...draft.muscleGroups, exercise.muscleGroup],
    exercises: [...draft.exercises, newExercise]
  };
}

function moveRoutineExercise(exercises: RoutineExercise[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction;

  if (nextIndex < 0 || nextIndex >= exercises.length) {
    return exercises;
  }

  const next = [...exercises];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

  return next.map((exercise, orderIndex) => ({ ...exercise, orderIndex }));
}

function toggleArrayItem<T>(items: T[], item: T) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
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

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function suggestResourceLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace("www.", "");

    if (host.includes("youtube") || host.includes("youtu.be")) {
      return "YouTube form guide";
    }

    if (host.includes("tiktok")) {
      return "TikTok form example";
    }

    if (host.includes("instagram")) {
      return "Instagram Reel";
    }

    return "Training resource";
  } catch {
    return "Training resource";
  }
}

async function openExternalLink(url: string) {
  const normalized = normalizeUrl(url);
  const canOpen = await Linking.canOpenURL(normalized);

  if (!canOpen) {
    Alert.alert("Cannot open link", "This URL is not supported on this device.");
    return;
  }

  await Linking.openURL(normalized);
}

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md
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
  chipRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.lg
  },
  destructiveAction: {
    borderColor: "rgba(239, 68, 68, 0.35)"
  },
  destructiveText: {
    color: theme.colors.danger
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
  fullWidthButton: {
    marginTop: theme.spacing.md
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
  metaPill: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md
  },
  pressed: {
    opacity: 0.76
  },
  searchField: {
    minWidth: 170
  },
  sectionActions: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md
  },
  smallAction: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: 36,
    paddingHorizontal: theme.spacing.sm
  },
  stack: {
    gap: theme.spacing.md
  },
  statusPill: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accentBorder,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs
  },
  switchRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between",
    padding: theme.spacing.md
  },
  title: {
    marginTop: theme.spacing.xs
  }
});
