const { withPodfile } = require('@expo/config-plugins');

module.exports = function withRNFirebaseStaticFrameworks(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;

    if (!contents.includes('$RNFirebaseAsStaticFramework')) {
      const lines = contents.split('\n');
      const index = lines.findIndex((line) => line.trim().startsWith('platform :ios'));
      if (index !== -1) {
        lines.splice(index, 0, '$RNFirebaseAsStaticFramework = true');
      }
      config.modResults.contents = lines.join('\n');
    }

    return config;
  });
};