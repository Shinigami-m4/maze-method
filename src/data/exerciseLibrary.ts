import { ExerciseLibraryItem, MuscleGroup } from "../types/workouts";

type BuiltInExercise = Omit<ExerciseLibraryItem, "isBuiltIn" | "resourceLinks" | "customNotes">;

const exercises: BuiltInExercise[] = [
  {
    id: "builtin-bench-press",
    name: "Bench Press",
    muscleGroup: "Chest",
    equipment: "Barbell",
    defaultSets: 4,
    defaultReps: "5-8",
    instructions: "Set your shoulder blades, lower under control, and press through a stable path."
  },
  {
    id: "builtin-incline-dumbbell-press",
    name: "Incline Dumbbell Press",
    muscleGroup: "Chest",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Use a moderate incline and keep the dumbbells moving over the upper chest."
  },
  {
    id: "builtin-dumbbell-bench-press",
    name: "Dumbbell Bench Press",
    muscleGroup: "Chest",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Control the bottom position and keep wrists stacked over elbows."
  },
  {
    id: "builtin-cable-fly",
    name: "Cable Fly",
    muscleGroup: "Chest",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "12-15",
    instructions: "Move through a wide arc and squeeze without letting shoulders roll forward."
  },
  {
    id: "builtin-push-up",
    name: "Push-Up",
    muscleGroup: "Chest",
    equipment: "Bodyweight",
    defaultSets: 3,
    defaultReps: "AMRAP",
    instructions: "Keep a straight line from head to heels and touch the chest near the floor."
  },
  {
    id: "builtin-chest-press-machine",
    name: "Chest Press Machine",
    muscleGroup: "Chest",
    equipment: "Machine",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Set the seat so the handles line up with mid-chest and press evenly."
  },
  {
    id: "builtin-pull-up",
    name: "Pull-Up",
    muscleGroup: "Back",
    equipment: "Pull-up bar",
    defaultSets: 4,
    defaultReps: "4-8",
    instructions: "Start from a dead hang, pull elbows down, and avoid kicking for momentum."
  },
  {
    id: "builtin-lat-pulldown",
    name: "Lat Pulldown",
    muscleGroup: "Back",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Lean back slightly and pull the bar toward the upper chest with elbows down."
  },
  {
    id: "builtin-barbell-row",
    name: "Barbell Row",
    muscleGroup: "Back",
    equipment: "Barbell",
    defaultSets: 4,
    defaultReps: "6-10",
    instructions: "Brace hard, hinge forward, and row toward the lower ribs."
  },
  {
    id: "builtin-dumbbell-row",
    name: "Dumbbell Row",
    muscleGroup: "Back",
    equipment: "Dumbbell",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Reach long at the bottom and drive the elbow toward the hip."
  },
  {
    id: "builtin-seated-cable-row",
    name: "Seated Cable Row",
    muscleGroup: "Back",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "10-12",
    instructions: "Keep the torso quiet and pull the handle toward the midsection."
  },
  {
    id: "builtin-t-bar-row",
    name: "T-Bar Row",
    muscleGroup: "Back",
    equipment: "T-bar row",
    defaultSets: 3,
    defaultReps: "8-10",
    instructions: "Brace against the pad or hinge position and row with elbows tracking back."
  },
  {
    id: "builtin-overhead-press",
    name: "Overhead Press",
    muscleGroup: "Shoulders",
    equipment: "Barbell",
    defaultSets: 4,
    defaultReps: "5-8",
    instructions: "Brace ribs down, press overhead, and finish with biceps near ears."
  },
  {
    id: "builtin-dumbbell-shoulder-press",
    name: "Dumbbell Shoulder Press",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Press from shoulder height without over-arching the lower back."
  },
  {
    id: "builtin-lateral-raise",
    name: "Lateral Raise",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "12-20",
    instructions: "Lead with elbows and stop just below shoulder height."
  },
  {
    id: "builtin-rear-delt-fly",
    name: "Rear Delt Fly",
    muscleGroup: "Shoulders",
    equipment: "Dumbbells or machine",
    defaultSets: 3,
    defaultReps: "12-15",
    instructions: "Keep the chest supported or torso hinged and sweep arms out wide."
  },
  {
    id: "builtin-face-pull",
    name: "Face Pull",
    muscleGroup: "Shoulders",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "12-15",
    instructions: "Pull toward eye level with elbows high and rotate hands back."
  },
  {
    id: "builtin-barbell-curl",
    name: "Barbell Curl",
    muscleGroup: "Biceps",
    equipment: "Barbell",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Keep elbows pinned and curl without swinging the torso."
  },
  {
    id: "builtin-dumbbell-curl",
    name: "Dumbbell Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "10-12",
    instructions: "Use a full range of motion and rotate palms up as you lift."
  },
  {
    id: "builtin-hammer-curl",
    name: "Hammer Curl",
    muscleGroup: "Biceps",
    equipment: "Dumbbells",
    defaultSets: 3,
    defaultReps: "10-12",
    instructions: "Keep thumbs up and control the weight back to the bottom."
  },
  {
    id: "builtin-triceps-pushdown",
    name: "Triceps Pushdown",
    muscleGroup: "Triceps",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "10-15",
    instructions: "Pin elbows to your sides and extend until arms are straight."
  },
  {
    id: "builtin-skull-crusher",
    name: "Skull Crusher",
    muscleGroup: "Triceps",
    equipment: "EZ bar or dumbbells",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Lower behind the forehead with elbows steady, then extend smoothly."
  },
  {
    id: "builtin-dips",
    name: "Dips",
    muscleGroup: "Triceps",
    equipment: "Dip bars",
    defaultSets: 3,
    defaultReps: "6-12",
    instructions: "Keep shoulders controlled and stop before the front shoulder pinches."
  },
  {
    id: "builtin-squat",
    name: "Squat",
    muscleGroup: "Legs",
    equipment: "Barbell",
    defaultSets: 4,
    defaultReps: "5-8",
    instructions: "Brace, sit between the hips, and drive up through the whole foot."
  },
  {
    id: "builtin-leg-press",
    name: "Leg Press",
    muscleGroup: "Legs",
    equipment: "Machine",
    defaultSets: 3,
    defaultReps: "10-15",
    instructions: "Control depth, keep hips down, and avoid locking knees aggressively."
  },
  {
    id: "builtin-romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroup: "Legs",
    equipment: "Barbell or dumbbells",
    defaultSets: 3,
    defaultReps: "8-10",
    instructions: "Hinge at the hips, keep shins quiet, and feel tension in hamstrings."
  },
  {
    id: "builtin-leg-extension",
    name: "Leg Extension",
    muscleGroup: "Legs",
    equipment: "Machine",
    defaultSets: 3,
    defaultReps: "12-15",
    instructions: "Pause briefly at the top and lower with control."
  },
  {
    id: "builtin-hamstring-curl",
    name: "Hamstring Curl",
    muscleGroup: "Legs",
    equipment: "Machine",
    defaultSets: 3,
    defaultReps: "10-15",
    instructions: "Curl through a full range and keep hips pressed into the pad."
  },
  {
    id: "builtin-walking-lunge",
    name: "Walking Lunge",
    muscleGroup: "Legs",
    equipment: "Bodyweight or dumbbells",
    defaultSets: 3,
    defaultReps: "10 each",
    instructions: "Step long enough to control the knee and drive through the front leg."
  },
  {
    id: "builtin-calf-raise",
    name: "Calf Raise",
    muscleGroup: "Legs",
    equipment: "Machine or dumbbells",
    defaultSets: 4,
    defaultReps: "10-15",
    instructions: "Use a full stretch, rise high, and pause briefly at the top."
  },
  {
    id: "builtin-hip-thrust",
    name: "Hip Thrust",
    muscleGroup: "Glutes",
    equipment: "Barbell",
    defaultSets: 4,
    defaultReps: "8-12",
    instructions: "Tuck ribs down, drive through heels, and pause at lockout."
  },
  {
    id: "builtin-glute-bridge",
    name: "Glute Bridge",
    muscleGroup: "Glutes",
    equipment: "Bodyweight or barbell",
    defaultSets: 3,
    defaultReps: "10-15",
    instructions: "Keep the pelvis controlled and squeeze glutes at the top."
  },
  {
    id: "builtin-cable-kickback",
    name: "Cable Kickback",
    muscleGroup: "Glutes",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "12-15",
    instructions: "Keep torso stable and extend from the hip, not the lower back."
  },
  {
    id: "builtin-plank",
    name: "Plank",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    defaultSets: 3,
    defaultReps: "30-60 sec",
    instructions: "Brace abs, squeeze glutes, and keep a straight line from head to heels."
  },
  {
    id: "builtin-cable-crunch",
    name: "Cable Crunch",
    muscleGroup: "Core",
    equipment: "Cable machine",
    defaultSets: 3,
    defaultReps: "10-15",
    instructions: "Round through the abs while hips stay steady."
  },
  {
    id: "builtin-hanging-leg-raise",
    name: "Hanging Leg Raise",
    muscleGroup: "Core",
    equipment: "Pull-up bar",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Control the swing and lift with abs before hip flexors take over."
  },
  {
    id: "builtin-russian-twist",
    name: "Russian Twist",
    muscleGroup: "Core",
    equipment: "Bodyweight or medicine ball",
    defaultSets: 3,
    defaultReps: "16-24 total",
    instructions: "Rotate the rib cage under control and keep the core braced."
  },
  {
    id: "builtin-sit-up",
    name: "Sit-Up",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    defaultSets: 3,
    defaultReps: "10-20",
    instructions: "Move smoothly and avoid yanking the neck."
  },
  {
    id: "builtin-running",
    name: "Running",
    muscleGroup: "Cardio",
    equipment: "Road or treadmill",
    defaultSets: 1,
    defaultReps: "10-30 min",
    instructions: "Start conversational and build pace only after warm-up."
  },
  {
    id: "builtin-walking",
    name: "Walking",
    muscleGroup: "Cardio",
    equipment: "Road or treadmill",
    defaultSets: 1,
    defaultReps: "20-45 min",
    instructions: "Use a pace you can repeat consistently across the week."
  },
  {
    id: "builtin-cycling",
    name: "Cycling",
    muscleGroup: "Cardio",
    equipment: "Bike",
    defaultSets: 1,
    defaultReps: "15-40 min",
    instructions: "Keep cadence steady and adjust resistance before form breaks."
  },
  {
    id: "builtin-stairmaster",
    name: "Stairmaster",
    muscleGroup: "Cardio",
    equipment: "Machine",
    defaultSets: 1,
    defaultReps: "10-25 min",
    instructions: "Stand tall, use rails lightly, and keep steps controlled."
  },
  {
    id: "builtin-elliptical",
    name: "Elliptical",
    muscleGroup: "Cardio",
    equipment: "Machine",
    defaultSets: 1,
    defaultReps: "15-30 min",
    instructions: "Keep stride smooth and use resistance to control intensity."
  },
  {
    id: "builtin-rowing",
    name: "Rowing",
    muscleGroup: "Cardio",
    equipment: "Row erg",
    defaultSets: 1,
    defaultReps: "8-20 min",
    instructions: "Drive with legs first, then hips, then arms."
  },
  {
    id: "builtin-kettlebell-swing",
    name: "Kettlebell Swing",
    muscleGroup: "Full Body",
    equipment: "Kettlebell",
    defaultSets: 4,
    defaultReps: "10-15",
    instructions: "Hinge sharply, snap hips through, and let the bell float."
  },
  {
    id: "builtin-burpee",
    name: "Burpee",
    muscleGroup: "Full Body",
    equipment: "Bodyweight",
    defaultSets: 3,
    defaultReps: "8-12",
    instructions: "Move cleanly from floor to jump and keep each rep controlled."
  },
  {
    id: "builtin-worlds-greatest-stretch",
    name: "World's Greatest Stretch",
    muscleGroup: "Mobility",
    equipment: "Bodyweight",
    defaultSets: 2,
    defaultReps: "5 each",
    instructions: "Move slowly through the lunge, rotation, and hamstring stretch."
  },
  {
    id: "builtin-band-pull-apart",
    name: "Band Pull-Apart",
    muscleGroup: "Mobility",
    equipment: "Resistance band",
    defaultSets: 2,
    defaultReps: "15-20",
    instructions: "Keep ribs down and pull the band apart with shoulder blades moving."
  }
];

export const builtInExercises: ExerciseLibraryItem[] = exercises.map((exercise) => ({
  ...exercise,
  isBuiltIn: true,
  resourceLinks: []
}));

export function getExercisesByMuscleGroup(muscleGroup: MuscleGroup) {
  return builtInExercises.filter((exercise) => exercise.muscleGroup === muscleGroup);
}
