import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppBar, Card, Row, Screen } from '@/components/ui';
import { SOUND_OPTIONS } from '@/features/alarms/catalog';
import { useEditorStore } from '@/features/alarms/editorStore';
import { theme } from '@/theme';

/** Sound picker. Selecting a tone commits to the draft and returns. */
export default function SoundPickerScreen() {
  const router = useRouter();
  const soundId = useEditorStore((state) => state.draft.soundId);
  const patch = useEditorStore((state) => state.patch);

  function select(id: string) {
    patch({ soundId: id });
    router.back();
  }

  return (
    <Screen>
      <AppBar title="Sound" left={{ label: 'Done', onPress: () => router.back() }} />

      <View style={styles.content}>
        <Card>
          {SOUND_OPTIONS.map((option) => (
            <Row
              key={option.id}
              label={option.label}
              onPress={() => select(option.id)}
              trailing={
                option.id === soundId ? (
                  <Check size={18} color={theme.color.accent} strokeWidth={2.4} />
                ) : (
                  <View />
                )
              }
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
  },
});
