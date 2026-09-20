/**
 * Roboflow Inference API service.
 * Sends a base64-encoded image to the Roboflow Cloud and returns predictions.
 *
 * Replace the placeholder constants with your actual Roboflow project details:
 *   - ROBOFLOW_API_KEY  → your private API key
 *   - ROBOFLOW_MODEL    → workspace/project slug  (e.g. "my-workspace/food-detection")
 *   - ROBOFLOW_VERSION  → dataset version number  (e.g. "1")
 *
 * Roboflow Inference Docs: https://docs.roboflow.com/deploy/hosted-api
 */

// ─── Configuration ───────────────────────────────────────────────────────────
// We are now pointing to the permanent public ngrok URL!
export const CUSTOM_API_URL = 'https://catlike-calzone-isotope.ngrok-free.dev/predict'; 

const CONFIDENCE = 40;   // minimum confidence % (0–100)
const OVERLAP    = 30;   // max bounding-box overlap % for NMS

// ─── Types ────────────────────────────────────────────────────────────────────
export type RoboflowPrediction = {
  /** Center X of the bounding box in original image pixels */
  x: number;
  /** Center Y of the bounding box in original image pixels */
  y: number;
  /** Width of the bounding box in original image pixels */
  width: number;
  /** Height of the bounding box in original image pixels */
  height: number;
  /** Class label, e.g. "egg", "tomato" */
  class: string;
  class_id: number;
  /** Confidence score between 0 and 1 */
  confidence: number;
  detection_id: string;
};

export type RoboflowResponse = {
  predictions: RoboflowPrediction[];
  /** Dimensions of the image that was actually processed by Roboflow */
  image: { width: number; height: number };
  /** Server-side inference time in seconds */
  time: number;
};

// ─── API call ─────────────────────────────────────────────────────────────────
/**
 * Send a base64-encoded JPEG/PNG to Roboflow and receive object detections.
 *
 * @param base64Image  Raw base64 string (no data-URI prefix)
 * @returns            Parsed Roboflow JSON response
 */
export async function detectIngredients(base64Image: string): Promise<RoboflowResponse> {
  const response = await fetch(CUSTOM_API_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true' // Required to bypass free ngrok warning page for API calls
    },
    body: JSON.stringify({
      base64_image: base64Image
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Custom API error: ${response.status} ${text}`);
  }

  const rawData = await response.json();
  
  // Normalize any chicken part (chicken-breast, chicken-thigh, etc.) → "chicken"
  const predictions = (rawData.predictions || []).map((p: RoboflowPrediction) => ({
    ...p,
    class: p.class.toLowerCase().startsWith('chicken') ? 'chicken' : p.class,
  }));

  return {
    predictions,
    image: rawData.image || { width: 640, height: 640 },
    time: rawData.time || 0.1,
  };
}
