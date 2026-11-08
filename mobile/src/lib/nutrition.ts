/**
 * Nutritional Calculation Engine
 * Purpose: Computes calories, carbs, protein, and fat based on DOST-FNRI references with Panlasang Pinoy fallbacks.
 */
import type { Ingredient, RecipeWithIngredients } from './types';
import { getPanlasangPinoyNutrition } from './recipe-nutrition-data';

/**
 * Standardized household serving weights (in grams) for the 15 supported
 * ingredients, aligned with FNRI-DOST edible portion reference servings.
 */
export const INGREDIENT_SERVING_GRAMS: Record<string, number> = {
  beef: 100,
  chicken: 100,
  pork: 100,
  tilapia: 100,
  egg: 60,
  eggplant: 80,
  sayote: 70,
  potato: 60,
  tomato: 45,
  water_spinach: 45,
  'water spinach': 45,
  carrot: 40,
  bell_pepper: 30,
  'bell pepper': 30,
  onion: 25,
  garlic: 10,
  ginger: 10,
};

export const SCANNED_SERVING_GRAMS = 100;

/**
 * Fallback serving weights (in grams) per recipe in case a recipe is loaded
 * without its joined `recipe_ingredients` rows.
 */
export const RECIPE_SERVING_GRAMS: Record<string, number> = {
  'pork menudo': 310,
  'chicken afritada': 310,
  'beef caldereta': 310,
  'pork sinigang': 295,
  'beef nilaga': 270,
  'sinanglay na isda': 235,
  'chicken tinola': 215,
  'escabecheng tilapia': 215,
  'tortang talong': 140,
  'sarciadong itlog': 140,
};

