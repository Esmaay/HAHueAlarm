/**
 * Time selector, adapted per platform.
 *
 * iOS renders the inline spinner wheel that matches the design. Android's native
 * picker is dialog-only, so we show a large, legible time that opens the system
 * time dialog on tap — the platform-honest equivalent.
 */

import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import { theme } from '@/theme';

import { toClockParts } from '../format';

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (hour: number, minute: number) => void;
}

function useTimeValue(hour: number, minute: number): Date {
  return useMemo(() => {
    const date = new Date();

    date.setHours(hour, minute, 0, 0);

    return date;
  }, [hour, minute]);
}

export function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  const value = useTimeValue(hour, minute);
  const [androidOpen, setAndroidOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') {
      setAndroidOpen(false);
    }

    if (event.type === 'dismissed' || !selected) {
      return;
    }

    onChange(selected.getHours(), selected.getMinutes());
  }

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.wrap}>
        <DateTimePicker
          value={value}
          mode="time"
          display="spinner"
          onChange={handleChange}
          textColor={theme.color.text}
          themeVariant="dark"
          style={styles.iosPicker}
        />
      </View>
    );
  }

  const clock = toClockParts(hour, minute);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setAndroidOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Change alarm time"
        style={({ pressed }) => [styles.androidField, pressed && styles.pressed]}
      >
        <AppText variant="clock" tabular>
          {clock.hour}:{clock.minute}
        </AppText>
        <AppText variant="title" tone="mute" style={styles.androidPeriod}>
          {clock.period}
        </AppText>
      </Pressable>

      {androidOpen ? (
        <DateTimePicker value={value} mode="time" display="spinner" onChange={handleChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPicker: {
    alignSelf: 'stretch',
    height: 196,
  },
  androidField: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: theme.space.sm,
    paddingVertical: theme.space.xl,
  },
  androidPeriod: {
    marginBottom: theme.space.sm,
  },
  pressed: {
    opacity: 0.6,
  },
});
