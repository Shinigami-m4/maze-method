import { BodyMeasurementEntry, BodyWeightEntry, DailyMacroLog, PersonalRecord, ProgressPhoto, UnitPreference } from "../types/models";
import {
  BodyMeasurementInput,
  BodyWeightInput,
  ChartPoint,
  MacroChartPoint,
  ManualPersonalRecordInput,
  PersonalRecordSummary,
  ProgressDashboardData,
  ProgressDateRange,
  ProgressPhotoAngle,
  ProgressPhotoInput,
  StrengthChartPoint
} from "../types/progress";
import { CardioLogEntry } from "../types/calendarLogging";
import { createLocalId } from "../utils/id";
import { getDatabase } from "./client";
import { getUserProfile } from "./profileRepository";

type BodyWeightRow = {
  id: string;
  date: string;
  weight: number;
  units: UnitPreference | string;
  notes: string | null;
};

type BodyMeasurementRow = {
  id: string;
  date: string;
  measurement_type: string;
  value: number;
  units: UnitPreference | string;
  notes: string | null;
};

type ProgressPhotoRow = {
  id: string;
  date: string;
  local_uri: string;
  angle: ProgressPhotoAngle | string | null;
  notes: string | null;
  created_at: string;
};

type MacroRow = {
  id: string;
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
  water_ounces: number | null;
};

type MacroAggregateRow = {
  date: string;
  calories: number | null;
  protein_grams: number | null;
  carb_grams: number | null;
  fat_grams: number | null;
};

type StrengthRow = {
  id: string;
  started_at: string;
  exercise_name: string;
  sets: number | null;
  reps: number | string | null;
  weight: number | null;
  notes: string | null;
};

type CardioRow = {
  id: string;
  date: string;
  activity_type: string;
  duration_minutes: number;
  distance: number | null;
  pace: string | null;
  speed: number | null;
  calories_burned: number | null;
  notes: string | null;
};

type PersonalRecordRow = {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  record_type: PersonalRecord["recordType"];
  value: number;
  units: string | null;
  achieved_at: string;
  notes: string | null;
};

type DateFilter = {
  where: string;
  params: string[];
};

export async function getProgressDashboard(range: ProgressDateRange): Promise<ProgressDashboardData> {
  const database = await getDatabase();
  const profile = await getUserProfile();
  const startDate = getStartDateForRange(range);

  // Every progress card reads through the same date-range filter so charts and summaries stay aligned.
  const weightFilter = createDateFilter("date", startDate);
  const measurementFilter = createDateFilter("date", startDate);
  const photoFilter = createDateFilter("date", startDate);
  const macroFilter = createDateFilter("date", startDate);
  const mealFilter = createDateFilter("substr(logged_at, 1, 10)", startDate);
  const cardioFilter = createDateFilter("date", startDate);
  const strengthFilter = createDateFilter("substr(wl.started_at, 1, 10)", startDate);

  const [
    weightRows,
    measurementRows,
    photoRows,
    latestPhotoRow,
    macroRows,
    mealMacroRows,
    cardioRows,
    strengthRows,
    manualRecordRows
  ] = await Promise.all([
    database.getAllAsync<BodyWeightRow>(
      `SELECT * FROM body_weight_entries ${weightFilter.where} ORDER BY date ASC`,
      weightFilter.params
    ),
    database.getAllAsync<BodyMeasurementRow>(
      `SELECT * FROM body_measurement_entries ${measurementFilter.where} ORDER BY date ASC`,
      measurementFilter.params
    ),
    database.getAllAsync<ProgressPhotoRow>(
      `SELECT * FROM progress_photos ${photoFilter.where} ORDER BY date DESC, created_at DESC`,
      photoFilter.params
    ),
    database.getFirstAsync<ProgressPhotoRow>(
      "SELECT * FROM progress_photos ORDER BY date DESC, created_at DESC LIMIT 1"
    ),
    database.getAllAsync<MacroRow>(
      `SELECT * FROM daily_macro_logs ${macroFilter.where} ORDER BY date ASC`,
      macroFilter.params
    ),
    database.getAllAsync<MacroAggregateRow>(
      `SELECT substr(logged_at, 1, 10) AS date,
              SUM(calories) AS calories,
              SUM(protein_grams) AS protein_grams,
              SUM(carb_grams) AS carb_grams,
              SUM(fat_grams) AS fat_grams
       FROM meals
       ${mealFilter.where}
       GROUP BY substr(logged_at, 1, 10)
       ORDER BY date ASC`,
      mealFilter.params
    ),
    database.getAllAsync<CardioRow>(
      `SELECT * FROM cardio_sessions ${cardioFilter.where} ORDER BY date ASC`,
      cardioFilter.params
    ),
    database.getAllAsync<StrengthRow>(
      `SELECT lwe.id,
              wl.started_at,
              lwe.exercise_name,
              lwe.sets,
              lwe.reps,
              lwe.weight,
              lwe.notes
       FROM logged_workout_exercises lwe
       JOIN workout_logs wl ON wl.id = lwe.workout_log_id
       ${strengthFilter.where}
       ORDER BY wl.started_at ASC`,
      strengthFilter.params
    ),
    database.getAllAsync<PersonalRecordRow>(
      "SELECT * FROM personal_records ORDER BY achieved_at DESC"
    )
  ]);

  const weightEntries = weightRows.map(mapBodyWeightRow);
  const measurementEntries = measurementRows.map(mapBodyMeasurementRow);
  const photos = photoRows.map(mapProgressPhotoRow);
  const macroLogs = macroRows.map(mapMacroRow);
  const macroPoints = buildMacroPoints(mealMacroRows, macroRows);
  const strengthPoints = buildStrengthPoints(strengthRows);
  const weightUnitLabel = profile?.units === "metric" ? "kg" : "lb";
  const personalRecords = buildPersonalRecords(strengthRows, manualRecordRows, weightUnitLabel);

  return {
    weightEntries,
    measurementEntries,
    photos,
    macroLogs,
    macroPoints,
    strengthPoints,
    cardioSessions: cardioRows.map(mapCardioRow),
    personalRecords,
    latestWeight: weightEntries.at(-1),
    latestMeasurements: getLatestMeasurements(measurementEntries),
    photoReminder: buildPhotoReminder(latestPhotoRow ? mapProgressPhotoRow(latestPhotoRow) : undefined)
  };
}

