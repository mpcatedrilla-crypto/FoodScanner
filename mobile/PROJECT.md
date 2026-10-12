# Project: Food Scanner Mobile App

## Architecture
- **Framework**: React Native 0.85.3, Expo SDK ~56.0.3, Expo Router, Hermes JS, New Architecture (`newArchEnabled=true`), Android Gradle 9.3.1.
- **UI & Navigation Layer**: Expo Router (`src/app/`), Tailwind/NativeWind (`global.css`), Lucide icons, 3 bottom navigation tabs (`index` [Home], `scan` [prominent center], `help` [Tutorial/Help]).
- **ML & Offline Inference Layer**:
  - Model: Ultralytics YOLOv8n (`best.onnx`, 12.83MB, 58 Philippine food ingredient classes, input [1, 3, 640, 640] float32, output [1, 62, 8400]).
  - Camera: `react-native-vision-camera` (v5.0.10) snapshot capture loop (~300-400ms interval).
  - Runtime: On-device offline ONNX Runtime (`onnxruntime-android: 1.21.0` via Nitro ONNX or native Android module) with zero cloud network calls.
  - Post-processing: Normalization, bounding box decoding, class probability extraction, Non-Maximum Suppression (NMS).
- **Data & Matching Engine**:
  - Local dataset: `src/lib/seedData.json` (115 Filipino recipes with DOST nutritional facts, 142 ingredients).
  - Matching logic: `src/lib/actions.ts` provides `getRecipes()`, `getIngredients()`, and `findMatchingRecipes()` entirely in-memory/offline.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Home Screen Available Recipes | Rename section to "Available Recipes", retain 5 category images (Chicken, Pork, Beef, Seafood, Veggies), link to filtered `/recipes` | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Center Scan Tab Button | Configure 3 visible tabs `['index', 'scan', 'help']` with 52x52 prominent `#ea580c` Scan button at index 1 (50% horizontal center) | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Remove Save Feature | Completely eliminate bookmarks / Save feature from `RecipeCardRow.tsx`, `bookmark-context.tsx`, `_layout.tsx`, `saved.tsx`, `help.tsx`, `scan.tsx` | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Auxiliary Screens Navigation | Ensure `/help` (with `/tutorial` re-export), `/about`, and `/terms` are accessible and back navigation works without unmatched route errors | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Nutrition Facts Display | Display calories, protein, carbs, fats in `recipes.tsx` without showing cooking steps in the list | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Theme Consistency | Unify Warm & Spicy theme (`#FFF9F2` background, `#ea580c` primary) across all screens | M1 | ORIGINAL_REQUEST §R1 |
| 7 | Offline ONNX Model Bundling | Copy `backend/best.onnx` to mobile assets and configure asset bundling without compression issues | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Real-time Camera Inference | Wire `scan.tsx` camera snapshots to local ONNX runtime for offline ingredient recognition | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Offline Recipe Matching | Pass detected ingredients to local matching engine in `src/lib/actions.ts` using `seedData.json` with zero cloud calls | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Android Gradle Build & Run | Build APK with `./gradlew assembleDebug` using JDK 17, ensuring zero crash at runtime | M3 | ORIGINAL_REQUEST §AC |
| 11 | End-to-End Acceptance Verification | Verify all UI, Navigation, and Inference acceptance criteria with automated tests and audit | M3 | ORIGINAL_REQUEST §AC |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | UI Layout, Navigation & Theme | Home screen updates, centered scan button, complete removal of Save feature, route fixes, DOST nutrition display, and theme unification | none | IN_PROGRESS |
| 2 | Offline ONNX ML Integration | Asset bundling, local ONNX Runtime inference in `scan.tsx`, offline ingredient detection, and local matching engine connection | M1 | PLANNED |
| 3 | Gradle Build & E2E Acceptance | Android Gradle build compilation, APK execution verification on device, full automated test pass, and forensic audit | M1, M2 | PLANNED |

## Interface Contracts
### UI Layer (`src/app/`) ↔ Data Layer (`src/lib/actions.ts`)
- `getRecipes(category?: string): Promise<Recipe[]>`: Returns list of recipes from `seedData.json`, filtered by category keywords if provided.
- `getIngredients(): Promise<Ingredient[]>`: Returns all 142 ingredients with names, IDs, macros.
- `findMatchingRecipes(detectedNamesOrIds: string[]): Promise<{ recipe: Recipe, matchPercentage: number, missingIngredients: string[] }[]>`: Matches detected ingredients against recipe ingredients.

### Camera Screen (`src/app/scan.tsx`) ↔ Offline ML Service (`src/services/onnx-detector.ts`)
- `initModel(): Promise<boolean>`: Initializes local ONNX session from bundled `best.onnx`.
- `detectIngredientsFromFile(imageUri: string): Promise<DetectionResult[]>`:
  - Input: Local file URI from `cameraRef.takeSnapshot()`.
  - Output: Array of `{ label: string, confidence: number, box: [number, number, number, number] }`.
  - Zero network/cloud requests.

## Code Layout
- `src/app/`: Expo Router screens (`index.tsx`, `scan.tsx`, `recipes.tsx`, `recipe/[id].tsx`, `help.tsx`, `about.tsx`, `terms.tsx`, `tutorial.tsx`, `_layout.tsx`)
- `src/components/`: Reusable UI widgets (`RecipeCardRow.tsx`, etc.)
- `src/services/`: ML and detection services (`onnx-detector.ts`)
- `src/lib/`: Local data and actions (`actions.ts`, `seedData.json`)
- `src/assets/`: Images and models (`src/assets/models/best.onnx`, `src/assets/images/cat_*.png`)
- `android/`: Native Android project (`android/app/build.gradle`, `android/gradle.properties`)
- `scripts/`: Verification scripts (`verify-all.js`, etc.)
