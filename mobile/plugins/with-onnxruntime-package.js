const { withDangerousMod, withMainApplication, withSettingsGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = (config) => {
  config = withDangerousMod(config, ['android', async (config) => {
    const gradleFile = path.join(
      config.modRequest.projectRoot,
      'node_modules/onnxruntime-react-native/android/build.gradle'
    );
    let contents = await fs.promises.readFile(gradleFile, 'utf8');
    contents = contents
      .replace("    classpath 'com.android.tools.build:gradle:7.4.2'\n", '')
      .replace(
        'VersionNumber.parse(REACT_NATIVE_VERSION) < VersionNumber.parse("0.71")',
        'REACT_NATIVE_MINOR_VERSION < 71'
      );
    await fs.promises.writeFile(gradleFile, contents);
    return config;
  }]);

  config = withSettingsGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes("include ':onnxruntime-react-native'")) {
      config.modResults.contents = contents.replace(
        "include ':app'",
        "include ':app'\ninclude ':onnxruntime-react-native'\nproject(':onnxruntime-react-native').projectDir = new File(rootProject.projectDir, '../node_modules/onnxruntime-react-native/android')"
      );
    }
    return config;
  });

  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes('import ai.onnxruntime.reactnative.OnnxruntimePackage')) {
      contents = contents.replace(
        'import android.content.res.Configuration',
        'import android.content.res.Configuration\nimport ai.onnxruntime.reactnative.OnnxruntimePackage'
      );
    }
    if (!contents.includes('add(OnnxruntimePackage())')) {
      contents = contents.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n          add(OnnxruntimePackage())'
      );
    }
    config.modResults.contents = contents;
    return config;
  });
};
