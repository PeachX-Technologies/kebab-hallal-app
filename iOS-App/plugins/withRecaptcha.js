const { withPodfile } = require('@expo/config-plugins');

/**
 * Sets DEFINES_MODULE = YES on RecaptchaInterop so FirebaseAuth (Swift)
 * can import it as a module when building as static libraries.
 *
 * Without this, signInWithPhoneNumber throws:
 *   "The reCAPTCHA SDK is not linked to your app"
 *
 * Strategy:
 * - If a post_install block already exists in the Podfile, inject our
 *   logic inside it (CocoaPods only allows one post_install block)
 * - If no post_install block exists, add one before the first target block
 */
module.exports = function withRecaptcha(config) {
  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;

    // Already patched — skip
    if (contents.includes('withRecaptcha')) {
      return config;
    }

    const recaptchaSnippet = `
  # withRecaptcha: enable module map for RecaptchaInterop so FirebaseAuth can import it
  installer.pods_project.targets.each do |target|
    if target.name == 'RecaptchaInterop'
      target.build_configurations.each do |config|
        config.build_settings['DEFINES_MODULE'] = 'YES'
      end
    end
  end`;

    if (contents.includes('post_install do |installer|')) {
      // Inject inside the existing post_install block, right after the opening line
      contents = contents.replace(
        'post_install do |installer|',
        `post_install do |installer|\n${recaptchaSnippet}`
      );
    } else {
      // No existing post_install — add a new one before the first target block
      const newBlock = `
post_install do |installer|
${recaptchaSnippet}
end
`;
      const lines = contents.split('\n');
      const targetIndex = lines.findIndex(
        (line) => line.trim().startsWith("target '") && line.includes('do')
      );
      if (targetIndex !== -1) {
        lines.splice(targetIndex, 0, newBlock);
      } else {
        lines.push(newBlock);
      }
      contents = lines.join('\n');
    }

    config.modResults.contents = contents;
    return config;
  });
};
