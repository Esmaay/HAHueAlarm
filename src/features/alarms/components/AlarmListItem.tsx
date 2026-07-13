/**
 * One alarm on the home list: the time as hero, a schedule/sunrise subtitle,
 * Hue + sound chips, and the daily-use toggle on the right.
 *
 * Disabled alarms dim rather than disappear, matching the platform mental
 * model. Tapping the body opens the editor; the toggle is an independent
 * one-tap control.
 */

import { Lightbulb, Volume2 } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText, Chip } from '@/components/ui';
import { theme } from '@/theme';

import { soundLabel } from '../catalog';
import { formatRepeat, toClockParts } from '../format';
import type { Alarm } from '../types';

interface AlarmListItemProps {
  alarm: Alarm;
  onPress: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

function buildSubtitle(alarm: Alarm): string {
  const parts = [formatRepeat(alarm.repeatDays)];

  if (alarm.label.trim().length > 0) {
    parts.push(alarm.label.trim());
  }

  if (alarm.sunrise.enabled) {
    parts.push(`Sunrise ${alarm.sunrise.durationMin} min`);
  }

  return parts.join('  ·  ');
}

function AlarmListItemComponent({ alarm, onPress, onToggle }: AlarmListItemProps) {
  const clock = toClockParts(alarm.hour, alarm.minute);
  const dimmed = !alarm.enabled;

  return (
    <Pressable
      onPress={() => onPress(alarm.id)}
      accessibilityRole="button"
      accessibilityLabel={`Alarm at ${clock.hour}:${clock.minute} ${clock.period}, ${formatRepeat(alarm.repeatDays)}`}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.main}>
        <View style={styles.timeRow}>
          <AppText variant="clock" tone={dimmed ? 'mute' : 'default'} tabular style={styles.time}>
            {clock.hour}:{clock.minute}
          </AppText>
          <AppText variant="heading" tone="mute" style={styles.period}>
            {clock.period}
          </AppText>
        </View>

        <AppText variant="caption" tone="mute" numberOfLines={1}>
          {buildSubtitle(alarm)}
        </AppText>

        <View style={styles.chips}>
          {alarm.sunrise.enabled ? (
            <Chip label={alarm.sunrise.targetLabel} icon={Lightbulb} accent />
          ) : null}
          <Chip label={soundLabel(alarm.soundId)} icon={Volume2} />
        </View>
      </View>

      <Switch
        value={alarm.enabled}
        onValueChange={(next) => onToggle(alarm.id, next)}
        trackColor={{ false: theme.color.surfaceAlt, true: theme.color.accent }}
        thumbColor={theme.color.text}
        ios_backgroundColor={theme.color.surfaceAlt}
        accessibilityLabel={`Toggle alarm at ${clock.hour}:${clock.minute} ${clock.period}`}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.lg,
  },
  pressed: {
    backgroundColor: theme.color.surfacePressed,
    borderRadius: theme.radius.md,
  },
  main: {
    flex: 1,
    gap: theme.space.xs,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space.xs,
  },
  time: {
    fontWeight: theme.font.weight.regular,
  },
  period: {
    marginBottom: theme.space.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.xs,
  },
});

export const AlarmListItem = memo(AlarmListItemComponent);
