# Original User Request

## Initial Request — 2026-09-25T18:36:29Z

# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Small, focused team

This is a single self-contained UI fix; keep it small and focused. Fix the UI layout and design of a React Native Expo app (food scanner) to match new requirements, including centering the scan button, updating categories, and unifying the theme. Apply the simplest, laziest, most minimal code changes necessary.

Working directory: C:\projects\food-scanner\mobile
Integrity mode: development

## Requirements

### R1. Update Home Screen Layout
- Rename "Browse by Category" to "Recipes Available".
- The category buttons (e.g., Chicken, Pork) must navigate to the recipes list, filtering the database to show recipes available for that category.
- The recipe list should display the nutritional facts (based on the DOST reference) and no longer show cooking steps directly in the list.
- Make sure the category images currently used are retained.
- Remove the "Recommended for You" section entirely.

### R2. Tab Bar and Scan Button
- The "Scan" button in the bottom tab bar must be large, prominent, and perfectly centered.
- Remove any unnecessary buttons/tabs that have no mapping or function.

### R3. Theme and Alignment Consistency
- Unify the theme across all pages (Warm & Spicy theme: `#FFF9F2` background, `#ea580c` primary).
- Ensure all text and logos are aligned properly.
- Ensure all text is clearly visible against the theme backgrounds.

## Acceptance Criteria

### UI and Styling
- [ ] Visual inspection confirms the Scan button is visibly larger than other tabs and vertically/horizontally centered in the tab bar.
- [ ] Visual inspection confirms "Recommended for You" is missing from the Home screen.
- [ ] Code inspection confirms `recipes.tsx` displays calories, protein, carbs, and fats.
- [ ] Code inspection confirms the background color `#FFF9F2` and primary color `#ea580c` are consistently used across `index.tsx`, `scan.tsx`, `recipes.tsx`, `help.tsx`, `about.tsx`, and `terms.tsx`.

### Functionality
- [ ] Clicking a category button successfully passes the category name as a filter to the `recipes.tsx` route, and the database query correctly filters by that category.

## Follow-up — 2026-09-26T10:17:36Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Fix the React Native navigation/UI layout, and implement the offline real-time ONNX ML ingredient recognizer using the camera.

Working directory: C:\projects\food-scanner\mobile
Integrity mode: development

## Requirements

### R1. UI Layout and Navigation Updates
- Rename the "Browse Categories" section on the home screen to "Available Recipes".
- Position the "Scan" button in the center of the bottom tab navigation.
- Completely remove the "Save" (or bookmarks) feature and its corresponding tab/button.
- Ensure the "Tutorial", "About Us", and "Terms of Service" screens are accessible and functional.

### R2. Offline ONNX ML Integration
- Wire up the `scan.tsx` camera to run inference using the local `best.onnx` model (located in the backend folder or copied to assets) in real-time.
- The recognizer must identify ingredients offline directly on the Android device without any cloud/network requests.

## Acceptance Criteria

### UI Checks
- [ ] The home screen displays "Available Recipes" instead of "Browse Categories".
- [ ] The bottom tab bar has the "Scan" button explicitly in the center position.
- [ ] The "Save" tab is completely removed from the UI.
- [ ] Navigating to Tutorial, About Us, and Terms of Service works without unmatched route errors.

### Inference Checks
- [ ] The `scan.tsx` screen successfully loads the ONNX model and processes camera frames.
- [ ] Ingredients are detected and passed to the local matching engine.
- [ ] The Gradle build succeeds and the app runs on Android without crashing.
