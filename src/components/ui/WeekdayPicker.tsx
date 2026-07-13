/**
 * Monday-first row of day toggles for an alarm's repeat rule.
 *
 * Emits the full selected set on every change so the parent stays the single
 * source of truth (no internal selection state to drift out of sync).
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { weekdayInitials } from '@/features/alarms/format';
import type { Weekday } from '@/features/alarms/types';
import { theme } from '@/theme';

interface WeekdayPickerProps {
  selected: Weekday[];
  onChange: (days: Weekday[]) => void;
}

export function WeekdayPicker({ selected, onChange }: WeekdayPickerProps) {
  const selectedSet = new Set(selected);

  function toggle(day: Weekday) {
    const next = new Set(selectedSet);

    if (next.has(day)) {
      next.delete(day);
    } else {
      next.add(day);
    }

    onChange([...next].sort((a, b) => a - b) as Weekday[]);
  }

  return (
    <View style={styles.row}>
      {weekdayInitials().map(({ day, label }) => {
        const isOn = selectedSet.has(day);

        return (
          <Pressable
            key={day}
            onPress={() => toggle(day)}
            accessibilityRole="button"
            accessibilityState={{ selected: isOn }}
            style={({ pressed }) => [
              styles.day,
              isOn && styles.dayOn,
              pressed && styles.dayPressed,
            ]}
          >
            <AppText variant="body" tone={isOn ? 'onAccent' : 'soft'} weight="semibold">
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.space.sm,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  dayOn: {
    backgroundColor: theme.color.accent,
  },
  dayPressed: {
    opacity: 0.6,
  },
});
