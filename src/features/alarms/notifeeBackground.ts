/**
 * Notifee background event handler.
 *
 * Registered at module load (imported from the root layout) because Notifee
 * requires a background handler whenever trigger/background delivery is used.
 * The full-screen ring UI handles dismiss/snooze, so there's nothing to do here
 * yet — this is where notification action buttons would be handled later.
 */

import notifee from '@notifee/react-native';

notifee.onBackgroundEvent(async () => {
  // Intentionally empty — interaction happens on the full-screen ring screen.
});
