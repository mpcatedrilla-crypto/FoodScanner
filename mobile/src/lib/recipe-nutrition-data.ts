import type { NutrientBreakdown } from './nutrition';

/**
 * Verified Panlasang Pinoy per-serving nutritional reference values.
 * Used as primary/fallback nutrition data for recipe cards and details
 * when individual DB recipe row values are null or N/A.
 */
export const PANLASANG_PINOY_RECIPE_NUTRITION: Record<
  string,
  NutrientBreakdown & { servingGrams?: number }
> = {
  // Chicken dishes
  'chicken tinola': {
    calories: 662,
    protein: 47,
    carbs: 21,
    fats: 42,
    servingGrams: 215,
  },
  'tinolang manok': {
    calories: 662,
    protein: 47,
    carbs: 21,
    fats: 42,
    servingGrams: 215,
  },
  'chicken afritada': {
    calories: 460,
    protein: 38,
    carbs: 22,
    fats: 24,
    servingGrams: 310,
  },
  'chicken adobo': {
    calories: 661,
    protein: 46,
    carbs: 7,
    fats: 49,
    servingGrams: 260,
  },
  'adobong manok': {
    calories: 661,
    protein: 46,
    carbs: 7,
    fats: 49,
    servingGrams: 260,
  },

  // Pork dishes
  'pork menudo': {
    calories: 510,
    protein: 44,
    carbs: 32,
    fats: 22,
    servingGrams: 310,
  },
  'menudo': {
    calories: 510,
    protein: 44,
    carbs: 32,
    fats: 22,
    servingGrams: 310,
  },
  'pork sinigang': {
    calories: 799,
    protein: 34,
    carbs: 10,
    fats: 68,
    servingGrams: 295,
  },
  'sinigang na baboy': {
    calories: 799,
    protein: 34,
    carbs: 10,
    fats: 68,
    servingGrams: 295,
  },

  // Beef dishes
  'beef caldereta': {
    calories: 589,
    protein: 30,
    carbs: 20,
    fats: 42,
    servingGrams: 310,
  },
  'caldereta': {
    calories: 589,
    protein: 30,
    carbs: 20,
    fats: 42,
    servingGrams: 310,
  },
  'kaldereta': {
    calories: 589,
    protein: 30,
    carbs: 20,
    fats: 42,
    servingGrams: 310,
  },
  'beef nilaga': {
    calories: 275,
    protein: 35,
    carbs: 10,
    fats: 10,
    servingGrams: 270,
  },
  'nilagang baka': {
    calories: 275,
    protein: 35,
    carbs: 10,
    fats: 10,
    servingGrams: 270,
  },

  // Seafood / Fish dishes
  'escabecheng tilapia': {
    calories: 745,
    protein: 47,
    carbs: 23,
    fats: 53,
    servingGrams: 215,
  },
  'escabeche': {
    calories: 745,
    protein: 47,
    carbs: 23,
    fats: 53,
    servingGrams: 215,
  },
  'sinanglay na isda': {
    calories: 340,
    protein: 28,
    carbs: 8,
    fats: 22,
    servingGrams: 235,
  },
  'sinanglay na tilapia': {
    calories: 340,
    protein: 28,
    carbs: 8,
    fats: 22,
    servingGrams: 235,
  },

  // Egg & Vegetable dishes
  'tortang talong': {
    calories: 220,
    protein: 11,
    carbs: 9,
    fats: 16,
    servingGrams: 140,
  },
  'sarciadong itlog': {
    calories: 143,
    protein: 9,
    carbs: 13,
    fats: 8,
    servingGrams: 140,
  },
  'sarciado': {
    calories: 143,
    protein: 9,
    carbs: 13,
    fats: 8,
    servingGrams: 140,
  },
  'ginisang monggo': {
    calories: 320,
    protein: 18,
    carbs: 38,
    fats: 11,
    servingGrams: 220,
  },
  'pinakbet': {
    calories: 210,
    protein: 9,
    carbs: 16,
    fats: 12,
    servingGrams: 200,
  },
};

function normalizeName(str?: string | null): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

/**
 * Returns Panlasang Pinoy nutritional values for recipe by name.
 */
export function getPanlasangPinoyNutrition(recipeName?: string | null): (NutrientBreakdown & { servingGrams?: number }) | null {
  const norm = normalizeName(recipeName);
  if (!norm) return null;

  if (PANLASANG_PINOY_RECIPE_NUTRITION[norm]) {
    return PANLASANG_PINOY_RECIPE_NUTRITION[norm];
  }

  for (const [key, val] of Object.entries(PANLASANG_PINOY_RECIPE_NUTRITION)) {
    if (norm.includes(key) || key.includes(norm)) {
      return val;
    }
  }

  return null;
}
