import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AlarmRuntime } from '@/features/alarms/AlarmRuntime';
import '@/features/alarms/notifeeBackground';
import { theme } from '@/theme';

/**
 * Root navigator. Headers are hidden app-wide because every screen renders its
 * own <AppBar>, which gives us exact control over the Cancel/Save affordances
 * the design calls for.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AlarmRuntime />

        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.color.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="alarm/[id]" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="ring"
            options={{ animation: 'fade', gestureEnabled: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