export async function saveBodyWeightEntry(input: BodyWeightInput) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("body-weight");

  await database.runAsync(
    `INSERT INTO body_weight_entries (
      id,
      date,
      weight,
      units,
      notes
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      weight = excluded.weight,
      units = excluded.units,
      notes = excluded.notes`,
    [id, input.date, input.weight, input.units, input.notes ?? null]
  );

  return id;
}

export async function saveBodyMeasurementEntry(input: BodyMeasurementInput) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("measurement");

  await database.runAsync(
    `INSERT INTO body_measurement_entries (
      id,
      date,
      measurement_type,
      value,
      units,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      measurement_type = excluded.measurement_type,
      value = excluded.value,
      units = excluded.units,
      notes = excluded.notes`,
    [id, input.date, input.measurementType, input.value, input.units, input.notes ?? null]
  );

  return id;
}

export async function saveProgressPhoto(input: ProgressPhotoInput) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("progress-photo");
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO progress_photos (
      id,
      date,
      local_uri,
      angle,
      notes,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      date = excluded.date,
      local_uri = excluded.local_uri,
      angle = excluded.angle,
      notes = excluded.notes`,
    [id, input.date, input.localUri, input.angle, input.notes ?? null, now]
  );

  return id;
}

export async function deleteProgressPhoto(photoId: string) {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM progress_photos WHERE id = ?", [photoId]);
}

export async function saveManualPersonalRecord(input: ManualPersonalRecordInput) {
  const database = await getDatabase();
  const id = input.id ?? createLocalId("personal-record");

  await database.runAsync(
    `INSERT INTO personal_records (
      id,
      exercise_id,
      exercise_name,
      record_type,
      value,
      units,
      achieved_at,
      notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      exercise_name = excluded.exercise_name,
      record_type = excluded.record_type,
      value = excluded.value,
      units = excluded.units,
      achieved_at = excluded.achieved_at,
      notes = excluded.notes`,
    [
      id,
      null,
      input.exerciseName,
      input.recordType,
      input.value,
      input.units ?? null,
      input.achievedAt,
      input.notes ?? null
    ]
  );

  return id;
}

function createDateFilter(dateExpression: string, startDate?: string): DateFilter {
  if (!startDate) {
    return { where: "", params: [] };
  }

  return {
    where: `WHERE ${dateExpression} >= ?`,
    params: [startDate]
  };
}

function getStartDateForRange(range: ProgressDateRange) {
  if (range === "all") {
    return undefined;
  }

  const today = new Date();
  const start = new Date(today);

  if (range === "30d") {
    start.setDate(today.getDate() - 29);
  } else if (range === "90d") {
    start.setDate(today.getDate() - 89);
  } else if (range === "6m") {
    start.setMonth(today.getMonth() - 6);
  } else {
    start.setFullYear(today.getFullYear() - 1);
  }

  return toDateKey(start);
}

function buildMacroPoints(
  mealMacroRows: MacroAggregateRow[],
  macroRows: MacroRow[]
): MacroChartPoint[] {
  const macroByDate = new Map<string, MacroChartPoint>();

  // Meal sums provide automatic chart points; manual daily totals override matching fields when present.
  for (const row of mealMacroRows) {
    const calories = row.calories ?? 0;
    const proteinGrams = row.protein_grams ?? 0;
    const carbGrams = row.carb_grams ?? 0;
    const fatGrams = row.fat_grams ?? 0;

    macroByDate.set(row.date, {
      id: `meal-macros-${row.date}`,
      date: row.date,
      label: formatChartDate(row.date),
      value: calories,
      calories,
      proteinGrams,
      carbGrams,
      fatGrams,
      meta: `${Math.round(proteinGrams)}g protein`
    });
  }

  for (const row of macroRows) {
    const mealPoint = macroByDate.get(row.date);
    const calories = row.calories ?? mealPoint?.calories ?? 0;
    const proteinGrams = row.protein_grams ?? mealPoint?.proteinGrams ?? 0;
    const carbGrams = row.carb_grams ?? mealPoint?.carbGrams ?? 0;
    const fatGrams = row.fat_grams ?? mealPoint?.fatGrams ?? 0;

    macroByDate.set(row.date, {
      id: row.id,
      date: row.date,
      label: formatChartDate(row.date),
      value: calories,
      calories,
      proteinGrams,
      carbGrams,
      fatGrams,
      meta: `${Math.round(proteinGrams)}g protein`
    });
  }

  return Array.from(macroByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function buildStrengthPoints(rows: StrengthRow[]): StrengthChartPoint[] {
  const bestVolumeByDate = new Map<string, StrengthChartPoint>();

  // Strength progress uses best daily volume because it is simple, explainable, and works without extra chart libs.
  for (const row of rows) {
    const sets = row.sets ?? 0;
    const reps = parseWorkoutNumber(row.reps);
    const weight = row.weight ?? 0;
    const volume = sets * reps * weight;

    if (volume <= 0) {
      continue;
    }

    const date = row.started_at.slice(0, 10);
    const current = bestVolumeByDate.get(date);

    if (!current || volume > current.value) {
      bestVolumeByDate.set(date, {
        id: row.id,
        date,
        label: formatChartDate(date),
        value: volume,
        exerciseName: row.exercise_name,
        sets,
        reps,
        weight,
        meta: row.exercise_name
      });
    }
  }

  return Array.from(bestVolumeByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function buildPersonalRecords(
  strengthRows: StrengthRow[],
  manualRows: PersonalRecordRow[],
  weightUnitLabel: string
): PersonalRecordSummary[] {
  const highestWeightByExercise = new Map<string, PersonalRecordSummary>();
  const highestRepsByExercise = new Map<string, PersonalRecordSummary>();
  const highestVolumeByExercise = new Map<string, PersonalRecordSummary>();

  // PRs are derived locally from completed workout logs, so routine edits never rewrite history.
  for (const row of strengthRows) {
    const exerciseName = row.exercise_name;
    const achievedAt = row.started_at;
    const reps = parseWorkoutNumber(row.reps);
    const weight = row.weight ?? 0;
    const sets = row.sets ?? 0;
    const volume = sets * reps * weight;

    if (weight > 0) {
      maybeSetHigher(highestWeightByExercise, exerciseName, {
        id: `auto-weight-${exerciseName}`,
        exerciseName,
        recordType: "weight",
        value: weight,
        units: weightUnitLabel,
        achievedAt,
        source: "auto",
        notes: row.notes ?? undefined
      });
    }

    if (reps > 0) {
      maybeSetHigher(highestRepsByExercise, exerciseName, {
        id: `auto-reps-${exerciseName}`,
        exerciseName,
        recordType: "reps",
        value: reps,
        units: "reps",
        achievedAt,
        source: "auto",
        notes: row.notes ?? undefined
      });
    }

    if (volume > 0) {
      maybeSetHigher(highestVolumeByExercise, exerciseName, {
        id: `auto-volume-${exerciseName}`,
        exerciseName,
        recordType: "volume",
        value: volume,
        units: `${weightUnitLabel} volume`,
        achievedAt,
        source: "auto",
        notes: `${sets} sets x ${Math.round(reps)} reps x ${Math.round(weight)} ${weightUnitLabel}`
      });
    }
  }

  const manualRecords = manualRows.map((row): PersonalRecordSummary => ({
    id: row.id,
    exerciseName: row.exercise_name,
    recordType: row.record_type,
    value: row.value,
    units: row.units ?? "",
    achievedAt: row.achieved_at,
    source: "manual",
    notes: row.notes ?? undefined
  }));

  return [
    ...highestWeightByExercise.values(),
    ...highestRepsByExercise.values(),
    ...highestVolumeByExercise.values(),
    ...manualRecords
  ].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}

function maybeSetHigher(
  map: Map<string, PersonalRecordSummary>,
  exerciseName: string,
  next: PersonalRecordSummary
) {
  const current = map.get(exerciseName);

  if (!current || next.value > current.value) {
    map.set(exerciseName, next);
  }
}

function getLatestMeasurements(entries: BodyMeasurementEntry[]) {
  const latestByType = new Map<string, BodyMeasurementEntry>();

  for (const entry of entries) {
    const current = latestByType.get(entry.measurementType);

    if (!current || entry.date >= current.date) {
      latestByType.set(entry.measurementType, entry);
    }
  }

  return Array.from(latestByType.values()).sort((a, b) =>
    a.measurementType.localeCompare(b.measurementType)
  );
}

function buildPhotoReminder(latestPhoto?: ProgressPhoto) {
  if (!latestPhoto) {
    return { isDue: true };
  }

  // A weekly progress-photo cadence is calculated locally from photo metadata, not from a backend.
  const daysSinceLastPhoto = daysBetween(latestPhoto.date, toDateKey(new Date()));
  const nextDueDate = addDays(latestPhoto.date, 7);

  return {
    lastPhotoDate: latestPhoto.date,
    daysSinceLastPhoto,
    nextDueDate,
    isDue: daysSinceLastPhoto >= 7
  };
}

function mapBodyWeightRow(row: BodyWeightRow): BodyWeightEntry {
  return {
    id: row.id,
    date: row.date,
    weight: row.weight,
    units: normalizeUnit(row.units),
    notes: row.notes ?? undefined
  };
}

function mapBodyMeasurementRow(row: BodyMeasurementRow): BodyMeasurementEntry {
  return {
    id: row.id,
    date: row.date,
    measurementType: row.measurement_type,
    value: row.value,
    units: normalizeUnit(row.units),
    notes: row.notes ?? undefined
  };
}

function mapProgressPhotoRow(row: ProgressPhotoRow): ProgressPhoto {
  return {
    id: row.id,
    date: row.date,
    localUri: row.local_uri,
    angle: normalizePhotoAngle(row.angle),
    notes: row.notes ?? undefined,
    createdAt: row.created_at
  };
}

function mapMacroRow(row: MacroRow): DailyMacroLog {
  return {
    id: row.id,
    date: row.date,
    calories: row.calories ?? undefined,
    proteinGrams: row.protein_grams ?? undefined,
    carbGrams: row.carb_grams ?? undefined,
    fatGrams: row.fat_grams ?? undefined,
    waterOunces: row.water_ounces ?? undefined
  };
}

function mapCardioRow(row: CardioRow): CardioLogEntry {
  return {
    id: row.id,
    date: row.date,
    activityType: row.activity_type,
    durationMinutes: row.duration_minutes,
    distance: row.distance ?? undefined,
    pace: row.pace ?? undefined,
    speed: row.speed ?? undefined,
    caloriesBurned: row.calories_burned ?? undefined,
    notes: row.notes ?? undefined
  };
}

function normalizeUnit(value: string): UnitPreference {
  return value === "metric" ? "metric" : "imperial";
}

function normalizePhotoAngle(value: string | null) {
  if (value === "front" || value === "side" || value === "back" || value === "other") {
    return value;
  }

  return undefined;
}

function parseWorkoutNumber(value: number | string | null) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const match = value.match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
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

function daysBetween(startDateKey: string, endDateKey: string) {
  const [startYear, startMonth, startDay] = startDateKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDateKey.split("-").map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay));
}

function formatChartDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}
