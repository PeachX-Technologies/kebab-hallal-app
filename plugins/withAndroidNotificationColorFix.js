/**
 * Custom Expo config plugin to fix the AndroidManifest merger conflict between
 * expo-notifications and @react-native-firebase/messaging for the
 * `default_notification_color` meta-data attribute.
 *
 * Error:
 *   Attribute meta-data#com.google.firebase.messaging.default_notification_color@resource
 *   value=(@color/notification_icon_color) from AndroidManifest.xml
 *   is also present at [:react-native-firebase_messaging] AndroidManifest.xml value=(@color/white).
 *   Suggestion: add 'tools:replace="android:resource"' to <meta-data> element to override.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const withAndroidNotificationColorFix = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const application = androidManifest.manifest.application?.[0];

    if (!application) return config;

    // Ensure tools namespace is declared on the manifest element
    if (!androidManifest.manifest.$) {
      androidManifest.manifest.$ = {};
    }
    androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const metaDataArray = application['meta-data'] || [];
    const targetName = 'com.google.firebase.messaging.default_notification_color';

    const targetEntry = metaDataArray.find(
      (m) => m?.$ && m.$['android:name'] === targetName
    );

    if (targetEntry) {
      // Add tools:replace to resolve the manifest merger conflict
      targetEntry.$['tools:replace'] = 'android:resource';
    }

    return config;
  });
};

module.exports = withAndroidNotificationColorFix;
