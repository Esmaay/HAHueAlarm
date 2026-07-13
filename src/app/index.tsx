import { useRouter } from 'expo-router';
import { Plus, Settings2 } from 'lucide-react-native';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, IconButton, Screen } from '@/components/ui';
import { alarmToDraft, createAlarmDraft } from '@/features/alarms/catalog';
import { AlarmListItem } from '@/features/alarms/components/AlarmListItem';
import { useEditorStore } from '@/features/alarms/editorStore';
import { formatTime, nextEnabledAlarm, timeUntil, toClockParts } from '@/features/alarms/format';
import { useAlarmStore } from '@/features/alarms/store';
import type { Alarm } from '@/features/alarms/types';
import { theme } from '@/theme';

/** The soonest upcoming alarm, phrased for the header, or a resting message. */
function NextAlarmSummary({ alarms }: { alarms: Alarm[] }) {
  const next = nextEnabledAlarm(alarms);

  if (!next) {
    return (
      <AppText variant="body" tone="mute">
        No alarms set
      </AppText>
    );
  }

  const clock = toClockParts(next.hour, next.minute);
  const relative = timeUntil(next);

  return (
    <AppText variant="body" tone="soft">
      Next{' '}
      <AppText variant="body" tone="accent" weight="semibold" tabular>
        {formatTime(next.hour, next.minute)} {clock.period}
      </AppText>
      {relative ? ` · ${relative}` : ''}
    </AppText>
  );
}

export default function AlarmListScreen() {
  const router = useRouter();
  const alarms = useAlarmStore((state) => state.alarms);
  const toggleAlarm = useAlarmStore((state) => state.toggleAlarm);
  const getAlarm = useAlarmStore((state) => state.getAlarm);
  const beginEdit = useEditorStore((state) => state.begin);

  // Seed the editor draft here, in an event handler, then navigate — so the
  // editor screen is a pure view with no initialisation effect.
  const openEditor = useCallback(
    (id: string) => {
      const existing = id === 'new' ? undefined : getAlarm(id);

      beginEdit(existing ? alarmToDraft(existing) : createAlarmDraft(), existing ? id : null);
      router.push({ pathname: '/alarm/[id]', params: { id } });
    },
    [router, getAlarm, beginEdit],
  );

  const renderItem = useCallback(
    ({ item }: { item: Alarm }) => (
      <AlarmListItem alarm={item} onPress={openEditor} onToggle={toggleAlarm} />
    ),
    [openEditor, toggleAlarm],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText variant="display">Alarms</AppText>
          <View style={styles.headerActions}>
            <IconButton
              icon={Settings2}
              variant="ghost"
              color={theme.color.textSoft}
              onPress={() => router.push('/settings/home-assistant')}
              accessibilityLabel="Home Assistant settings"
            />
            <IconButton
              icon={Plus}
              onPress={() => openEditor('new')}
              accessibilityLabel="Add alarm"
            />
          </View>
        </View>
        <NextAlarmSummary alarms={alarms} />
      </View>

      <FlatList
        data={alarms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <AppText variant="heading" tone="soft">
        No alarms yet
      </AppText>
      <AppText variant="body" tone="mute" style={styles.emptyHint}>
        Tap + to set your first sunrise alarm.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
    gap: theme.space.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  list: {
    paddingBottom: theme.space.xxxl,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.border,
    marginHorizontal: theme.space.lg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: theme.space.xxxl,
    gap: theme.space.sm,
  },
  emptyHint: {
    textAlign: 'center',
  },
});
