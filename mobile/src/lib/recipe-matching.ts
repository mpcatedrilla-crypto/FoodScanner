import type { Ingredient, Recipe, RecipeMatch } from './types';

export const RECIPE_MATCH_LIMIT = 5;

export type RecipeIngredientRow = {
  recipe_id: string;
  ingredient_id: string;
  is_main?: number | boolean | string | null;
};

export function isRecipeSpecificMain(flag: RecipeIngredientRow['is_main']): boolean {
  return flag === true || flag === 1 || flag === '1';
}

function buildDetectedSet(ingredients: Ingredient[], detectedIngredientIds: string[]): Set<string> {
  const detected = detectedIngredientIds.map(i => i.toLowerCase().trim()).filter(Boolean);
  const detectedMap = new Set<string>();
  for (const ing of ingredients) {
    const cocoHit = ing.coco_class
      ? ing.coco_class.toLowerCase().split(',').some(cc => detected.includes(cc.trim()))
      : false;
    if (
      detected.includes(ing.id.toLowerCase()) ||
      detected.includes(ing.name.toLowerCase()) ||
      cocoHit
    ) {
      detectedMap.add(ing.id);
    }
  }
  return detectedMap;
}

export function matchAndRankRecipes(
  recipes: Recipe[],
  ingredients: Ingredient[],
  recipeIngredients: RecipeIngredientRow[],
  detectedIngredientIds: string[],
  limit = RECIPE_MATCH_LIMIT,
): RecipeMatch[] {
  if (detectedIngredientIds.length === 0) return [];

  const detectedMap = buildDetectedSet(ingredients, detectedIngredientIds);
  const byRecipe = new Map<string, RecipeIngredientRow[]>();
  for (const row of recipeIngredients) {
    const list = byRecipe.get(row.recipe_id);
    if (list) list.push(row);
    else byRecipe.set(row.recipe_id, [row]);
  }

  const matches: RecipeMatch[] = [];

  for (const recipe of recipes) {
    const required = byRecipe.get(recipe.id) ?? [];
    const matched: Ingredient[] = [];
    const missing: Ingredient[] = [];
    let matchScore = 0;

    for (const row of required) {
      const ing = ingredients.find(i => i.id === row.ingredient_id);
      if (!ing) continue;
      if (detectedMap.has(row.ingredient_id)) {
        matched.push(ing);
        matchScore += isRecipeSpecificMain(row.is_main) ? 3 : 1;
      } else {
        missing.push(ing);
      }
    }

    if (matched.length === 0) continue;

    matches.push({
      recipe,
      matchedIngredients: matched,
      missingIngredients: missing,
      matchPercentage: required.length > 0 ? (matched.length / required.length) * 100 : 0,
      matchScore,
      matchCount: matched.length,
      totalIngredients: required.length,
    });
  }

  matches.sort((a, b) => b.matchScore - a.matchScore || a.totalIngredients - b.totalIngredients);
  return matches.slice(0, limit);
}
