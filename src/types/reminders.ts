export type ReminderChannelKey = "workout" | "meal" | "progressPhoto";

export type ReminderSchedule = {
  enabled: boolean;
  days: number[];
  time: string;
};

export type LocalReminderSettings = Record<ReminderChannelKey, ReminderSchedule>;

export const reminderChannelLabels: Record<ReminderChannelKey, string> = {
  workout: "Workout reminder",
  meal: "Meal logging reminder",
  progressPhoto: "Weekly progress photo reminder"
};

export const weekDayOptions = [
  { label: "Sun", value: 1 },
  { label: "Mon", value: 2 },
  { label: "Tue", value: 3 },
  { label: "Wed", value: 4 },
  { label: "Thu", value: 5 },
  { label: "Fri", value: 6 },
  { label: "Sat", value: 7 }
];

export const recommendedReminderSettings: LocalReminderSettings = {
  workout: {
    enabled: true,
    days: [2, 4, 6],
    time: "18:00"
  },
  meal: {
    enabled: true,
    days: [1, 2, 3, 4, 5, 6, 7],
    time: "12:00"
  },
  progressPhoto: {
    enabled: true,
    days: [1],
    time: "09:00"
  }
};
