import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText } from "../../components/AppText";
import { Card } from "../../components/Card";
import { IconButton } from "../../components/IconButton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { saveMeal } from "../../database/nutritionRepository";
import {
  buildScannedMealNotes,
  saveRecentScannedFood
} from "../../services/barcodeService";
import { theme } from "../../theme/theme";
import { mealCategories, MealCategory } from "../../types/nutrition";
import { RootStackParamList } from "../../types/navigation";
import { NutritionField } from "./components/NutritionField";

type Props = NativeStackScreenProps<RootStackParamList, "FoodConfirmation">;

type FoodDraft = {
  productName: string;
  barcode: string;
  servingSize: string;
  calories: string;
  proteinGrams: string;
  carbGrams: string;
  fatGrams: string;
  mealCategory: MealCategory;
  notes: string;
};

export function FoodConfirmationScreen({ navigation, route }: Props) {
  const { food, initialMealCategory } = route.params;
  const [draft, setDraft] = useState<FoodDraft>(() => ({
    productName: food.productName,
    barcode: food.barcode,
    servingSize: food.servingSize ?? "",
    calories: formatOptionalNumber(food.calories),
    proteinGrams: formatOptionalNumber(food.proteinGrams),
    carbGrams: formatOptionalNumber(food.carbGrams),
    fatGrams: formatOptionalNumber(food.fatGrams),
    mealCategory: initialMealCategory ?? "Breakfast",
    notes: ""
  }));
  const [isSaving, setIsSaving] = useState(false);

  const statusCopy = useMemo(() => {
    if (food.found) {
      return {
        icon: "checkmark-circle-outline" as const,
        title: "Product found",
        body: "Review the serving and macros before saving this to today's meal log."
      };
    }

    return {
      icon: "create-outline" as const,
      title: "Manual confirmation",
      body: "No matching product was found. The barcode is already captured; fill in the nutrition values before saving."
    };
  }, [food.found]);

  const updateDraft = (updates: Partial<FoodDraft>) => {
    setDraft((currentDraft) => ({ ...currentDraft, ...updates }));
  };

  const handleSaveFood = async () => {
    const mealName = draft.productName.trim() || `Scanned food ${draft.barcode}`;

    if (!draft.barcode.trim()) {
      Alert.alert("Barcode required", "Scan again or enter the barcode manually.");
      return;
    }

    setIsSaving(true);
    try {
      const calories = parseOptionalNumber(draft.calories);
      const proteinGrams = parseOptionalNumber(draft.proteinGrams);
      const carbGrams = parseOptionalNumber(draft.carbGrams);
      const fatGrams = parseOptionalNumber(draft.fatGrams);
      const servingSize = draft.servingSize.trim() || undefined;

      // Scanned foods save through the same SQLite meal log as manual meals.
      // Barcode and serving metadata are stored in notes so manual logging remains unchanged.
      await saveMeal({
        date: toDateKey(new Date()),
        mealName,
        mealCategory: draft.mealCategory,
        calories,
        proteinGrams,
        carbGrams,
        fatGrams,
        notes: buildScannedMealNotes({
          barcode: draft.barcode.trim(),
          servingSize,
          source: food.source,
          notes: draft.notes
        })
      });

      await saveRecentScannedFood({
        barcode: draft.barcode.trim(),
        productName: mealName,
        servingSize,
        calories,
        proteinGrams,
        carbGrams,
        fatGrams,
        mealCategory: draft.mealCategory,
        notes: draft.notes.trim() || undefined,
        source: food.source,
        found: food.found,
        scannedAt: new Date().toISOString()
      });

      navigation.popToTop();
    } catch {
      Alert.alert("Save failed", "The scanned food could not be saved. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <IconButton
          accessibilityLabel="Go back"
          icon="chevron-back"
          onPress={() => navigation.goBack()}
        />
        <View style={styles.flex}>
          <AppText muted variant="caption">
            Scan Food
          </AppText>
          <AppText variant="heading">Confirm Food</AppText>
        </View>
      </View>

      <Card accent style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons color={theme.colors.accent} name={statusCopy.icon} size={28} />
          <View style={styles.flex}>
            <AppText variant="subheading">{statusCopy.title}</AppText>
            <AppText muted>{statusCopy.body}</AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.formCard}>
        <View style={styles.formStack}>
          <NutritionField
            label="Product name"
            onChangeText={(productName) => updateDraft({ productName })}
            placeholder="Food name"
            value={draft.productName}
          />
          <NutritionField
            keyboardType="number-pad"
            label="Barcode"
            onChangeText={(barcode) => updateDraft({ barcode })}
            value={draft.barcode}
          />
          <NutritionField
            label="Serving size"
            onChangeText={(servingSize) => updateDraft({ servingSize })}
            placeholder="1 bar, 240 ml, 100 g"
            value={draft.servingSize}
          />
          <AppText muted variant="caption">
            Meal category
          </AppText>
          <View style={styles.categoryOptions}>
            {mealCategories.map((category) => (
              <CategoryPill
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
            placeholder="Taste, serving adjustment, or prep notes."
            value={draft.notes}
          />
          <PrimaryButton
            disabled={isSaving}
            icon="save-outline"
            label={isSaving ? "Saving" : "Save Food"}
            onPress={() => void handleSaveFood()}
          />
        </View>
      </Card>
    </Screen>
  );
}

function CategoryPill({
  label,
  selected,
  onPress
}: {
  label: MealCategory;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.categoryPill,
        selected && styles.categoryPillSelected,
        pressed && styles.pressed
      ]}
    >
      <AppText variant="caption">{label}</AppText>
    </Pressable>
  );
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatOptionalNumber(value?: number) {
  return typeof value === "number" ? String(Math.round(value)) : "";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  categoryOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  categoryPill: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs
  },
  categoryPillSelected: {
    backgroundColor: theme.colors.accentSoft,
    borderColor: theme.colors.accent
  },
  flex: {
    flex: 1
  },
  formCard: {
    marginTop: theme.spacing.md
  },
  formGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  formStack: {
    gap: theme.spacing.md
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  pressed: {
    opacity: 0.72
  },
  statusCard: {
    marginTop: theme.spacing.lg
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  }
});
