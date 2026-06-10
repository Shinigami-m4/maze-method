import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ProgressBar } from "../../components/ProgressBar";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { StateCard } from "../../components/StateCard";
import {
  deleteDailyMacroTotal,
  deleteMeal,
  getNutritionDay,
  saveDailyMacroTotal,
  saveMeal
} from "../../database/nutritionRepository";
import { theme } from "../../theme/theme";
import { MealLog } from "../../types/models";
import { BottomTabParamList } from "../../types/navigation";
import {
  MacroTotals,
  mealCategories,
  MealCategory,
  MealInput,
  NutritionDay
} from "../../types/nutrition";
import { NutritionField } from "./components/NutritionField";
import { NutritionModal } from "./components/NutritionModal";

type Props = BottomTabScreenProps<BottomTabParamList, "Nutrition">;

type MealDraft = {
  id?: string;
  mealName: string;
  mealCategory: MealCategory;
  calories: string;
  proteinGrams: string;
  carbGrams: string;
  fatGrams: string;
  notes: string;
};

type MacroDraft = {
  calories: string;
  proteinGrams: string;
  carbGrams: string;
  fatGrams: string;
};

const emptyTotals: MacroTotals = {
  calories: 0,
  proteinGrams: 0,
  carbGrams: 0,
  fatGrams: 0
};

