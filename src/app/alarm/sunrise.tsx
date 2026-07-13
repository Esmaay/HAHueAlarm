import { useRouter } from 'expo-router';
import { Lightbulb } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  AppBar,
  AppText,
  Card,
  Row,
  Screen,
  SectionLabel,
  SegmentedControl,
  type SegmentOption,
} from '@/components/ui';
import { SunrisePreview } from '@/features/alarms/components/SunrisePreview';
import {
  POST_DISMISS_OPTIONS,
  SUNRISE_DURATION_OPTIONS,
  SUNRISE_STYLES,
  sunriseStyleOption,
} from '@/features/alarms/catalog';
import { useEditorStore } from '@/features/alarms/editorStore';
import type { PostDismissAction, SunriseDuration, SunriseStyle } from '@/features/alarms/types';
import { theme } from '@/theme';

const DURATION_OPTIONS: readonly SegmentOption<SunriseDuration>[] = SUNRISE_DURATION_OPTIONS.map(
  (minutes) => ({ value: minutes, label: `${minutes} min` }),
);

const STYLE_OPTIONS: readonly SegmentOption<SunriseStyle>[] = SUNRISE_STYLES.map((style) => ({
  value: style.id,
  label: style.label,
}));

const POST_DISMISS_SEGMENTS: readonly SegmentOption<PostDismissAction>[] = POST_DISMISS_OPTIONS.map(
  (option) => ({ value: option.id, label: option.label }),
);

/** Sunrise ramp settings. Only meaningful when Hue lights are enabled. */
export default function SunriseScreen() {
  const router = useRouter();
  const sunrise = useEditorStore((state) => state.draft.sunrise);
  const patchSunrise = useEditorStore((state) => state.patchSunrise);

  return (
    <Screen scroll>
      <AppBar title="Sunrise" left={{ label: 'Done', onPress: () => router.back() }} />

      {sunrise.enabled ? (
        <View style={styles.content}>
          <SunrisePreview style={sunrise.style} />

          <View style={styles.section}>
            <SectionLabel>Ramp duration (before alarm)</SectionLabel>
            <SegmentedControl
              options={DURATION_OPTIONS}
              value={sunrise.durationMin}
              onChange={(durationMin) => patchSunrise({ durationMin })}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>Light style</SectionLabel>
            <SegmentedControl
              options={STYLE_OPTIONS}
              value={sunrise.style}
              onChange={(style) => patchSunrise({ style })}
            />
            <AppText variant="caption" tone="mute" style={styles.hint}>
              {sunriseStyleOption(sunrise.style).description}
            </AppText>
          </View>

          <View style={styles.section}>
            <SectionLabel>After dismiss</SectionLabel>
            <SegmentedControl
              options={POST_DISMISS_SEGMENTS}
              value={sunrise.postDismiss}
              onChange={(postDismiss) => patchSunrise({ postDismiss })}
            />
          </View>

          <View style={styles.section}>
            <SectionLabel>Target</SectionLabel>
            <Card>
              <Row
                icon={Lightbulb}
                label="Hue lights"
                value={sunrise.targetLabel}
                onPress={() => router.push('/alarm/hue')}
              />
            </Card>
          </View>
        </View>
      ) : (
        <View style={styles.offState}>
          <AppText variant="heading" tone="soft">
            Hue lights are off
          </AppText>
          <AppText variant="body" tone="mute" style={styles.offHint}>
            Turn on Hue lights for this alarm to set up a sunrise.
          </AppText>
          <Card style={styles.offCard}>
            <Row label="Hue lights" onPress={() => router.push('/alarm/hue')} icon={Lightbulb} />
          </Card>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    gap: theme.space.xl,
  },
  section: {
    gap: theme.space.sm,
  },
  hint: {
    paddingHorizontal: theme.space.xs,
    lineHeight: 18,
  },
  offState: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.xxl,
    gap: theme.space.md,
    alignItems: 'center',
  },
  offHint: {
    textAlign: 'center',
  },
  offCard: {
    alignSelf: 'stretch',
    marginTop: theme.space.sm,
  },
});
