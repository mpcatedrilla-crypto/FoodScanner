const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('tflite', 'onnx');

// Shim out OpenTelemetry packages — they use dynamic import(variable) which
// Hermes rejects in release/production bundles. Supabase pulls these in
// transitively but the app doesn't use tracing/telemetry features.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.startsWith('@opentelemetry/') ||
    moduleName === '@opentelemetry'
  ) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