export interface NutrientBreakdown {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface DualNutritionResult {
  servingGrams: number;
  perServing: NutrientBreakdown;
  per100g: NutrientBreakdown;
}

export interface ScannedNutritionSummary extends DualNutritionResult {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function normalizeKey(str?: string | null): string {
  return str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
}

export function getIngredientServingGrams(
  ing?: { name?: string | null; coco_class?: string | null } | null,
  explicitAmount?: string | number | null
): number {
  if (explicitAmount !== undefined && explicitAmount !== null && explicitAmount !== '') {
    const parsed = typeof explicitAmount === 'number' ? explicitAmount : parseFloat(String(explicitAmount));
    if (!Number.isNaN(parsed) && parsed > 0) {
      return Math.round(parsed);
    }
  }

  if (ing) {
    const cocoKey = normalizeKey(ing.coco_class);
    if (cocoKey && INGREDIENT_SERVING_GRAMS[cocoKey] != null) {
      return INGREDIENT_SERVING_GRAMS[cocoKey];
    }
    const nameKey = normalizeKey(ing.name);
    if (nameKey && INGREDIENT_SERVING_GRAMS[nameKey] != null) {
      return INGREDIENT_SERVING_GRAMS[nameKey];
    }
  }

  return 100;
}

export function getIngredientNutrition(
  ing: Pick<
    Ingredient,
    'name' | 'coco_class' | 'calories_per_100g' | 'protein_per_100g' | 'carbs_per_100g' | 'fats_per_100g'
  >,
  explicitAmount?: string | number | null
): DualNutritionResult {
  const servingGrams = getIngredientServingGrams(ing, explicitAmount);
  const factor = servingGrams / 100;

  const cal100 = ing.calories_per_100g ?? 0;
  const prot100 = ing.protein_per_100g ?? 0;
  const carb100 = ing.carbs_per_100g ?? 0;
  const fat100 = ing.fats_per_100g ?? 0;

  return {
    servingGrams,
    perServing: {
      calories: Math.round(cal100 * factor),
      protein: round1(prot100 * factor),
      carbs: round1(carb100 * factor),
      fats: round1(fat100 * factor),
    },
    per100g: {
      calories: Math.round(cal100),
      protein: round1(prot100),
      carbs: round1(carb100),
      fats: round1(fat100),
    },
  };
}

export function getScannedIngredientsNutritionSummary(
  ingredients: Ingredient[]
): ScannedNutritionSummary {
  let totalServingGrams = 0;
  let rawCal = 0;
  let rawProtein = 0;
  let rawCarbs = 0;
  let rawFat = 0;

  for (const ing of ingredients) {
    // Scanned ingredients use the DOST-FNRI 100 g standard serving.
    const g = SCANNED_SERVING_GRAMS;
    const factor = g / 100;
    totalServingGrams += g;
    rawCal += (ing.calories_per_100g ?? 0) * factor;
    rawProtein += (ing.protein_per_100g ?? 0) * factor;
    rawCarbs += (ing.carbs_per_100g ?? 0) * factor;
    rawFat += (ing.fats_per_100g ?? 0) * factor;
  }

  const per100Factor = totalServingGrams > 0 ? 100 / totalServingGrams : 0;
  const totalMacros = rawProtein + rawCarbs + rawFat;
  const proteinPct = totalMacros > 0 ? Math.round((rawProtein / totalMacros) * 100) : 0;
  const carbsPct = totalMacros > 0 ? Math.round((rawCarbs / totalMacros) * 100) : 0;
  const fatPct = totalMacros > 0 ? Math.max(0, 100 - proteinPct - carbsPct) : 0;

  return {
    servingGrams: totalServingGrams,
    perServing: {
      calories: Math.round(rawCal),
      protein: round1(rawProtein),
      carbs: round1(rawCarbs),
      fats: round1(rawFat),
    },
    per100g: {
      calories: Math.round(rawCal * per100Factor),
      protein: round1(rawProtein * per100Factor),
      carbs: round1(rawCarbs * per100Factor),
      fats: round1(rawFat * per100Factor),
    },
    proteinPct,
    carbsPct,
    fatPct,
  };
}

export function getRecipeNutrition(recipe: RecipeWithIngredients): DualNutritionResult {
  const seen = new Set<string>();
  const uniqueRows = (recipe.recipe_ingredients || []).filter((ri) => {
    const id = ri.ingredient?.id || ri.ingredient_id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  let totalServingGrams = 0;
  let rawCal = 0;
  let rawProtein = 0;
  let rawCarbs = 0;
  let rawFat = 0;
  let hasIngredientMacros = false;

  for (const ri of uniqueRows) {
    const g = getIngredientServingGrams(ri.ingredient, ri.amount);
    totalServingGrams += g;
    if (ri.ingredient && ri.ingredient.calories_per_100g != null) {
      hasIngredientMacros = true;
      const factor = g / 100;
      rawCal += (ri.ingredient.calories_per_100g ?? 0) * factor;
      rawProtein += (ri.ingredient.protein_per_100g ?? 0) * factor;
      rawCarbs += (ri.ingredient.carbs_per_100g ?? 0) * factor;
      rawFat += (ri.ingredient.fats_per_100g ?? 0) * factor;
    }
  }

  const ppRef = getPanlasangPinoyNutrition(recipe.name);

  if (totalServingGrams <= 0) {
    totalServingGrams = ppRef?.servingGrams ?? RECIPE_SERVING_GRAMS[normalizeKey(recipe.name)] ?? 250;
  }

  const perServing: NutrientBreakdown = hasIngredientMacros
    ? {
        calories: Math.round(rawCal),
        protein: round1(rawProtein),
        carbs: round1(rawCarbs),
        fats: round1(rawFat),
      }
    : {
        calories: Math.round(recipe.calories_per_serving ?? ppRef?.calories ?? 0),
        protein: round1(recipe.protein_per_serving ?? ppRef?.protein ?? 0),
        carbs: round1(recipe.carbs_per_serving ?? ppRef?.carbs ?? 0),
        fats: round1(recipe.fats_per_serving ?? ppRef?.fats ?? 0),
      };

  const per100Factor = totalServingGrams > 0 ? 100 / totalServingGrams : 0;

  return {
    servingGrams: totalServingGrams,
    perServing,
    per100g: {
      calories: Math.round(perServing.calories * per100Factor),
      protein: round1(perServing.protein * per100Factor),
      carbs: round1(perServing.carbs * per100Factor),
      fats: round1(perServing.fats * per100Factor),
    },
  };
}
