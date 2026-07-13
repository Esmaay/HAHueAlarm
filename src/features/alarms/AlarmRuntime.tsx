/**
 * Headless runtime that makes alarms actually fire. Rendered once at the root.
 *
 * Notifee owns firing now: each alarm is an exact AlarmManager trigger whose
 * notification loops the sound and carries a full-screen action, so it rings and
 * launches the ring screen over the lock screen without the app running. This
 * component just:
 *   • prepares channels + permission,
 *   • keeps the trigger schedule in sync with the stored alarms,
 *   • turns Notifee delivery/press (and a cold full-screen launch) into a ring,
 *   • drives the foreground pre-alarm sunrise ramp,
 *   • sends the user to the ringing screen whenever an alarm starts.
 */

import notifee, { EventType } from '@notifee/react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useHAStore } from '@/features/homeassistant/store';
import { cancelSunrise, syncSunrise } from '@/features/sunrise/scheduler';

import { alarmIdOf, ensureChannels, requestAlarmPermissions, syncAlarms } from './notifications';
import { useRingController } from './ringController';
import { useAlarmStore } from './store';

export function AlarmRuntime() {
  const router = useRouter();

  const alarms = useAlarmStore((state) => state.alarms);
  const hydrated = useAlarmStore((state) => state.hydrated);

  const ringingAlarmId = useRingController((state) => state.ringingAlarm?.id ?? null);
  const trigger = useRingController((state) => state.trigger);

  const haConfig = useHAStore((state) => state.config);

  // Bumped when the app returns to the foreground, to re-arm the sunrise ramp.
  const [resumeTick, setResumeTick] = useState(0);

  // Channels + permission, once.
  useEffect(() => {
    void ensureChannels();
    void requestAlarmPermissions();
  }, []);

  // Keep the trigger schedule aligned with the stored alarms.
  useEffect(() => {
    if (hydrated) {
      void syncAlarms(alarms);
    }
  }, [alarms, hydrated]);

  // A full-screen launch or notification tap while the app is live → start ringing.
  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.DELIVERED || type === EventType.PRESS) {
        const alarmId = alarmIdOf(detail.notification);

        if (alarmId) {
          trigger(alarmId);
        }
      }
    });
  }, [trigger]);

  // Cold start from a full-screen intent / notification press.
  useEffect(() => {
    void notifee.getInitialNotification().then((initial) => {
      const alarmId = alarmIdOf(initial?.notification);

      if (alarmId) {
        trigger(alarmId);
      }
    });
  }, [trigger]);

  // Arm/reconcile the pre-alarm sunrise ramp (idempotent for the same alarm).
  useEffect(() => {
    if (hydrated) {
      syncSunrise(alarms, haConfig);
    }
  }, [alarms, hydrated, haConfig, ringingAlarmId, resumeTick]);

  useEffect(() => cancelSunrise, []);

  // Recompute the sunrise timing when the app comes back to the foreground.
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