export function NutritionScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [nutritionDay, setNutritionDay] = useState<NutritionDay | null>(null);
  const [mealDraft, setMealDraft] = useState<MealDraft | null>(null);
  const [macroDraft, setMacroDraft] = useState<MacroDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNutritionDay = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextDay = await getNutritionDay(selectedDate);
      setNutritionDay(nextDay);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Nutrition data could not load.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useFocusEffect(
    useCallback(() => {
      void loadNutritionDay();
    }, [loadNutritionDay])
  );

  const groupedMeals = useMemo(() => {
    const groups = new Map<MealCategory, MealLog[]>();
    mealCategories.forEach((category) => groups.set(category, []));

    nutritionDay?.meals.forEach((meal) => {
      const category = meal.mealCategory ?? "Snack";
      groups.set(category, [...(groups.get(category) ?? []), meal]);
    });

    return groups;
  }, [nutritionDay?.meals]);

  const consumed = nutritionDay?.consumedTotals ?? emptyTotals;
  const targets = nutritionDay?.targets;

  const handleSaveMeal = async () => {
    if (!mealDraft || !mealDraft.mealName.trim()) {
      Alert.alert("Meal name required", "Add a meal name before saving.");
      return;
    }

    const input: MealInput = {
      id: mealDraft.id,
      date: selectedDate,
      mealName: mealDraft.mealName.trim(),
      mealCategory: mealDraft.mealCategory,
      calories: parseOptionalNumber(mealDraft.calories),
      proteinGrams: parseOptionalNumber(mealDraft.proteinGrams),
      carbGrams: parseOptionalNumber(mealDraft.carbGrams),
      fatGrams: parseOptionalNumber(mealDraft.fatGrams),
      notes: mealDraft.notes.trim() || undefined
    };

    await saveMeal(input);
    setMealDraft(null);
    await loadNutritionDay();
  };

  const handleDeleteMeal = (mealId: string) => {
    Alert.alert("Delete meal?", "This removes the meal log from this phone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void deleteMeal(mealId).then(loadNutritionDay);
        }
      }
    ]);
  };

  const handleSaveDailyTotals = async () => {
    if (!macroDraft) {
      return;
    }

    await saveDailyMacroTotal({
      date: selectedDate,
      calories: parseOptionalNumber(macroDraft.calories),
      proteinGrams: parseOptionalNumber(macroDraft.proteinGrams),
      carbGrams: parseOptionalNumber(macroDraft.carbGrams),
      fatGrams: parseOptionalNumber(macroDraft.fatGrams)
    });
    setMacroDraft(null);
    await loadNutritionDay();
  };

  const handleClearDailyTotals = () => {
    Alert.alert("Clear daily total?", "Meal logs will remain, but the manual macro total will be removed.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => {
          void deleteDailyMacroTotal(selectedDate).then(loadNutritionDay);
        }
      }
    ]);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View>
          <AppText muted variant="caption">
            Every Rep Has Direction
          </AppText>
          <AppText style={styles.title} variant="title">
            Nutrition
          </AppText>
        </View>
        <View style={styles.dateControls}>
          <IconButton
            accessibilityLabel="Previous day"
            icon="chevron-back"
            onPress={() => setSelectedDate(addDays(selectedDate, -1))}
          />
          <IconButton
            accessibilityLabel="Next day"
            icon="chevron-forward"
            onPress={() => setSelectedDate(addDays(selectedDate, 1))}
          />
        </View>
      </View>

      {isLoading ? (
        <StateCard
          body="Loading local meals, macros, and targets."
          isLoading
          title="Loading nutrition"
          variant="loading"
        />
      ) : null}

      {errorMessage ? (
        <StateCard
          actionLabel="Retry"
          body={errorMessage}
          onAction={() => void loadNutritionDay()}
          title="Nutrition unavailable"
          variant="error"
        />
      ) : null}

      <Card accent style={styles.heroCard}>
        <View style={styles.cardTopRow}>
          <View>
            <AppText muted variant="caption">
              {formatSelectedDate(selectedDate)}
            </AppText>
            <AppText style={styles.heroNumber} variant="title">
              {Math.round(consumed.calories)}
            </AppText>
            <AppText muted>
              of {targets?.calories ?? "--"} target calories
            </AppText>
          </View>
          <PrimaryButton
            icon="today-outline"
            label="Today"
            onPress={() => setSelectedDate(toDateKey(new Date()))}
            variant="ghost"
          />
        </View>
      </Card>

      <SectionHeader title="Daily Macro Summary" />
      <View style={styles.stack}>
        <MacroProgressCard
          label="Calories"
          consumed={consumed.calories}
          target={targets?.calories ?? 0}
          unit=""
        />
        <MacroProgressCard
          label="Protein"
          consumed={consumed.proteinGrams}
          target={targets?.proteinGrams ?? 0}
          unit="g"
        />
        <MacroProgressCard
          label="Carbs"
          consumed={consumed.carbGrams}
          target={targets?.carbGrams ?? 0}
          unit="g"
        />
        <MacroProgressCard
          label="Fats"
          consumed={consumed.fatGrams}
          target={targets?.fatGrams ?? 0}
          unit="g"
        />
      </View>

      <View style={styles.actionRow}>
        <PrimaryButton icon="add" label="Meal" onPress={() => setMealDraft(createMealDraft())} />
        <PrimaryButton
          icon="calculator-outline"
          label="Daily Total"
          onPress={() => setMacroDraft(createMacroDraft(nutritionDay))}
          variant="ghost"
        />
      </View>

      {nutritionDay?.manualTotals ? (
        <Card style={styles.manualTotalCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.flex}>
              <AppText variant="subheading">Manual daily total active</AppText>
              <AppText muted>
                Macro summary is using your daily total entry instead of meal sums for filled fields.
              </AppText>
            </View>
            <IconButton
              accessibilityLabel="Clear daily total"
              icon="trash-outline"
              onPress={handleClearDailyTotals}
            />
          </View>
        </Card>
      ) : null}

      <SectionHeader title="Meals" />
      {mealCategories.map((category) => (
        <MealCategorySection
          key={category}
          category={category}
          meals={groupedMeals.get(category) ?? []}
          onAddMeal={() => setMealDraft(createMealDraft(category))}
          onDeleteMeal={handleDeleteMeal}
          onEditMeal={(meal) => setMealDraft(createMealDraftFromMeal(meal))}
        />
      ))}

      <SectionHeader title="Target Calculation" />
      <Card>
        <View style={styles.metricGrid}>
          <Metric label="Maintenance" value={formatNumber(targets?.maintenanceCalories)} />
          <Metric label="Goal calories" value={formatNumber(targets?.goalCalories)} />
          <Metric label="Protein" value={formatNumber(targets?.proteinGrams, "g")} />
          <Metric label="Carbs" value={formatNumber(targets?.carbGrams, "g")} />
          <Metric label="Fats" value={formatNumber(targets?.fatGrams, "g")} />
        </View>
        <AppText muted style={styles.cardGap}>
          {targets?.formulaNote}
        </AppText>
      </Card>

      <SectionHeader title="Future Tools" />
      <View style={styles.stack}>
        <PlaceholderCard
          icon="sparkles-outline"
          title="Maze Coach meal recommendations"
          value="Future backend/OpenAI integration belongs on a server, not inside the mobile app."
        />
      </View>

      <MealModal
        draft={mealDraft}
        onChangeDraft={setMealDraft}
        onClose={() => setMealDraft(null)}
        onSave={() => void handleSaveMeal()}
      />
      <DailyTotalModal
        draft={macroDraft}
        onChangeDraft={setMacroDraft}
        onClose={() => setMacroDraft(null)}
        onSave={() => void handleSaveDailyTotals()}
      />
    </Screen>
  );
}

