/**
 * Config plugin for full-screen-intent alarms on Android.
 *
 * Two native tweaks Expo can't express in app.json:
 *   1. MainActivity must show over the lock screen and turn the screen on, so
 *      Notifee's full-screen intent can surface the ringing screen on a locked
 *      phone (the whole point of an alarm).
 *   2. Notifee ships its Android artifacts inside node_modules, so its local
 *      maven repo has to be on the project repository list.
 */

const { withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');

const NOTIFEE_REPO = 'maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }';

function withLockScreenActivity(config) {
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    const mainActivity = application?.activity?.find(
      (activity) => activity.$['android:name'] === '.MainActivity',
    );

    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }

    return cfg;
  });
}

function withNotifeeMavenRepo(config) {
  return withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error('withAlarmAndroid: expected a groovy android/build.gradle');
    }

    if (!cfg.modResults.contents.includes(NOTIFEE_REPO)) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        (match) => `${match}\n    ${NOTIFEE_REPO}`,
      );
    }

    return cfg;
  });
}

module.exports = (config) => withNotifeeMavenRepo(withLockScreenActivity(config));
