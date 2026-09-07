const { withPodfile } = require('@expo/config-plugins');

module.exports = function withRNFirebaseStaticFrameworks(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    const lines = contents.split('\n');
    let modified = false;

    // 1. Inject $RNFirebaseAsStaticFramework = true before platform :ios
    // Required for RNFBAuth and other Firebase pods to build as static libraries
    if (!contents.includes('$RNFirebaseAsStaticFramework')) {
      const platformIndex = lines.findIndex((line) => line.trim().startsWith('platform :ios'));
      if (platformIndex !== -1) {
        lines.splice(platformIndex, 0, '$RNFirebaseAsStaticFramework = true');
        modified = true;
      }
    }

    // 2. Inject $RNFirebaseDisableSPM = true before platform :ios
    // REQUIRED when useFrameworks: static — firebase_spm.rb explicitly states:
    // "You must disable SPM when using use_frameworks! :linkage => :static"
    // Without this, Firebase resolves via SPM in static builds causing
    // RecaptchaInterop/modular headers errors and AUTH/UNKNOWN on phone auth.
    if (!contents.includes('$RNFirebaseDisableSPM')) {
      const platformIndex = lines.findIndex((line) => line.trim().startsWith('platform :ios'));
      if (platformIndex !== -1) {
        lines.splice(platformIndex, 0, '$RNFirebaseDisableSPM = true');
        modified = true;
      }
    }

    if (modified) {
      config.modResults.contents = lines.join('\n');
    }

    return config;
  });
};
