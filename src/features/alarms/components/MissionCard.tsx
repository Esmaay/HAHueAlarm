/**
 * Inline editor for the wake mission.
 *
 * V1 offers two modes — off (plain hold-to-stop) and shake-to-dismiss — with a
 * stepper for how many shakes are required. Reads and writes the shared editor
 * draft directly, so the parent screen stays declarative.
 */

import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, SegmentedControl, type SegmentOption } from '@/components/ui';
import { theme } from '@/theme';

import { useEditorStore } from '../editorStore';
import type { WakeMission } from '../types';

const MODE_OPTIONS: readonly SegmentOption<WakeMission['type']>[] = [
  { value: 'none', label: 'Off' },
  { value: 'shake', label: 'Shake' },
];

const SHAKE_MIN = 5;
const SHAKE_MAX: number = 50;
const SHAKE_STEP = 5;

function clampShakes(count: number): number {
  return Math.min(SHAKE_MAX, Math.max(SHAKE_MIN, count));
}

export function MissionCard() {
  const mission = useEditorStore((state) => state.draft.mission);
  const patchMission = useEditorStore((state) => state.patchMission);

  const adjustShakes = (delta: number) =>
    patchMission({ shakeCount: clampShakes(mission.shakeCount + delta) });

  return (
    <Card>
      <View style={styles.body}>
        <SegmentedControl
          options={MODE_OPTIONS}
          value={mission.type}
          onChange={(type) => patchMission({ type })}
        />

        {mission.type === 'shake' ? (
          <View style={styles.stepperRow}>
            <AppText variant="body" tone="soft">
              Shakes to dismiss
            </AppText>

            <View style={styles.stepper}>
              <StepButton
                icon={Minus}
                onPress={() => adjustShakes(-SHAKE_STEP)}
                disabled={mission.shakeCount <= SHAKE_MIN}
                accessibilityLabel="Fewer shakes"
              />
              <AppText variant="heading" tabular style={styles.count}>
                {mission.shakeCount}
              </AppText>
              <StepButton
                icon={Plus}
                onPress={() => adjustShakes(SHAKE_STEP)}
                disabled={mission.shakeCount >= SHAKE_MAX}
                accessibilityLabel="More shakes"
              />
            </View>
          </View>
        ) : null}

        <AppText variant="caption" tone="mute">
          {mission.type === 'shake'
            ? 'Shake the phone to silence the alarm — the lights keep rising until you do.'
            : 'Dismiss with a press and hold. Turn on a mission to make oversleeping harder.'}
        </AppText>
      </View>
    </Card>
  );
}

function StepButton({
  icon: Icon,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  icon: typeof Minus;
  onPress: () => void;
  disabled: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={theme.hitSlop}
      style={({ pressed }) => [
        styles.stepButton,
        pressed && styles.stepPressed,
        disabled && styles.stepDisabled,
      ]}
    >
      <Icon size={18} color={theme.color.accent} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  count: {
    minWidth: 32,
    textAlign: 'center',
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surfaceAlt,
  },
  stepPressed: {
    opacity: 0.6,
  },
  stepDisabled: {
    opacity: 0.35,
  },
});
