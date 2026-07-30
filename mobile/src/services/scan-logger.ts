/**
 * Supabase scan logger.
 * Inserts a row into `ingredient_scans` every time Roboflow returns predictions.
 */
import { supabase } from '../lib/supabase';
import type { RoboflowPrediction } from './roboflow';

export type ScanLogRow = {
  detected_items: RoboflowPrediction[];
  detected_classes: string[];
  image_width: number;
  image_height: number;
  scan_source: string;
};

/**
 * Log detected ingredients to Supabase.
 * Silently no-ops if the table doesn't exist yet or there are no predictions.
 */
export async function logIngredientScan(
  predictions: RoboflowPrediction[],
  imageWidth: number,
  imageHeight: number,
): Promise<void> {
  if (!predictions.length) return;

  const row: ScanLogRow = {
    detected_items:   predictions,
    detected_classes: predictions.map(p => p.class),
    image_width:      imageWidth,
    image_height:     imageHeight,
    scan_source:      'roboflow',
  };

  const { error } = await supabase.from('ingredient_scans').insert(row);
  if (error) {
    // Log but don't crash the user experience
    console.warn('[ScanLogger] Supabase insert failed:', error.message);
  }
}
