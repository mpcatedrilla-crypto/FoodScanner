module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["react-native-worklets-core/plugin"],
      // Strips dynamic import(variable) calls that crash Hermes in release builds.
      // Specifically targets @supabase/realtime-js OTEL integration.
      ["./babel-plugin-strip-dynamic-import"],
    ]
  };
};
