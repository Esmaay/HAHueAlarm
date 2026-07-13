import { useRouter } from 'expo-router';
import { Lightbulb, Sunrise, Volume2 } from 'lucide-react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import {
  AppBar,
  AppText,
  Button,
  Card,
  Row,
  Screen,
  SectionLabel,
  WeekdayPicker,
} from '@/components/ui';
import { MissionCard } from '@/features/alarms/components/MissionCard';
import { TimePicker } from '@/features/alarms/components/TimePicker';
import { soundLabel, sunriseStyleOption } from '@/features/alarms/catalog';
import { formatRingsIn } from '@/features/alarms/format';
import { useEditorStore } from '@/features/alarms/editorStore';
import { useAlarmStore } from '@/features/alarms/store';
import type { SunriseStyle } from '@/features/alarms/types';
import { theme } from '@/theme';

/** Summary shown on the Sunrise row: "20 min · Warm wake", or "Off". */
function sunriseRowValue(enabled: boolean, durationMin: number, style: SunriseStyle): string {
  if (!enabled) {
    return 'Off';
  }

  return `${durationMin} min · ${sunriseStyleOption(style).label}`;
}

/**
 * Alarm editor. A pure view over the editor draft, which is seeded by the
 * caller (see the list screen's `openEditor`) before navigation — so there is
 * no init effect, no flash of defaults, and Save/Delete key off `editingId`.
 */
export default function AlarmEditorScreen() {
  const router = useRouter();

  const draft = useEditorStore((state) => state.draft);
  const editingId = useEditorStore((state) => state.editingId);
  const patch = useEditorStore((state) => state.patch);

  const addAlarm = useAlarmStore((state) => state.addAlarm);
  const updateAlarm = useAlarmStore((state) => state.updateAlarm);
  const removeAlarm = useAlarmStore((state) => state.removeAlarm);

  const isNew = editingId === null;

  function handleSave() {
    if (editingId) {
      updateAlarm(editingId, draft);
    } else {
      addAlarm(draft);
    }

    router.back();
  }

  function handleDelete() {
    if (editingId) {
      removeAlarm(editingId);
    }

    router.back();
  }

  return (
    <Screen>
      <AppBar
        left={{ label: 'Cancel', onPress: () => router.back() }}
        right={{ label: 'Save', onPress: handleSave, tone: 'accent' }}
      />

      <Screen scroll contentStyle={styles.content}>
        <View style={styles.picker}>
          <TimePicker
            hour={draft.hour}
            minute={draft.minute}
            onChange={(hour, minute) => patch({ hour, minute })}
          />
          <AppText variant="caption" tone="accent" weight="semibold">
            {formatRingsIn(draft)}
          </AppText>
        </View>

        <View style={styles.section}>
          <SectionLabel>Repeat</SectionLabel>
          <WeekdayPicker
            selected={draft.repeatDays}
            onChange={(repeatDays) => patch({ repeatDays })}
          />
        </View>

        <View style={styles.section}>
          <Card>
            <Row
              icon={Lightbulb}
              label="Hue lights"
              value={draft.sunrise.enabled ? draft.sunrise.targetLabel : 'Off'}
              onPress={() => router.push('/alarm/hue')}
            />
            <Row
              icon={Sunrise}
              label="Sunrise"
              value={sunriseRowValue(
                draft.sunrise.enabled,
                draft.sunrise.durationMin,
                draft.sunrise.style,
              )}
              onPress={() => router.push('/alarm/sunrise')}
            />
            <Row
              icon={Volume2}
              label="Sound"
              value={soundLabel(draft.soundId)}
              onPress={() => router.push('/alarm/sound')}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <SectionLabel>Wake mission</SectionLabel>
          <MissionCard />
        </View>

        <View style={styles.section}>
          <SectionLabel>Label</SectionLabel>
          <Card>
            <View style={styles.labelRow}>
              <TextInput
                value={draft.label}
                onChangeText={(label) => patch({ label })}
                placeholder="Good morning"
                placeholderTextColor={theme.color.textMute}
                style={styles.labelInput}
                returnKeyType="done"
                maxLength={40}
              />
            </View>
          </Card>
        </View>

        {!isNew ? (
          <Button
            label="Delete alarm"
            variant="secondary"
            onPress={handleDelete}
            style={styles.delete}
          />
        ) : null}
      </Screen>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xxxl,
    gap: theme.space.xl,
  },
  picker: {
    alignItems: 'center',
    gap: theme.space.xs,
    paddingTop: theme.space.sm,
  },
  section: {
    gap: theme.space.sm,
  },
  labelRow: {
    paddingHorizontal: theme.space.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  labelInput: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    paddingVertical: theme.space.md,
  },
  delete: {
    marginTop: theme.space.sm,
  },
});
