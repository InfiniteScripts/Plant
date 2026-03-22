import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { requestNotificationPermissions, rescheduleAllReminders } from '@/services/notifications';
import { usePlantStore } from '@/stores/plantStore';

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const plants = usePlantStore((s) => s.plants);

  useEffect(() => {
    requestNotificationPermissions().then(setPermissionGranted);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const plantId = response.notification.request.content.data?.plantId;
      if (plantId) {
        // Navigation to plant detail can be handled by deep linking
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Reschedule all reminders when plants change
  useEffect(() => {
    if (permissionGranted && plants.length > 0) {
      rescheduleAllReminders(plants);
    }
  }, [plants, permissionGranted]);

  return { permissionGranted };
}
