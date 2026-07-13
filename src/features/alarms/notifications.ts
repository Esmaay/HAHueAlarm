/**
 * OS-level alarm scheduling via expo-notifications.
 *
 * Each sound gets its own Android channel (a channel's sound is fixed at
 * creation, so per-alarm tones need per-sound channels) at MAX importance so
 * the alarm heads-up and rings through Do Not Disturb. Notifications carry the
 * `alarmId` in their data so taps and reschedules can find the alarm.
 *
 * Scheduling is "rolling": we schedule the next occurrence; when an alarm fires
 * the app reschedules the following one. This is reliable while the app is
 * opened periodically — true always-on background firing is a Notifee follow-up.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { palette } from '@/theme';

import { formatTime, nextOccurrenceOf, toClockParts } from './format';
import { knownSoundId, notificationSoundName, SOUND_IDS } from './sounds';
import type { Alarm } from './types';

const CHANNEL_PREFIX = 'alarm-';

function channelId(soundId: string): string {
  return `${CHANNEL_PREFIX}${knownSoundId(soundId)}`;
}

/**
 * Foreground presentation. Sound is left to the in-app looping player (which
 * starts when the alarm fires), so the OS sound is suppressed here to avoid
 * doubling; backgrounded delivery still rings via the channel sound.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Create one high-importance channel per sound. Android-only; safe to re-run. */
export async function ensureChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await Promise.all(
    SOUND_IDS.map((id) =>
      Notifications.setNotificationChannelAsync(channelId(id), {
        name: `Alarm — ${id}`,
        importance: Notifications.AndroidImportance.MAX,
        sound: notificationSoundName(id),
        vibrationPattern: [0, 400, 250, 400],
        bypassDnd: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        lightColor: palette.dawn,
      }),
    ),
  );
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();

  return requested.granted;
}

function alarmBody(alarm: Alarm): string {
  const clock = toClockParts(alarm.hour, alarm.minute);

  return `${formatTime(alarm.hour, alarm.minute)} ${clock.period}`;
}

/** Schedule the next occurrence of one alarm. No-op if disabled. */
export async function scheduleAlarm(alarm: Alarm): Promise<void> {
  if (!alarm.enabled) {
    return;
  }

  const soundId = knownSoundId(alarm.soundId);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.label.trim() || 'Alarm',
      body: alarmBody(alarm),
      sound: notificationSoundName(soundId),
      data: { alarmId: alarm.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextOccurrenceOf(alarm),
      channelId: channelId(soundId),
    },
  });
}

/** Fire a fresh notification `minutes` from now for a snoozed alarm. */
export async function scheduleSnooze(alarm: Alarm, minutes: number): Promise<void> {
  const soundId = knownSoundId(alarm.soundId);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.label.trim() || 'Alarm',
      body: 'Snoozed',
      sound: notificationSoundName(soundId),
      data: { alarmId: alarm.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(minutes * 60)),
      channelId: channelId(soundId),
    },
  });
}

/** Cancel any scheduled notifications belonging to one alarm. */
export async function cancelAlarm(alarmId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.alarmId === alarmId)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

/** Rebuild the full schedule from the current alarm list. */
export async function syncAlarms(alarms: Alarm[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Promise.all(alarms.filter((alarm) => alarm.enabled).map(scheduleAlarm));
}
