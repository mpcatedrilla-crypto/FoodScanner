# PALAYOK Android App

PALAYOK is the Android ingredient-scanning app. Its React Native/Expo source is in `src/`; the current ONNX model and SQLite database are in `assets/`.

For the defense file map and speaking script, open [`../DEFENSE_HANDOUT.md`](../DEFENSE_HANDOUT.md).

To restore dependencies and build: run `npm ci`, `npx expo prebuild --platform android`, then `cd android` and `./gradlew assembleRelease` (Windows: `gradlew.bat assembleRelease`).
