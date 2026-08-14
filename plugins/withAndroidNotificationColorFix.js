const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin to fix the AndroidManifest merger conflict between
 * expo-notifications and @react-native-firebase/messaging.
 *
 * It ensures that the 'default_notification_color' and 'default_notification_icon'
 * meta-data tags in the main AndroidManifest.xml have the 'tools:replace' attribute
 * to correctly override values provided by library manifests.
 */
const withAndroidNotificationColorFix = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const manifest = androidManifest.manifest;
    const application = manifest.application?.[0];

    if (!application) return config;

    // 1. Ensure tools namespace is declared on the manifest element
    if (!manifest.$) {
      manifest.$ = {};
    }
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // 2. Define the target meta-data names that often conflict
    const targets = [
      'com.google.firebase.messaging.default_notification_color',
      'com.google.firebase.messaging.default_notification_icon',
      'expo.modules.notifications.default_notification_color',
      'expo.modules.notifications.default_notification_icon'
    ];

    if (!application['meta-data']) {
      application['meta-data'] = [];
    }

    const metaDataArray = application['meta-data'];

    targets.forEach(targetName => {
      // Find all existing entries with this name
      const matchingIndices = [];
      for (let i = 0; i < metaDataArray.length; i++) {
        if (metaDataArray[i]?.$?.['android:name'] === targetName) {
          matchingIndices.push(i);
        }
      }

      if (matchingIndices.length > 0) {
        // Keep only the first one and add tools:replace
        const targetEntry = metaDataArray[matchingIndices[0]];
        if (!targetEntry.$) targetEntry.$ = {};

        // Add tools:replace="android:resource" or "android:value" depending on what's present
        // To be safe, we replace both if we can, but usually it's resource for these.
        targetEntry.$['tools:replace'] = 'android:resource';

        // If it uses value instead of resource, we might need to replace that too
        if (targetEntry.$['android:value']) {
          targetEntry.$['tools:replace'] = 'android:value';
        }
        // If it has both (unlikely but possible), replace both
        if (targetEntry.$['android:resource'] && targetEntry.$['android:value']) {
          targetEntry.$['tools:replace'] = 'android:resource,android:value';
        }

        // Remove duplicates to avoid confusion in the main manifest
        for (let i = matchingIndices.length - 1; i > 0; i--) {
          metaDataArray.splice(matchingIndices[i], 1);
        }
      }
    });

    return config;
  });
};

module.exports = withAndroidNotificationColorFix;
