/**
 * Headless runtime that makes alarms actually fire. Rendered once at the root.
 *
 * Responsibilities, one per effect:
 *   • prepare notification channels + permissions,
 *   • keep the OS schedule in sync with the stored alarms,
 *   • react to notification taps/deliveries by starting the ring,
 *   • while the app is foregrounded, fire the next alarm precisely on time,
 *   • send the user to the ringing screen whenever an alarm starts.
 *
 * The foreground timer is what makes "set an alarm, keep the app open" reliable;
 * the notifications cover the backgrounded case. True locked-screen firing is a
 * Notifee follow-up.
 */

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { nextEnabledAlarm, nextOccurrenceOf } from './format';
import {
  configureNotificationHandler,
  ensureChannels,
  requestNotificationPermissions,
  syncAlarms,
} from './notifications';
import { useRingController } from './ringController';
import { useAlarmStore } from './store';

/** Don't hold a foreground timer for alarms more than a day out. */
const MAX_TIMER_MS = 26 * 60 * 60 * 1000;

// Register the foreground presentation behaviour once, at module load.
configureNotificationHandler();

export function AlarmRuntime() {
  const router = useRouter();

  const alarms = useAlarmStore((state) => state.alarms);
  const hydrated = useAlarmStore((state) => state.hydrated);

  const ringingAlarmId = useRingController((state) => state.ringingAlarm?.id ?? null);
  const trigger = useRingController((state) => state.trigger);

  // Bumped when the app returns to the foreground, to re-arm the timer.
  const [resumeTick, setResumeTick] = useState(0);

  // Channels + permission, once.
  useEffect(() => {
    void ensureChannels();
    void requestNotificationPermissions();
  }, []);

  // Keep the OS schedule aligned with the stored alarms.
  useEffect(() => {
    if (hydrated) {
      void syncAlarms(alarms);
    }
  }, [alarms, hydrated]);

  // Notification tap or foreground delivery → start ringing.
  useEffect(() => {
    function handle(notification: Notifications.Notification) {
      const alarmId = notification.request.content.data?.alarmId;

      if (typeof alarmId === 'string') {
        trigger(alarmId);
      }
    }

    const received = Notifications.addNotificationReceivedListener(handle);
    const response = Notifications.addNotificationResponseReceivedListener((event) =>
      handle(event.notification),
    );

    return () => {
      received.remove();
      response.remove();
    };
  }, [trigger]);

  // Re-arm the precise foreground timer on any relevant change.
  useEffect(() => {
    if (!hydrated || ringingAlarmId) {
      return;
    }

    const soonest = nextEnabledAlarm(alarms);

    if (!soonest) {
      return;
    }

    const delay = nextOccurrenceOf(soonest).getTime() - Date.now();

    if (delay > MAX_TIMER_MS) {
      return;
    }

    const timer = setTimeout(() => trigger(soonest.id), Math.max(0, delay));

    return () => clearTimeout(timer);
  }, [alarms, hydrated, ringingAlarmId, resumeTick, trigger]);

  // Recompute the timer when the app comes back to the foreground.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setResumeTick((tick) => tick + 1);
      }
    });

    return () => subscription.remove();
  }, []);

  // Centralised navigation: whenever an alarm starts, show the ringing screen.
  useEffect(() => {
    if (ringingAlarmId) {
      router.push('/ring');
    }
  }, [ringingAlarmId, router]);

  return null;
}
