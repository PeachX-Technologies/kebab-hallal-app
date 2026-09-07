const { withPodfile } = require('@expo/config-plugins');

/**
 * Adds RecaptchaEnterprise pod explicitly so Firebase Phone Auth
 * reCAPTCHA fallback works correctly on iOS App Store builds.
 *
 * Firebase phone auth requires RecaptchaEnterprise to be linked when
 * APNs silent push is unavailable (e.g. certain App Store environments).
 * Without this, signInWithPhoneNumber throws:
 *   "The reCAPTCHA SDK is not linked to your app"
 */
module.exports = function withRecaptcha(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    if (!contents.includes("pod 'RecaptchaEnterprise'")) {
      // Insert after the last 'use_frameworks!' or before the first 'target' block
      const lines = contents.split('\n');
      // Find the target 'KebabHallal' line to insert just before it
      const targetIndex = lines.findIndex((line) =>
        line.trim().startsWith("target '") && line.includes('do')
      );
      if (targetIndex !== -1) {
        lines.splice(
          targetIndex,
          0,
          "  pod 'RecaptchaEnterprise', :modular_headers => true"
        );
      }
      config.modResults.contents = lines.join('\n');
    }

    return config;
  });
};
