import { UserProfile } from "../../types/models";
import { formatFitnessGoal } from "../../utils/labels";

export type MazeCoachRecommendation = {
  headline: string;
  trainingFocus: string;
  nutritionCue: string;
  recoveryCue: string;
};

export function getMazeCoachRecommendation(profile: UserProfile | null): MazeCoachRecommendation {
  const goal = profile?.fitnessGoal ?? "build_muscle";
  const daysPerWeek = profile?.daysPerWeek ?? 3;
  const experience = profile?.experienceLevel ?? "beginner";

  // Future backend integration point:
  // Send a compact user summary to a trusted backend/Supabase Edge Function, then call OpenAI there.
  // Do not place an OpenAI API key in the mobile app.
  if (goal === "lose_weight") {
    return {
      headline: "Keep the path narrow today: lift, walk, log protein.",
      trainingFocus: `Plan ${daysPerWeek} strength sessions and keep one repeatable cardio slot.`,
      nutritionCue: "Anchor meals around protein first, then fill the rest with consistent portions.",
      recoveryCue: "Keep recovery boring and reliable: sleep window, hydration, and one light walk."
    };
  }

  if (goal === "improve_endurance") {
    return {
      headline: "Build the engine without skipping strength.",
      trainingFocus: "Pair one steady cardio session with controlled full-body strength work.",
      nutritionCue: "Carbs around training will make the next session more productive.",
      recoveryCue: "Track how you feel after cardio so volume can climb without guesswork."
    };
  }

  if (goal === "maintain") {
    return {
      headline: "Hold the line with simple, repeatable structure.",
      trainingFocus: `Keep ${daysPerWeek} sessions consistent before adding complexity.`,
      nutritionCue: "Use meal logging as a check-in, not a punishment.",
      recoveryCue: "A stable routine beats a perfect week that only happens once."
    };
  }

  return {
    headline: `${experience === "beginner" ? "Start clean" : "Progress deliberately"} toward ${formatFitnessGoal(goal).toLowerCase()}.`,
    trainingFocus: `Run ${daysPerWeek} focused lifting days with clear first exercises.`,
    nutritionCue: "Hit protein early so the rest of the day has less friction.",
    recoveryCue: "Progress comes from the next session being ready, not just today's effort."
  };
}