function MacroProgressCard({
  label,
  consumed,
  target,
  unit
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
}) {
  const progress = target > 0 ? consumed / target : 0;
  const remaining = Math.max(0, target - consumed);

  return (
    <Card>
      <View style={styles.cardTopRow}>
        <View>
          <AppText variant="subheading">{label}</AppText>
          <AppText muted>
            {formatNumber(consumed, unit)} / {formatNumber(target, unit)}
          </AppText>
        </View>
        <AppText style={styles.remainingText} variant="caption">
          {formatNumber(remaining, unit)} left
        </AppText>
      </View>
      <View style={styles.progressWrap}>
        <ProgressBar value={progress} />
      </View>
    </Card>
  );
}

function MealCategorySection({
  category,
  meals,
  onAddMeal,
  onEditMeal,
  onDeleteMeal
}: {
  category: MealCategory;
  meals: MealLog[];
  onAddMeal: () => void;
  onEditMeal: (meal: MealLog) => void;
  onDeleteMeal: (mealId: string) => void;
}) {
  const totals = meals.reduce<MacroTotals>(
    (sum, meal) => ({
      calories: sum.calories + (meal.calories ?? 0),
      proteinGrams: sum.proteinGrams + (meal.proteinGrams ?? 0),
      carbGrams: sum.carbGrams + (meal.carbGrams ?? 0),
      fatGrams: sum.fatGrams + (meal.fatGrams ?? 0)
    }),
    { calories: 0, proteinGrams: 0, carbGrams: 0, fatGrams: 0 }
  );

  return (
    <Card style={styles.categoryCard}>
      <View style={styles.cardTopRow}>
        <View>
          <AppText variant="subheading">{category}</AppText>
          <AppText muted>
            {meals.length} meals - {Math.round(totals.calories)} calories
          </AppText>
        </View>
        <PrimaryButton icon="add" label="Add" onPress={onAddMeal} variant="ghost" />
      </View>
      {meals.length === 0 ? (
        <AppText muted style={styles.cardGap}>
          No {category.toLowerCase()} logged.
        </AppText>
      ) : (
        <View style={[styles.stack, styles.cardGap]}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDelete={() => onDeleteMeal(meal.id)}
              onEdit={() => onEditMeal(meal)}
            />
          ))}
        </View>
      )}
    </Card>
  );
}

function MealCard({
  meal,
  onEdit,
  onDelete
}: {
  meal: MealLog;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card style={styles.innerCard}>
      <View style={styles.cardTopRow}>
        <View style={styles.flex}>
          <AppText variant="subheading">{meal.mealName}</AppText>
          <AppText muted>
            {formatNumber(meal.calories)} cal - {formatNumber(meal.proteinGrams, "g")} protein
          </AppText>
        </View>
        <View style={styles.iconRow}>
          <IconButton accessibilityLabel="Edit meal" icon="create-outline" onPress={onEdit} />
          <IconButton accessibilityLabel="Delete meal" icon="trash-outline" onPress={onDelete} />
        </View>
      </View>
      <AppText muted style={styles.cardGap}>
        C {formatNumber(meal.carbGrams, "g")} - F {formatNumber(meal.fatGrams, "g")}
      </AppText>
      {meal.notes ? <AppText style={styles.cardGap}>{meal.notes}</AppText> : null}
    </Card>
  );
}

function MealModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: MealDraft | null;
  onChangeDraft: (draft: MealDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<MealDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <NutritionModal visible={Boolean(draft)} title="Meal Log" onClose={onClose}>
      {draft ? (
        <>
          <NutritionField
            label="Meal name"
            onChangeText={(mealName) => updateDraft({ mealName })}
            placeholder="Greek yogurt bowl"
            value={draft.mealName}
          />
          <AppText muted variant="caption">
            Category
          </AppText>
          <View style={styles.categoryOptions}>
            {mealCategories.map((category) => (
              <OptionPill
                key={category}
                label={category}
                onPress={() => updateDraft({ mealCategory: category })}
                selected={draft.mealCategory === category}
              />
            ))}
          </View>
          <View style={styles.formGrid}>
            <NutritionField
              keyboardType="number-pad"
              label="Calories"
              onChangeText={(calories) => updateDraft({ calories })}
              value={draft.calories}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Protein g"
              onChangeText={(proteinGrams) => updateDraft({ proteinGrams })}
              value={draft.proteinGrams}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Carbs g"
              onChangeText={(carbGrams) => updateDraft({ carbGrams })}
              value={draft.carbGrams}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Fats g"
              onChangeText={(fatGrams) => updateDraft({ fatGrams })}
              value={draft.fatGrams}
            />
          </View>
          <NutritionField
            label="Notes"
            multiline
            onChangeText={(notes) => updateDraft({ notes })}
            placeholder="Serving size, prep notes, or substitutions."
            value={draft.notes}
          />
          <PrimaryButton icon="save-outline" label="Save Meal" onPress={onSave} />
        </>
      ) : null}
    </NutritionModal>
  );
}

