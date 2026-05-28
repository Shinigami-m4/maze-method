import {
  ActivityLevel,
  ExperienceLevel,
  FitnessGoal,
  MazeCoachTone,
  TrainingLocation,
  UnitPreference
} from "../types/models";

export function formatFitnessGoal(goal: FitnessGoal) {
  const labels: Record<FitnessGoal, string> = {
    lose_weight: "Lose weight",
    build_muscle: "Build muscle",
    maintain: "Maintain",
    improve_endurance: "Improve endurance"
  };

  return labels[goal];
}

export function formatExperience(level: ExperienceLevel) {
  const labels: Record<ExperienceLevel, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced"
  };

  return labels[level];
}

export function formatTrainingLocation(location: TrainingLocation) {
  const labels: Record<TrainingLocation, string> = {
    gym: "Gym",
    home: "Home",
    both: "Gym and home"
  };

  return labels[location];
}

export function formatActivityLevel(level: ActivityLevel) {
  const labels: Record<ActivityLevel, string> = {
    sedentary: "Sedentary",
    light: "Light",
    moderate: "Moderate",
    active: "Active",
    very_active: "Very active"
  };

  return labels[level];
}

export function formatMazeCoachTone(tone: MazeCoachTone) {
  const labels: Record<MazeCoachTone, string> = {
    friendly_beginner: "Friendly beginner coach",
    serious_gym: "Serious gym coach",
    professional_trainer: "Professional trainer",
    motivational_not_corny: "Motivational but not corny"
  };

  return labels[tone];
}

export function formatUnits(units: UnitPreference) {
  return units === "imperial" ? "lb / in" : "kg / cm";
}
