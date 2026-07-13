/**
 * Coordinates a ringing alarm: the single source of truth for "an alarm is
 * going off right now" plus the side effects that go with it.
 *
 * The alarm *sound* is owned by Notifee (the trigger notification loops the
 * channel sound, so it rings on a locked phone without the app running). This
 * controller therefore drives the lights and the schedule, and stops the sound
 * on dismiss/snooze by cancelling that notification.
 */

import { create } from 'zustand';

import { useHAStore } from '@/features/homeassistant/store';
import { applyPostDismiss, setFullDaylight, shouldRunSunrise } from '@/features/sunrise/engine';
import { cancelSunrise } from '@/features/sunrise/scheduler';

import { cancelRinging, scheduleAlarm, scheduleSnooze } from './notifications';
import { useAlarmStore } from './store';
import type { Alarm } from './types';

interface RingState {
  /** The alarm currently ringing, captured by value so store edits can't disturb it. */
  ringingAlarm: Alarm | null;

  trigger: (alarmId: string) => void;
  dismiss: () => void;
  snooze: () => void;
}

function isRepeating(alarm: Alarm): boolean {
  return alarm.repeatDays.length > 0;
}

export const useRingController = create<RingState>((set, get) => ({
  ringingAlarm: null,

  trigger: (alarmId) => {
    if (get().ringingAlarm) {
      return; // Already ringing — don't stack alarms.
    }

    const alarm = useAlarmStore.getState().getAlarm(alarmId);

    if (!alarm) {
      return;
    }

    set({ ringingAlarm: alarm });

    const haConfig = useHAStore.getState().config;

    if (haConfig && shouldRunSunrise(alarm.sunrise)) {
      // Stop the gradual pre-ramp and make sure the room is fully lit now.
      cancelSunrise();
      void setFullDaylight(haConfig, alarm.sunrise);
    }

    // A one-shot alarm switches itself off after firing; repeats are
    // rescheduled on dismiss/snooze so the current ring isn't disturbed.
    if (!isRepeating(alarm)) {
      useAlarmStore.getState().toggleAlarm(alarm.id, false);
    }
  },

  dismiss: () => {
    const alarm = get().ringingAlarm;

    if (alarm) {
      void cancelRinging(alarm.id);
    }

    cancelSunrise();

    const haConfig = useHAStore.getState().config;

    if (alarm && haConfig && shouldRunSunrise(alarm.sunrise)) {
      void applyPostDismiss(haConfig, alarm.sunrise);
    }

    if (alarm && isRepeating(alarm)) {
      void scheduleAlarm(alarm); // Arm the next occurrence.
    }

    set({ ringingAlarm: null });
  },

  snooze: () => {
    const alarm = get().ringingAlarm;

    if (alarm) {
      void cancelRinging(alarm.id);
      void scheduleSnooze(alarm, alarm.snoozeMinutes);

      if (isRepeating(alarm)) {
        void scheduleAlarm(alarm); // Keep the regular repeat going too.
      }
    }

    cancelSunrise();
    set({ ringingAlarm: null });
  },
}));