function DailyTotalModal({
  draft,
  onChangeDraft,
  onClose,
  onSave
}: {
  draft: MacroDraft | null;
  onChangeDraft: (draft: MacroDraft | null) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const updateDraft = (updates: Partial<MacroDraft>) => {
    onChangeDraft(draft ? { ...draft, ...updates } : draft);
  };

  return (
    <NutritionModal visible={Boolean(draft)} title="Daily Total" onClose={onClose}>
      {draft ? (
        <>
          <AppText muted>
            Use this when you know the full day total. Meal logs stay saved, but filled daily-total fields drive the summary.
          </AppText>
          <View style={styles.formGrid}>
            <NutritionField
              keyboardType="number-pad"
              label="Calories"
              onChangeText={(calories) => updateDraft({ calories })}
              value={draft.calories}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Protein g"
              onChangeText={(proteinGrams) => updateDraft({ proteinGrams })}
              value={draft.proteinGrams}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Carbs g"
              onChangeText={(carbGrams) => updateDraft({ carbGrams })}
              value={draft.carbGrams}
            />
            <NutritionField
              keyboardType="decimal-pad"
              label="Fats g"
              onChangeText={(fatGrams) => updateDraft({ fatGrams })}
              value={draft.fatGrams}
            />
          </View>
          <PrimaryButton icon="save-outline" label="Save Daily Total" onPress={onSave} />
        </>
      ) : null}
    </NutritionModal>
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

function createMealDraft(category: MealCategory = "Breakfast"): MealDraft {
  return {
    mealName: "",
    mealCategory: category,
    calories: "",
    proteinGrams: "",
    carbGrams: "",
    fatGrams: "",
    notes: ""
  };
}

function createMealDraftFromMeal(meal: MealLog): MealDraft {
  return {
    id: meal.id,
    mealName: meal.mealName,
    mealCategory: meal.mealCategory ?? "Snack",
    calories: formatOptionalNumber(meal.calories),
    proteinGrams: formatOptionalNumber(meal.proteinGrams),
    carbGrams: formatOptionalNumber(meal.carbGrams),
    fatGrams: formatOptionalNumber(meal.fatGrams),
    notes: meal.notes ?? ""
  };
}

function createMacroDraft(day: NutritionDay | null): MacroDraft {
  const totals = day?.manualTotals ?? day?.consumedTotals;

  return {
    calories: formatOptionalNumber(totals?.calories),
    proteinGrams: formatOptionalNumber(totals?.proteinGrams),
    carbGrams: formatOptionalNumber(totals?.carbGrams),
    fatGrams: formatOptionalNumber(totals?.fatGrams)
  };
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

function formatNumber(value?: number, suffix = "") {
  if (typeof value !== "number") {
    return "--";
  }

  return `${Math.round(value)}${suffix}`;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, amount: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function formatSelectedDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg
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
  categoryCard: {
    marginBottom: theme.spacing.md
  },
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  dateControls: {
    flexDirection: "row",
    gap: theme.spacing.xs
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
  heroNumber: {
    color: theme.colors.text,
    marginTop: theme.spacing.xs
  },
  iconRow: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  innerCard: {
    backgroundColor: theme.colors.background
  },
  manualTotalCard: {
    marginTop: theme.spacing.md
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
    color: theme.colors.accent
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
  placeholderCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  pressed: {
    opacity: 0.72
  },
  progressWrap: {
    marginTop: theme.spacing.md
  },
  remainingText: {
    color: theme.colors.accent
  },
  stack: {
    gap: theme.spacing.md
  },
  title: {
    marginTop: theme.spacing.xs
  }
});
