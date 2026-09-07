const { withPodfile } = require('@expo/config-plugins');

/**
 * Sets DEFINES_MODULE = YES on RecaptchaInterop via a pre_install hook.
 *
 * Why this approach:
 * - forceStaticLinking gets overridden by Expo's own module system
 * - Adding a duplicate pod declaration causes conflicts
 * - pre_install runs after pod resolution but before compilation,
 *   giving us direct access to the build settings of every pod target
 *
 * Without this, FirebaseAuth (a Swift pod) cannot import RecaptchaInterop
 * because it has no module map, causing:
 *   "The reCAPTCHA SDK is not linked to your app"
 */
module.exports = function withRecaptcha(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    // Already patched — skip
    if (contents.includes('withRecaptcha')) {
      return config;
    }

    const hook = `
# withRecaptcha: enable module maps for RecaptchaInterop so FirebaseAuth can import it
pre_install do |installer|
  installer.pod_targets.each do |pod|
    if pod.name == 'RecaptchaInterop'
      pod.pod_target_xcconfig['DEFINES_MODULE'] = 'YES'
      pod.pod_target_xcconfig['SWIFT_INCLUDE_PATHS'] = '$(PODS_ROOT)/Headers/Public/RecaptchaInterop'
    end
  end
end
`;

    const lines = contents.split('\n');

    // Insert just before the first target block
    const targetIndex = lines.findIndex(
      (line) => line.trim().startsWith("target '") && line.includes('do')
    );

    if (targetIndex !== -1) {
      lines.splice(targetIndex, 0, hook);
    } else {
      lines.push(hook);
    }

    config.modResults.contents = lines.join('\n');
    return config;
  });
};
