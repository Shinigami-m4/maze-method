import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

import { LocalReminderSettings, ReminderChannelKey, reminderChannelLabels } from "../types/reminders";

const notificationChannelId = "maze-method-reminders";

const reminderContent: Record<ReminderChannelKey, { title: string; body: string }> = {
  workout: {
    title: "Maze Method workout reminder",
    body: "Follow today's path and log the session when it is done."
  },
  meal: {
    title: "Maze Method meal reminder",
    body: "Log meals while the details are still fresh."
  },
  progressPhoto: {
    title: "Maze Method progress photo",
    body: "Capture a consistent progress photo for this week's check-in."
  }
};

export function configureLocalNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false
    })
  });
}

export async function syncLocalReminderNotifications(settings: LocalReminderSettings) {
  await cancelMazeMethodReminders();

  if (!hasAnyEnabledReminder(settings)) {
    return { granted: true, scheduledCount: 0 };
  }

  const permissions = await Notifications.requestPermissionsAsync();

  if (!permissions.granted) {
    return { granted: false, scheduledCount: 0 };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(notificationChannelId, {
      name: "Maze Method reminders",
      importance: Notifications.AndroidImportance.DEFAULT
    });
  }

  let scheduledCount = 0;

  for (const key of Object.keys(settings) as ReminderChannelKey[]) {
    const schedule = settings[key];

    if (!schedule.enabled) {
      continue;
    }

    const { hour, minute } = parseReminderTime(schedule.time);

    for (const weekday of schedule.days) {
      await Notifications.scheduleNotificationAsync({
        identifier: createReminderIdentifier(key, weekday),
        content: {
          title: reminderContent[key].title,
          body: reminderContent[key].body,
          data: {
            mazeMethodReminder: true,
            reminderKey: key,
            reminderLabel: reminderChannelLabels[key]
          }
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          channelId: notificationChannelId,
          weekday,
          hour,
          minute
        }
      });
      scheduledCount += 1;
    }
  }

  return { granted: true, scheduledCount };
}

export async function cancelMazeMethodReminders() {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduledNotifications
      .filter((request) => request.content.data?.mazeMethodReminder === true)
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier))
  );
}

function hasAnyEnabledReminder(settings: LocalReminderSettings) {
  return Object.values(settings).some((schedule) => schedule.enabled && schedule.days.length > 0);
}

function parseReminderTime(time: string) {
  const [hourValue, minuteValue] = time.split(":").map(Number);
  const hour = Number.isFinite(hourValue) ? Math.max(0, Math.min(23, hourValue)) : 9;
  const minute = Number.isFinite(minuteValue) ? Math.max(0, Math.min(59, minuteValue)) : 0;

  return { hour, minute };
}

function createReminderIdentifier(key: ReminderChannelKey, weekday: number) {
  return `maze-method:${key}:${weekday}`;
}
