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

<img width="1080" height="2400" alt="image" src="https://github.com/user-attachments/assets/79afe613-2084-4268-96cb-814d785c423c" />


### 2. Live YOLOv8 Camera Scanner
*Shows the VisionCamera drawing bounding boxes around detected ingredients.*

<img width="922" height="2048" alt="image" src="https://github.com/user-attachments/assets/2451607f-5ed9-4764-85a4-c375cb4baa81" />


### 3. Detected Ingredients & Nutritional Summary (Germane Load)
*Shows the extracted ingredients alongside the dynamic Protein/Carbs/Fat macronutrient breakdown.*

<img width="922" height="2048" alt="image" src="https://github.com/user-attachments/assets/537fa15f-3528-4cc6-9808-1e022c1e9ee0" />

<img width="922" height="2048" alt="image" src="https://github.com/user-attachments/assets/6901f653-a228-4023-9b13-ae16497c6c3b" />


### 4. Recipe Match Results
*Shows how the app ranks recipes by prioritizing distinctive ingredients and filtering out ubiquitous ones.*

![DRAG_AND_DROP_RECIPE_RESULTS_IMAGE_HERE]()

### 5. Cook Mode (Parallel Processing)
*Shows the step-by-step instructions and the interactive countdown timer that triggers local push notifications/vibrations.*

<img width="1080" height="2400" alt="image" src="https://github.com/user-attachments/assets/f72d64e6-f390-4d84-9f08-b21ac527c489" />

<img width="1080" height="2400" alt="image" src="https://github.com/user-attachments/assets/90a661b1-1c55-4ad0-8ebc-f3a3c79030fd" />

---

## Technical Stack
- **Frontend:** React Native, Expo, Expo Router, NativeWind (TailwindCSS)
- **Backend/Database:** Supabase (PostgreSQL)
- **Computer Vision:** `react-native-vision-camera` + YOLOv8 Auto-Detection
- **Native Modules:** `expo-notifications` (Background Timers), `Vibration`

## Downloading the App
You can download the compiled production Android APK directly from the [Releases Tab](https://github.com/mpcatedrilla-crypto/FoodScanner/releases).
