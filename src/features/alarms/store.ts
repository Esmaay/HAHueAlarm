/**
 * Alarm state, persisted to the device.
 *
 * Zustand with the `persist` middleware keeps the list in AsyncStorage and
 * rehydrates on launch. Components subscribe to slices via selectors so a
 * single toggle never re-renders unrelated screens.
 *
 * This layer owns identity and timestamps; callers pass `AlarmDraft`s and get
 * fully-formed `Alarm`s back. Side effects that belong to firing an alarm
 * (scheduling notifications, calling Home Assistant) are wired in later phases
 * via `onAlarmsChanged`, keeping the store itself pure persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createId } from '@/lib/id';

import { createSeedAlarmDraft } from './catalog';
import type { Alarm, AlarmDraft } from './types';

const STORAGE_KEY = 'hahue.alarms.v1';

interface AlarmState {
  alarms: Alarm[];
  hydrated: boolean;

  addAlarm: (draft: AlarmDraft) => Alarm;
  updateAlarm: (id: string, draft: AlarmDraft) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string, enabled: boolean) => void;
  getAlarm: (id: string) => Alarm | undefined;
}

function draftToAlarm(draft: AlarmDraft): Alarm {
  const now = Date.now();

  return {
    ...draft,
    id: createId(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Newest-first isn't wanted here; alarms read best sorted by time of day. */
function byTimeOfDay(a: Alarm, b: Alarm): number {
  return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      hydrated: false,

      addAlarm: (draft) => {
        const alarm = draftToAlarm(draft);

        set((state) => ({ alarms: [...state.alarms, alarm].sort(byTimeOfDay) }));

        return alarm;
      },

      updateAlarm: (id, draft) => {
        set((state) => ({
          alarms: state.alarms
            .map((alarm) =>
              alarm.id === id ? { ...alarm, ...draft, updatedAt: Date.now() } : alarm,
            )
            .sort(byTimeOfDay),
        }));
      },

      removeAlarm: (id) => {
        set((state) => ({ alarms: state.alarms.filter((alarm) => alarm.id !== id) }));
      },

      toggleAlarm: (id, enabled) => {
        set((state) => ({
          alarms: state.alarms.map((alarm) =>
            alarm.id === id ? { ...alarm, enabled, updatedAt: Date.now() } : alarm,
          ),
        }));
      },

      getAlarm: (id) => get().alarms.find((alarm) => alarm.id === id),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ alarms: state.alarms }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        // First-ever launch: seed a sunrise example so the app is never empty.
        if (state.alarms.length === 0) {
          state.addAlarm(createSeedAlarmDraft());
        }

        state.hydrated = true;
      },
    },
  ),
);
