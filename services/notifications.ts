import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Plant } from '@/models/Plant';
import { parseISO, differenceInSeconds, setHours, setMinutes, startOfDay, addDays } from 'date-fns';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('watering', {
      name: 'Watering Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2E7D32',
    });
  }

  return true;
}

export async function scheduleWateringReminder(
  plant: Plant,
  reminderHour: number = 9,
  reminderMinute: number = 0
): Promise<string | null> {
  // Cancel existing notifications for this plant
  await cancelPlantNotifications(plant.id);

  const nextWatering = parseISO(plant.nextWateringAt);
  let triggerDate = setMinutes(setHours(startOfDay(nextWatering), reminderHour), reminderMinute);

  // If the trigger time is in the past, schedule for tomorrow
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate = addDays(triggerDate, 1);
  }

  const secondsUntilTrigger = differenceInSeconds(triggerDate, new Date());
  if (secondsUntilTrigger <= 0) return null;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Water your ${plant.name}`,
      body: `Your ${plant.species} is ready for watering!`,
      data: { plantId: plant.id },
      ...(Platform.OS === 'android' ? { channelId: 'watering' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilTrigger,
    },
  });

  return id;
}

export async function cancelPlantNotifications(plantId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.plantId === plantId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

export async function rescheduleAllReminders(
  plants: Plant[],
  reminderHour: number = 9,
  reminderMinute: number = 0
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const plant of plants) {
    await scheduleWateringReminder(plant, reminderHour, reminderMinute);
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}
