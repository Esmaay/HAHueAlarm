import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppBar, AppText, Card, Row, Screen, SectionLabel } from '@/components/ui';
import { useEditorStore } from '@/features/alarms/editorStore';
import { theme } from '@/theme';

/** Split a comma / newline separated entity list into clean ids. */
function parseEntityIds(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/**
 * Hue target selection.
 *
 * Phase 1 accepts manual entity ids so the feature is fully usable without a
 * Home Assistant connection; Phase 3 replaces the inputs with a live picker of
 * the user's real lights.
 */
export default function HueTargetScreen() {
  const router = useRouter();
  const sunrise = useEditorStore((state) => state.draft.sunrise);
  const patchSunrise = useEditorStore((state) => state.patchSunrise);

  const [entityText, setEntityText] = useState(sunrise.targetEntityIds.join(', '));

  function commitEntities(text: string) {
    setEntityText(text);
    patchSunrise({ targetEntityIds: parseEntityIds(text) });
  }

  return (
    <Screen scroll>
      <AppBar title="Hue lights" left={{ label: 'Done', onPress: () => router.back() }} />

      <View style={styles.content}>
        <Card>
          <Row
            icon={undefined}
            label="Use Hue lights"
            trailing={
              <Switch
                value={sunrise.enabled}
                onValueChange={(enabled) => patchSunrise({ enabled })}
                trackColor={{ false: theme.color.surfaceAlt, true: theme.color.accent }}
                thumbColor={theme.color.text}
                ios_backgroundColor={theme.color.surfaceAlt}
              />
            }
          />
        </Card>

        {sunrise.enabled ? (
          <>
            <View style={styles.section}>
              <SectionLabel>Room name</SectionLabel>
              <Card>
                <View style={styles.field}>
                  <TextInput
                    value={sunrise.targetLabel === 'Not set' ? '' : sunrise.targetLabel}
                    onChangeText={(targetLabel) =>
                      patchSunrise({ targetLabel: targetLabel.trim() === '' ? 'Not set' : targetLabel })
                    }
                    placeholder="Bedroom"
                    placeholderTextColor={theme.color.textMute}
                    style={styles.input}
                    maxLength={30}
                    returnKeyType="done"
                  />
                </View>
              </Card>
            </View>

            <View style={styles.section}>
              <SectionLabel>Home Assistant entities</SectionLabel>
              <Card>
                <View style={styles.field}>
                  <TextInput
                    value={entityText}
                    onChangeText={commitEntities}
                    placeholder="light.bedroom_lamp, light.bedroom_ceiling"
                    placeholderTextColor={theme.color.textMute}
                    style={[styles.input, styles.multiline]}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                  />
                </View>
              </Card>
              <AppText variant="caption" tone="mute" style={styles.hint}>
                Enter the light entity ids to drive, separated by commas. A live picker of your
                real lights arrives once Home Assistant is connected.
              </AppText>
            </View>
          </>
        ) : (
          <AppText variant="body" tone="mute" style={styles.offHint}>
            This alarm will play sound only. Turn on Hue lights to wake the room with a sunrise.
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    gap: theme.space.xl,
  },
  section: {
    gap: theme.space.sm,
  },
  field: {
    paddingHorizontal: theme.space.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    paddingVertical: theme.space.md,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  hint: {
    paddingHorizontal: theme.space.xs,
    lineHeight: 18,
  },
  offHint: {
    paddingHorizontal: theme.space.xs,
    lineHeight: 20,
  },
});
