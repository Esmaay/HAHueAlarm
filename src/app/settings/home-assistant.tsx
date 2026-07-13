import { useRouter } from 'expo-router';
import { CheckCircle2, Trash2, TriangleAlert } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppBar, AppText, Button, Card, Screen, SectionLabel, TextField } from '@/components/ui';
import { testConnection } from '@/features/homeassistant/client';
import { useHAStore } from '@/features/homeassistant/store';
import type { TestResult } from '@/features/homeassistant/types';
import { theme } from '@/theme';

/** Banner reflecting the outcome of a connection attempt. */
function ResultBanner({ result, lightCount }: { result: TestResult; lightCount: number }) {
  const ok = result.ok;

  return (
    <View style={[styles.banner, ok ? styles.bannerOk : styles.bannerError]}>
      {ok ? (
        <CheckCircle2 size={18} color={theme.color.success} strokeWidth={2} />
      ) : (
        <TriangleAlert size={18} color={theme.color.danger} strokeWidth={2} />
      )}
      <AppText variant="body" tone={ok ? 'default' : 'default'} style={styles.bannerText}>
        {ok ? `Connected — found ${lightCount} light${lightCount === 1 ? '' : 's'}.` : result.error}
      </AppText>
    </View>
  );
}

/**
 * Home Assistant connection setup. Credentials are entered here and stored in
 * the device keychain; nothing is committed to the repo.
 */
export default function HomeAssistantSetupScreen() {
  const router = useRouter();

  const config = useHAStore((state) => state.config);
  const lights = useHAStore((state) => state.lights);
  const saveConfig = useHAStore((state) => state.saveConfig);
  const clearConfig = useHAStore((state) => state.clearConfig);

  const [baseUrl, setBaseUrl] = useState(config?.baseUrl ?? '');
  const [token, setToken] = useState(config?.token ?? '');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const canSubmit = baseUrl.trim().length > 0 && token.trim().length > 0 && !testing;

  async function handleConnect() {
    setTesting(true);
    setResult(null);

    const candidate = { baseUrl, token };
    const outcome = await testConnection(candidate);

    if (outcome.ok) {
      await saveConfig(candidate);
    }

    setResult(outcome);
    setTesting(false);
  }

  function handleDisconnect() {
    clearConfig();
    setBaseUrl('');
    setToken('');
    setResult(null);
  }

  return (
    <Screen scroll>
      <AppBar title="Home Assistant" left={{ label: 'Done', onPress: () => router.back() }} />

      <View style={styles.content}>
        <AppText variant="body" tone="soft" style={styles.intro}>
          Connect your Home Assistant so alarms can drive your Hue lights. Credentials are stored
          only on this device, in the secure keychain.
        </AppText>

        <View style={styles.section}>
          <SectionLabel>Connection</SectionLabel>
          <Card>
            <TextField
              label="Base URL"
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder="http://homeassistant.local:8123"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              inputMode="url"
            />
            <TextField
              label="Long-lived access token"
              value={token}
              onChangeText={setToken}
              placeholder="Paste token"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
          </Card>
          <AppText variant="caption" tone="mute" style={styles.hint}>
            In Home Assistant: Profile → Security → Long-lived access tokens → Create Token.
          </AppText>
        </View>

        {result ? <ResultBanner result={result} lightCount={lights.length} /> : null}

        <Button
          label={testing ? 'Connecting…' : config ? 'Update connection' : 'Test & connect'}
          onPress={handleConnect}
          disabled={!canSubmit}
        />

        {testing ? <ActivityIndicator color={theme.color.accent} /> : null}

        {config ? (
          <Button
            label="Disconnect"
            variant="ghost"
            icon={Trash2}
            onPress={handleDisconnect}
            style={styles.disconnect}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.sm,
    gap: theme.space.lg,
  },
  intro: {
    lineHeight: 22,
  },
  section: {
    gap: theme.space.sm,
  },
  hint: {
    paddingHorizontal: theme.space.xs,
    lineHeight: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  bannerOk: {
    backgroundColor: 'rgba(110, 207, 154, 0.12)',
    borderColor: 'rgba(110, 207, 154, 0.4)',
  },
  bannerError: {
    backgroundColor: 'rgba(255, 106, 77, 0.12)',
    borderColor: 'rgba(255, 106, 77, 0.4)',
  },
  bannerText: {
    flex: 1,
  },
  disconnect: {
    marginTop: -theme.space.sm,
  },
});
