import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { OptionButton } from "../../components/OptionButton";
import { TextField } from "../../components/TextField";
import { unitOptions } from "../../data/onboardingOptions";
import { OnboardingStackParamList } from "../../types/navigation";
import { useOnboarding } from "./OnboardingContext";
import { OnboardingLayout } from "./OnboardingLayout";

type Props = NativeStackScreenProps<OnboardingStackParamList, "PersonalInfo">;

export function PersonalInfoScreen({ navigation }: Props) {
  const { draft, updateDraft } = useOnboarding();

  return (
    <OnboardingLayout
      nextDisabled={!draft.name.trim()}
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate("Goals")}
      step={2}
      subtitle="Set the basics so Maze Method can calculate progress around your preferred units."
      title="Personal info"
    >
      <TextField
        autoCapitalize="words"
        label="Name"
        onChangeText={(name) => updateDraft({ name })}
        placeholder="Your name"
        value={draft.name}
      />
      <TextField
        keyboardType="number-pad"
        label="Age"
        onChangeText={(age) => updateDraft({ age: parseNumber(age) })}
        placeholder="Age"
        value={formatNumber(draft.age)}
      />
      <TextField
        autoCapitalize="words"
        label="Gender"
        onChangeText={(gender) => updateDraft({ gender })}
        placeholder="Optional"
        value={draft.gender}
      />
      <TextField
        keyboardType="decimal-pad"
        label={draft.units === "imperial" ? "Height (in)" : "Height (cm)"}
        onChangeText={(height) => updateDraft({ height: parseNumber(height) })}
        placeholder={draft.units === "imperial" ? "70" : "178"}
        value={formatNumber(draft.height)}
      />
      <TextField
        keyboardType="decimal-pad"
        label={draft.units === "imperial" ? "Weight (lb)" : "Weight (kg)"}
        onChangeText={(weight) => updateDraft({ weight: parseNumber(weight) })}
        placeholder={draft.units === "imperial" ? "180" : "82"}
        value={formatNumber(draft.weight)}
      />
      <TextField
        keyboardType="decimal-pad"
        label={draft.units === "imperial" ? "Goal weight (lb)" : "Goal weight (kg)"}
        onChangeText={(goalWeight) => updateDraft({ goalWeight: parseNumber(goalWeight) })}
        placeholder="Optional"
        value={formatNumber(draft.goalWeight)}
      />
      {unitOptions.map((option) => (
        <OptionButton
          key={option.value}
          label={option.label}
          onPress={() => updateDraft({ units: option.value })}
          selected={draft.units === option.value}
        />
      ))}
    </OnboardingLayout>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
}

function formatNumber(value?: number) {
  return typeof value === "number" ? String(value) : "";
}
