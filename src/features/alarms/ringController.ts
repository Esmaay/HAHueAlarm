/**
 * Coordinates a ringing alarm: the single source of truth for "an alarm is
 * going off right now" plus the side effects that go with it — looping audio,
 * the Hue lights, and rolling the schedule forward.
 *
 * The gradual pre-alarm ramp is owned by the sunrise scheduler; here we just
 * snap the room to full daylight when the alarm actually rings (covering the
 * case where the pre-ramp never ran), and apply the after-dismiss action.
 */

import { create } from 'zustand';

import { useHAStore } from '@/features/homeassistant/store';
import { applyPostDismiss, setFullDaylight, shouldRunSunrise } from '@/features/sunrise/engine';
import { cancelSunrise } from '@/features/sunrise/scheduler';

import { startAlarmSound, stopAlarmSound } from './audio';
import { scheduleAlarm, scheduleSnooze } from './notifications';
import { soundAsset } from './sounds';
import { useAlarmStore } from './store';
import type { Alarm } from './types';

interface RingState {
  /** The alarm currently ringing, captured by value so store edits can't disturb it. */
  ringingAlarm: Alarm | null;

  trigger: (alarmId: string) => void;
  dismiss: () => void;
  snooze: () => void;
}

function stopOutputs(): void {
  void stopAlarmSound();
  cancelSunrise();
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

    void startAlarmSound(soundAsset(alarm.soundId));

    const haConfig = useHAStore.getState().config;

    if (haConfig && shouldRunSunrise(alarm.sunrise)) {
      // Stop the gradual pre-ramp and make sure the room is fully lit now.
      cancelSunrise();
      void setFullDaylight(haConfig, alarm.sunrise);
    }

    // Roll the schedule forward: repeating alarms get their next occurrence;
    // a one-shot alarm switches itself off after firing.
    if (alarm.repeatDays.length === 0) {
      useAlarmStore.getState().toggleAlarm(alarm.id, false);
    } else {
      void scheduleAlarm(alarm);
    }
  },

  dismiss: () => {
    const alarm = get().ringingAlarm;

    stopOutputs();

    const haConfig = useHAStore.getState().config;

    if (alarm && haConfig && shouldRunSunrise(alarm.sunrise)) {
      void applyPostDismiss(haConfig, alarm.sunrise);
    }

    set({ ringingAlarm: null });
  },

  snooze: () => {
    const alarm = get().ringingAlarm;

    stopOutputs();

    if (alarm) {
      void scheduleSnooze(alarm, alarm.snoozeMinutes);
    }

    set({ ringingAlarm: null });
  },
}));
