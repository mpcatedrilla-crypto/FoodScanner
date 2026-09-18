# Food Scanner App (AR & YOLOv8)

Food Scanner is a mobile application built with React Native (Expo) and Supabase. It uses a YOLOv8 object detection model via the device camera to automatically recognize ingredients and map them to dynamic, personalized recipes.

## Core Features & Theoretical Alignment

This system is designed around three core theoretical frameworks:
1. **Technology Acceptance Model (TAM)**: Clean, dark UI with large category buttons and minimal clutter (High Perceived Ease of Use).
2. **Information Processing Theory Parallelism**: Allows users to cook physically, read visual steps, and track cooking time via haptic/push notifications simultaneously without context switching.
3. **Cognitive Load Theory Framework**: Reduces extraneous load via camera auto-detection (bypassing manual typing) and prioritizes distinctive ingredients over ubiquitous bases (Garlic, Onion) to prevent decision fatigue.

---

## System Screenshots

> **Note:** To add images, simply click the pencil icon to edit this file on GitHub, and drag-and-drop your screenshots directly into the editor over the placeholder text. GitHub will automatically upload them and generate the correct image links.

### 1. Home Screen (Category Selection)
*Shows the clean UI and distinctive categories.*

![DRAG_AND_DROP_HOME_SCREEN_IMAGE_HERE]()

### 2. Live YOLOv8 Camera Scanner
*Shows the VisionCamera drawing bounding boxes around detected ingredients.*

![DRAG_AND_DROP_CAMERA_SCANNER_IMAGE_HERE]()

### 3. Detected Ingredients & Nutritional Summary (Germane Load)
*Shows the extracted ingredients alongside the dynamic Protein/Carbs/Fat macronutrient breakdown.*

![DRAG_AND_DROP_NUTRITION_SUMMARY_IMAGE_HERE]()

### 4. Recipe Match Results
*Shows how the app ranks recipes by prioritizing distinctive ingredients and filtering out ubiquitous ones.*

![DRAG_AND_DROP_RECIPE_RESULTS_IMAGE_HERE]()

### 5. Cook Mode (Parallel Processing)
*Shows the step-by-step instructions and the interactive countdown timer that triggers local push notifications/vibrations.*

![DRAG_AND_DROP_COOK_MODE_TIMER_IMAGE_HERE]()

---

## Technical Stack
- **Frontend:** React Native, Expo, Expo Router, NativeWind (TailwindCSS)
- **Backend/Database:** Supabase (PostgreSQL)
- **Computer Vision:** `react-native-vision-camera` + YOLOv8 Auto-Detection
- **Native Modules:** `expo-notifications` (Background Timers), `Vibration`

## Downloading the App
You can download the compiled production Android APK directly from the [Releases Tab](https://github.com/mpcatedrilla-crypto/FoodScanner/releases).
