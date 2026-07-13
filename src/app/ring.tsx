import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { Sunrise, Vibrate } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { toClockParts } from '@/features/alarms/format';
import { useRingController } from '@/features/alarms/ringController';
import type { Alarm } from '@/features/alarms/types';
import { palette, theme } from '@/theme';

/** g-force magnitude above which a single shake is counted. */
const SHAKE_THRESHOLD = 1.7;
const SHAKE_MIN_GAP_MS = 220;

/**
 * The ringing screen. A single, calm focus: the time, one line of context, and
 * a dismiss path sized for clumsy half-asleep thumbs. The background glows warm
 * to echo the lights rising in the room.
 */
export default function RingScreen() {
  const router = useRouter();
  const alarm = useRingController((state) => state.ringingAlarm);

  // When the alarm is dismissed or snoozed elsewhere, leave the screen.
  useEffect(() => {
    if (!alarm) {
      router.replace('/');
    }
  }, [alarm, router]);

  if (!alarm) {
    return <View style={styles.fill} />;
  }

  return <RingContent alarm={alarm} />;
}

function RingContent({ alarm }: { alarm: Alarm }) {
  const dismiss = useRingController((state) => state.dismiss);
  const snooze = useRingController((state) => state.snooze);

  const clock = toClockParts(alarm.hour, alarm.minute);
  const isShakeMission = alarm.mission.type === 'shake';
  const shakeTarget = alarm.mission.shakeCount;

  const [shakeCount, setShakeCount] = useState(0);
  const lastShakeAt = useRef(0);

  useEffect(() => {
    if (!isShakeMission) {
      return;
    }

    Accelerometer.setUpdateInterval(80);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (magnitude > SHAKE_THRESHOLD && now - lastShakeAt.current > SHAKE_MIN_GAP_MS) {
        lastShakeAt.current = now;
        setShakeCount((count) => count + 1);
      }
    });

    return () => subscription.remove();
  }, [isShakeMission]);

  // Complete the shake mission → dismiss.
  useEffect(() => {
    if (isShakeMission && shakeCount >= shakeTarget) {
      dismiss();
    }
  }, [isShakeMission, shakeCount, shakeTarget, dismiss]);

  const progress = Math.min(1, shakeCount / shakeTarget);
  const label = alarm.label.trim() || 'Good morning';

  return (
    <LinearGradient
      colors={[palette.ember, '#2A160B', palette.night] as const}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.fill}
    >
      <View style={styles.center}>
        <AppText variant="clock" tabular style={styles.time}>
          {clock.hour}:{clock.minute}
        </AppText>
        <AppText variant="title" tone="soft" style={styles.period}>
          {clock.period}
        </AppText>

        <View style={styles.context}>
          <Sunrise size={16} color={theme.color.accent} strokeWidth={2} />
          <AppText variant="body" tone="soft">
            {label}
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        {isShakeMission ? (
          <View style={styles.mission}>
            <Vibrate size={36} color={theme.color.accent} strokeWidth={2} />
            <AppText variant="label" tone="soft" style={styles.missionLabel}>
              SHAKE TO DISMISS
            </AppText>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <AppText variant="caption" tone="mute" tabular>
              {shakeCount} / {shakeTarget}
            </AppText>
          </View>
        ) : (
          <Pressable
            onLongPress={dismiss}
            delayLongPress={700}
            style={({ pressed }) => [styles.stopButton, pressed && styles.stopPressed]}
          >
            <AppText variant="heading" tone="onAccent" weight="bold">
              Hold to stop
            </AppText>
          </Pressable>
        )}

        <Pressable
          onPress={snooze}
          style={({ pressed }) => [styles.snoozeButton, pressed && styles.snoozePressed]}
        >
          <AppText variant="body" tone="default" weight="semibold">
            Snooze {alarm.snoozeMinutes} min
          </AppText>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    fontSize: 88,
    fontWeight: theme.font.weight.regular,
  },
  period: {
    marginTop: -theme.space.sm,
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.xl,
  },
  actions: {
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space.xxxl,
    gap: theme.space.lg,
    alignItems: 'center',
  },
  mission: {
    alignItems: 'center',
    gap: theme.space.md,
    alignSelf: 'stretch',
  },
  missionLabel: {
    letterSpacing: 2,
  },
  progressTrack: {
    height: 8,
    width: '80%',
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.accent,
  },
  stopButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.accent,
  },
  stopPressed: {
    opacity: 0.85,
  },
  snoozeButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: theme.space.lg,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  snoozePressed: {
    opacity: 0.7,
  },
});
