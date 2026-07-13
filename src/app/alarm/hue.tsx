import { useRouter } from 'expo-router';
import { Check, Plug, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';

import {
  AppBar,
  AppText,
  Button,
  Card,
  Row,
  Screen,
  SectionLabel,
  TextField,
} from '@/components/ui';
import { useEditorStore } from '@/features/alarms/editorStore';
import { useHAStore } from '@/features/homeassistant/store';
import type { HAEntity } from '@/features/homeassistant/types';
import { theme } from '@/theme';

/** Split a comma / newline separated entity list into clean ids. */
function parseEntityIds(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

/** A friendly label for the chosen lights, shown on the alarm's rows. */
function summarizeSelection(entityIds: string[], lights: HAEntity[]): string {
  if (entityIds.length === 0) {
    return 'Not set';
  }

  if (entityIds.length === 1) {
    return lights.find((light) => light.entityId === entityIds[0])?.friendlyName ?? entityIds[0];
  }

  return `${entityIds.length} lights`;
}

/**
 * Hue target selection.
 *
 * When Home Assistant is connected, the lights are chosen from a live list of
 * the user's real `light.*` entities. Otherwise the screen offers to connect,
 * with manual entity entry as a fallback.
 */
export default function HueTargetScreen() {
  const router = useRouter();

  const sunrise = useEditorStore((state) => state.draft.sunrise);
  const patchSunrise = useEditorStore((state) => state.patchSunrise);

  const config = useHAStore((state) => state.config);
  const lights = useHAStore((state) => state.lights);
  const lightsLoading = useHAStore((state) => state.lightsLoading);
  const lightsError = useHAStore((state) => state.lightsError);
  const refreshLights = useHAStore((state) => state.refreshLights);

  const connected = Boolean(config);
  const [entityText, setEntityText] = useState(sunrise.targetEntityIds.join(', '));

  // Pull a fresh light list whenever the screen opens on a connected instance.
  useEffect(() => {
    if (connected) {
      refreshLights();
    }
  }, [connected, refreshLights]);

  const selectedIds = new Set(sunrise.targetEntityIds);

  function toggleLight(entity: HAEntity) {
    const next = new Set(selectedIds);

    if (next.has(entity.entityId)) {
      next.delete(entity.entityId);
    } else {
      next.add(entity.entityId);
    }

    const ids = [...next];

    patchSunrise({ targetEntityIds: ids, targetLabel: summarizeSelection(ids, lights) });
  }

  function commitManualEntities(text: string) {
    setEntityText(text);
    patchSunrise({ targetEntityIds: parseEntityIds(text) });
  }

  return (
    <Screen scroll>
      <AppBar title="Hue lights" left={{ label: 'Done', onPress: () => router.back() }} />

      <View style={styles.content}>
        <Card>
          <Row
            label="Use Hue lights"
            onPress={() => patchSunrise({ enabled: !sunrise.enabled })}
            trailing={
              <View pointerEvents="none">
                <Switch
                  value={sunrise.enabled}
                  trackColor={{ false: theme.color.surfaceAlt, true: theme.color.accent }}
                  thumbColor={theme.color.text}
                  ios_backgroundColor={theme.color.surfaceAlt}
                />
              </View>
            }
          />
        </Card>

        {!sunrise.enabled ? (
          <AppText variant="body" tone="mute" style={styles.offHint}>
            This alarm will play sound only. Turn on Hue lights to wake the room with a sunrise.
          </AppText>
        ) : connected ? (
          <ConnectedLightPicker
            lights={lights}
            loading={lightsLoading}
            error={lightsError}
            selectedIds={selectedIds}
            onToggle={toggleLight}
            onRefresh={refreshLights}
            onManageConnection={() => router.push('/settings/home-assistant')}
          />
        ) : (
          <DisconnectedFallback
            entityText={entityText}
            onChangeEntities={commitManualEntities}
            targetLabel={sunrise.targetLabel}
            onChangeLabel={(targetLabel) =>
              patchSunrise({ targetLabel: targetLabel.trim() === '' ? 'Not set' : targetLabel })
            }
            onConnect={() => router.push('/settings/home-assistant')}
          />
        )}
      </View>
    </Screen>
  );
}

function ConnectedLightPicker({
  lights,
  loading,
  error,
  selectedIds,
  onToggle,
  onRefresh,
  onManageConnection,
}: {
  lights: HAEntity[];
  loading: boolean;
  error: string | null;
  selectedIds: Set<string>;
  onToggle: (entity: HAEntity) => void;
  onRefresh: () => void;
  onManageConnection: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <SectionLabel>Lights</SectionLabel>
        <Pressable
          onPress={onRefresh}
          hitSlop={theme.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Refresh lights"
          style={({ pressed }) => (pressed ? styles.refreshPressed : undefined)}
        >
          <RefreshCw size={16} color={theme.color.textMute} strokeWidth={2} />
        </Pressable>
      </View>

      {loading && lights.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.color.accent} />
        </View>
      ) : error ? (
        <Card>
          <View style={styles.messageRow}>
            <AppText variant="body" tone="soft">
              {error}
            </AppText>
            <Button label="Retry" variant="secondary" inline onPress={onRefresh} />
          </View>
        </Card>
      ) : lights.length === 0 ? (
        <Card>
          <View style={styles.messageRow}>
            <AppText variant="body" tone="mute">
              No lights found in Home Assistant.
            </AppText>
          </View>
        </Card>
      ) : (
        <Card>
          {lights.map((light) => (
            <Row
              key={light.entityId}
              label={light.friendlyName}
              onPress={() => onToggle(light)}
              trailing={
                selectedIds.has(light.entityId) ? (
                  <Check size={18} color={theme.color.accent} strokeWidth={2.4} />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )
              }
            />
          ))}
        </Card>
      )}

      <Button
        label="Manage connection"
        variant="ghost"
        icon={Plug}
        onPress={onManageConnection}
      />
    </View>
  );
}

function DisconnectedFallback({
  entityText,
  onChangeEntities,
  targetLabel,
  onChangeLabel,
  onConnect,
}: {
  entityText: string;
  onChangeEntities: (text: string) => void;
  targetLabel: string;
  onChangeLabel: (text: string) => void;
  onConnect: () => void;
}) {
  return (
    <>
      <Card>
        <View style={styles.connectPrompt}>
          <AppText variant="heading">Connect Home Assistant</AppText>
          <AppText variant="body" tone="soft" style={styles.connectBody}>
            Connect to pick from your real Hue lights instead of typing entity ids.
          </AppText>
          <Button label="Connect Home Assistant" icon={Plug} onPress={onConnect} />
        </View>
      </Card>

      <View style={styles.section}>
        <SectionLabel>Or enter manually</SectionLabel>
        <Card>
          <TextField
            label="Room name"
            value={targetLabel === 'Not set' ? '' : targetLabel}
            onChangeText={onChangeLabel}
            placeholder="Bedroom"
            maxLength={30}
          />
          <TextField
            label="Entity ids"
            value={entityText}
            onChangeText={onChangeEntities}
            placeholder="light.bedroom_lamp, light.bedroom_ceiling"
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />
        </Card>
      </View>
    </>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: theme.space.xs,
  },
  refreshPressed: {
    opacity: 0.5,
  },
  offHint: {
    paddingHorizontal: theme.space.xs,
    lineHeight: 20,
  },
  centered: {
    paddingVertical: theme.space.xl,
    alignItems: 'center',
  },
  messageRow: {
    padding: theme.space.lg,
    gap: theme.space.md,
    alignItems: 'flex-start',
  },
  checkPlaceholder: {
    width: 18,
    height: 18,
  },
  connectPrompt: {
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  connectBody: {
    lineHeight: 22,
  },
});
