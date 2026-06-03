import {
  BodyMeasurementEntry,
  BodyWeightEntry,
  DailyMacroLog,
  PersonalRecord,
  ProgressPhoto,
  UnitPreference
} from "./models";
import { CardioLogEntry } from "./calendarLogging";
import { MacroTotals } from "./nutrition";

export type ProgressDateRange = "30d" | "90d" | "6m" | "1y" | "all";

export const progressDateRanges: { label: string; value: ProgressDateRange }[] = [
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" }
];

export type MeasurementType =
  | "Waist"
  | "Chest"
  | "Arms"
  | "Thighs"
  | "Hips"
  | "Neck"
  | "Shoulders"
  | "Custom";

export const measurementTypes: MeasurementType[] = [
  "Waist",
  "Chest",
  "Arms",
  "Thighs",
  "Hips",
  "Neck",
  "Shoulders",
  "Custom"
];

export type ProgressPhotoAngle = NonNullable<ProgressPhoto["angle"]>;

export const progressPhotoAngles: { label: string; value: ProgressPhotoAngle }[] = [
  { label: "Front", value: "front" },
  { label: "Side", value: "side" },
  { label: "Back", value: "back" },
  { label: "Other", value: "other" }
];

export type ChartPoint = {
  id?: string;
  date: string;
  label: string;
  value: number;
  meta?: string;
};

export type MacroChartPoint = ChartPoint &
  MacroTotals & {
    id: string;
  };

export type StrengthChartPoint = ChartPoint & {
  exerciseName: string;
  sets?: number;
  reps?: number;
  weight?: number;
};

export type ProgressRecordType = PersonalRecord["recordType"] | "volume";

export type PersonalRecordSummary = {
  id: string;
  exerciseName: string;
  recordType: ProgressRecordType;
  value: number;
  units: string;
  achievedAt: string;
  source: "auto" | "manual";
  notes?: string;
};

export type PhotoReminderStatus = {
  lastPhotoDate?: string;
  daysSinceLastPhoto?: number;
  nextDueDate?: string;
  isDue: boolean;
};

export type ProgressDashboardData = {
  weightEntries: BodyWeightEntry[];
  measurementEntries: BodyMeasurementEntry[];
  photos: ProgressPhoto[];
  macroLogs: DailyMacroLog[];
  macroPoints: MacroChartPoint[];
  strengthPoints: StrengthChartPoint[];
  cardioSessions: CardioLogEntry[];
  personalRecords: PersonalRecordSummary[];
  latestWeight?: BodyWeightEntry;
  latestMeasurements: BodyMeasurementEntry[];
  photoReminder: PhotoReminderStatus;
};

export type BodyWeightInput = {
  id?: string;
  date: string;
  weight: number;
  units: UnitPreference;
  notes?: string;
};

export type BodyMeasurementInput = {
  id?: string;
  date: string;
  measurementType: string;
  value: number;
  units: UnitPreference;
  notes?: string;
};

export type ProgressPhotoInput = {
  id?: string;
  date: string;
  angle: ProgressPhotoAngle;
  localUri: string;
  notes?: string;
};

export type ManualPersonalRecordInput = {
  id?: string;
  exerciseName: string;
  recordType: PersonalRecord["recordType"];
  value: number;
  units?: string;
  achievedAt: string;
  notes?: string;
};
