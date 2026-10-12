# E2E Test Infra: Food Scanner Mobile App

## Test Philosophy
- Requirement-driven, opaque-box testing covering all UI, navigation, offline ML inference, and build acceptance criteria from `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition, Boundary Value Analysis, Pairwise Combinations, and Real-World Scenarios.

## Feature Inventory & Test Coverage
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Interactions) | Tier 4 (Workloads) |
|---|---------|-------------------|:-----------------:|:-----------------:|:--------------------:|:------------------:|
| F1 | Home Screen Available Recipes | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F2 | Center Scan Tab Button | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F3 | Remove Save Feature | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F4 | Auxiliary Screens Navigation | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F5 | Nutrition Facts Display | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F6 | Theme Consistency | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ | ✓ |
| F7 | Offline ONNX Model Bundling | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ | ✓ |
| F8 | Real-time Camera Inference | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ | ✓ |
| F9 | Offline Recipe Matching | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ | ✓ |
| F10 | Android Gradle Build & Run | ORIGINAL_REQUEST §AC | 5 tests | 5 tests | ✓ | ✓ |
| F11 | End-to-End Acceptance Verification | ORIGINAL_REQUEST §AC | 5 tests | 5 tests | ✓ | ✓ |

## Test Architecture
- **Primary Automated Test Runner**: `node scripts/verify-all.js`
  - Validates 44 specific UI, navigation, theme, tab positioning, and local data filtering rules.
- **Type Checking Runner**: `npx tsc --noEmit`
  - Verifies complete TypeScript compilation across all screens, components, and services with zero errors.
- **Metro Android Bundling Check**: `npx expo export --platform android --no-bytecode`
  - Ensures all assets, routes, and imports resolve cleanly for Android production bundling.
- **Gradle Build Runner**:
  - Command: `$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot"; .\gradlew assembleDebug`
  - Verifies full Android APK compilation without errors.
- **Offline ML Inference Test Script**: `node scripts/verify-onnx-offline.js`
  - Validates offline model loading, input/output tensors, inference with zero network requests, and recipe matching integration.

## Coverage Thresholds
- Tier 1 (Feature Coverage): ≥ 55 test cases
- Tier 2 (Boundary & Corner Cases): ≥ 55 test cases
- Tier 3 (Cross-Feature Combinations): Pairwise validation across navigation, offline scan, and recipe matching
- Tier 4 (Real-World Scenarios): End-to-end user journeys (launch home -> category filter -> center scan -> offline detect -> recipe match)
