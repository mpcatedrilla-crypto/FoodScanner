/**
 * Offline scan logger stub.
 * Cloud Supabase logging is disabled for pure offline functionality.
 */
import type { RoboflowPrediction } from './roboflow';

export type ScanLogRow = {
  detected_items: RoboflowPrediction[];
  detected_classes: string[];
  image_width: number;
  image_height: number;
  scan_source: string;
};

export async function logIngredientScan(
  predictions: RoboflowPrediction[],
  imageWidth: number,
  imageHeight: number,
): Promise<void> {
  // Offline mode: no-op without cloud calls
}
