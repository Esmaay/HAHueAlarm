/**
 * Alarm scheduling via Notifee — the piece that makes alarms fire on a locked
 * phone.
 *
 * Each alarm is a Notifee **timestamp trigger** backed by AlarmManager
 * (`allowWhileIdle` → exact, fires through Doze). The displayed notification
 * carries a **full-screen action**, so when it fires Android launches the app
 * over the lock screen (MainActivity is flagged show-when-locked by the config
 * plugin), and **loops the channel sound** so it keeps ringing until dismissed.
 *
 * Sound files are copied into res/raw by the expo-notifications config plugin;
 * Notifee references them by resource name (no extension). One channel per sound
 * because a channel's sound is fixed at creation.
 */

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  type Notification,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import { palette } from '@/theme';

import { formatTime, nextOccurrenceOf, toClockParts } from './format';
import { knownSoundId, SOUND_IDS } from './sounds';
import type { Alarm } from './types';

const CHANNEL_PREFIX = 'alarm-';

function channelId(soundId: string): string {
  return `${CHANNEL_PREFIX}${knownSoundId(soundId)}`;
}

/** Stable per-alarm notification id so we can cancel/replace precisely. */
function notificationId(alarmId: string): string {
  return `alarm-${alarmId}`;
}

/** Pull the alarm id back out of a fired/tapped notification. */
export function alarmIdOf(notification?: Notification): string | null {
  const value = notification?.data?.alarmId;

  return typeof value === 'string' ? value : null;
}

/** One high-importance, DnD-bypassing channel per sound. Safe to re-run. */
export async function ensureChannels(): Promise<void> {
  await Promise.all(
    SOUND_IDS.map((id) =>
      notifee.createChannel({
        id: channelId(id),
        name: `Alarm — ${id}`,
        importance: AndroidImportance.HIGH,
        sound: id,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        bypassDnd: true,
        visibility: AndroidVisibility.PUBLIC,
        lights: true,
        lightColor: palette.dawn,
      }),
    ),
  );
}

/** Request notification permission (and surface the exact-alarm screen if needed). */
export async function requestAlarmPermissions(): Promise<boolean> {
  const settings = await notifee.requestPermission();

  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

function alarmBody(alarm: Alarm): string {
  const clock = toClockParts(alarm.hour, alarm.minute);

  return `${formatTime(alarm.hour, alarm.minute)} ${clock.period}`;
}

function buildNotification(alarm: Alarm): Notification {
  return {
    id: notificationId(alarm.id),
    title: alarm.label.trim() || 'Alarm',
    body: alarmBody(alarm),
    data: { alarmId: alarm.id },
    android: {
      channelId: channelId(alarm.soundId),
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      // Launch the app over the lock screen, ringing-screen and all.
      fullScreenAction: { id: 'default' },
      pressAction: { id: 'default' },
    },
  };
}

async function createTrigger(notification: Notification, whenMs: number): Promise<void> {
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: whenMs,
    alarmManager: { allowWhileIdle: true },
  };

  await notifee.createTriggerNotification(notification, trigger);
}

/** Schedule the next occurrence of one alarm. No-op if disabled. */
export async function scheduleAlarm(alarm: Alarm): Promise<void> {
  if (!alarm.enabled) {
    return;
  }

  await createTrigger(buildNotification(alarm), nextOccurrenceOf(alarm).getTime());
}

/** Re-fire a snoozed alarm `minutes` from now. */
export async function scheduleSnooze(alarm: Alarm, minutes: number): Promise<void> {
  const when = Date.now() + Math.max(1, Math.round(minutes)) * 60_000;

  await createTrigger({ ...buildNotification(alarm), id: `snooze-${alarm.id}` }, when);
}

/** Stop a currently-ringing alarm (cancels the displayed notification + sound). */
export async function cancelRinging(alarmId: string): Promise<void> {
  await notifee.cancelNotification(notificationId(alarmId));
  await notifee.cancelNotification(`snooze-${alarmId}`);
}

/** Rebuild the full trigger schedule from the current alarm list. */
export async function syncAlarms(alarms: Alarm[]): Promise<void> {
  const pending = await notifee.getTriggerNotificationIds();

  await Promise.all(pending.map((id) => notifee.cancelTriggerNotification(id)));
  await Promise.all(alarms.filter((alarm) => alarm.enabled).map(scheduleAlarm));
}
