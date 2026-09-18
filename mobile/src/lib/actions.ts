import { supabase } from './supabase'
import type { Ingredient, Recipe, RecipeWithIngredients, RecipeMatch } from './types'

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: 'Chicken', name_tagalog: 'Manok', category: 'meat', is_ubiquitous: false, calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fats_per_100g: 3.6, coco_class: 'chicken', image_url: null },
  { id: '2', name: 'Pork', name_tagalog: 'Baboy', category: 'meat', is_ubiquitous: false, calories_per_100g: 242, protein_per_100g: 27, carbs_per_100g: 0, fats_per_100g: 14, coco_class: 'pork', image_url: null },
  { id: '3', name: 'Soy Sauce', name_tagalog: 'Toyo', category: 'condiments', is_ubiquitous: true, calories_per_100g: 53, protein_per_100g: 5, carbs_per_100g: 5, fats_per_100g: 0, coco_class: 'soy sauce', image_url: null },
  { id: '4', name: 'Vinegar', name_tagalog: 'Suka', category: 'condiments', is_ubiquitous: true, calories_per_100g: 18, protein_per_100g: 0, carbs_per_100g: 0.9, fats_per_100g: 0, coco_class: 'vinegar', image_url: null },
  { id: '5', name: 'Garlic', name_tagalog: 'Bawang', category: 'vegetables', is_ubiquitous: true, calories_per_100g: 149, protein_per_100g: 6.4, carbs_per_100g: 33, fats_per_100g: 0.5, coco_class: 'garlic', image_url: null },
  { id: '6', name: 'Onion', name_tagalog: 'Sibuyas', category: 'vegetables', is_ubiquitous: true, calories_per_100g: 40, protein_per_100g: 1.1, carbs_per_100g: 9, fats_per_100g: 0.1, coco_class: 'onion', image_url: null },
  { id: '7', name: 'Egg', name_tagalog: 'Itlog', category: 'protein', is_ubiquitous: false, calories_per_100g: 155, protein_per_100g: 13, carbs_per_100g: 1.1, fats_per_100g: 11, coco_class: 'egg', image_url: null },
  { id: '8', name: 'Potato', name_tagalog: 'Patatas', category: 'vegetables', is_ubiquitous: false, calories_per_100g: 77, protein_per_100g: 2, carbs_per_100g: 17, fats_per_100g: 0.1, coco_class: 'potato', image_url: null },
];

const MOCK_RECIPES: RecipeMatch[] = [
  {
    recipe: {
      id: 'r1', name: 'Chicken Adobo', name_tagalog: 'Adobong Manok',
      description: 'A classic Filipino dish full of flavor.',
      image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950',
      hero_image_url: null, cooking_time_minutes: 45, servings: 4, difficulty: 'easy',
      instructions: [{ step: 1, text: 'Marinate chicken in soy sauce and garlic.' }, { step: 2, text: 'Simmer with vinegar.' }],
      calories_per_serving: 320, protein_per_serving: 36, carbs_per_serving: 8, fats_per_serving: 12,
      is_base_recipe: false, popularity_score: 100
    },
    matchedIngredients: [MOCK_INGREDIENTS[0], MOCK_INGREDIENTS[2]],
    missingIngredients: [MOCK_INGREDIENTS[3], MOCK_INGREDIENTS[4]],
    matchPercentage: 100
  },
  {
    recipe: {
      id: 'r2', name: 'Pork Adobo', name_tagalog: 'Adobong Baboy',
      description: 'Savory pork stewed in vinegar and soy sauce.',
      image_url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99',
      hero_image_url: null, cooking_time_minutes: 50, servings: 4, difficulty: 'easy',
      instructions: [{ step: 1, text: 'Marinate pork.' }, { step: 2, text: 'Simmer until tender.' }],
      calories_per_serving: 450, protein_per_serving: 30, carbs_per_serving: 8, fats_per_serving: 25,
      is_base_recipe: false, popularity_score: 95
    },
    matchedIngredients: [MOCK_INGREDIENTS[1], MOCK_INGREDIENTS[2]],
    missingIngredients: [MOCK_INGREDIENTS[3], MOCK_INGREDIENTS[4]],
    matchPercentage: 100
  }
];

export async function getIngredients(): Promise<Ingredient[]> {
  try {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name')

    if (error || !data || data.length === 0) {
      console.warn('Falling back to mock ingredients because Supabase fetch failed:', error)
      return MOCK_INGREDIENTS
    }

    return data
  } catch (err) {
    console.warn('Network error, using mock ingredients', err)
    return MOCK_INGREDIENTS
  }
}

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('popularity_score', { ascending: false })

    if (error || !data || data.length === 0) {
      return MOCK_RECIPES.map(m => m.recipe)
    }

    return data
  } catch (err) {
    return MOCK_RECIPES.map(m => m.recipe)
  }
}

export async function getRecipeById(id: string): Promise<RecipeWithIngredients | null> {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          *,
          ingredient:ingredients (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      throw error || new Error("Not found");
    }

    return data
  } catch (err) {
    // Fallback to mock data if it matches a mock recipe
    const mockMatch = MOCK_RECIPES.find(m => m.recipe.id === id);
    if (mockMatch) {
      return {
        ...mockMatch.recipe,
        recipe_ingredients: mockMatch.matchedIngredients.map(ing => ({
          id: `ri-${ing.id}`,
          recipe_id: mockMatch.recipe.id,
          ingredient_id: ing.id,
          amount: '1',
          unit: 'pc',
          is_required: true,
          created_at: '',
          ingredient: ing
        }))
      } as RecipeWithIngredients;
    }
    return null
  }
}

export async function findMatchingRecipes(
  detectedIngredientIds: string[]
): Promise<RecipeMatch[]> {
  try {
    // Get all ingredients to filter ubiquitous ones
    const { data: allIngredients } = await supabase
      .from('ingredients')
      .select('id, name, is_ubiquitous')
    
    if (!allIngredients || allIngredients.length === 0) {
      throw new Error("No ingredients found")
    }
    
    const ingredientMap = new Map(
      allIngredients.map(i => [i.id, i])
    )
    
    // Filter out ubiquitous ingredients for matching purposes
    const nonUbiquitousIds = detectedIngredientIds.filter(
      id => !ingredientMap.get(id)?.is_ubiquitous
    )
    
    // If only ubiquitous ingredients detected, show base recipes
    const onlyUbiquitous = nonUbiquitousIds.length === 0

    // Get all recipes with their ingredients
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          *,
          ingredient:ingredients (*)
        )
      `)
      .order('popularity_score', { ascending: false })

    if (error || !recipes || recipes.length === 0) {
      throw error
    }

    // Calculate match scores
    const matches: RecipeMatch[] = recipes.map(recipe => {
      const recipeIngredients = recipe.recipe_ingredients || []
      
      const mainIngredients = recipeIngredients.filter(
        (ri: any) => ri.ingredient && !ri.ingredient.is_ubiquitous && ri.is_required
      )
      
      const matchedIngredients = recipeIngredients
        .filter((ri: any) => ri.ingredient && detectedIngredientIds.includes(ri.ingredient_id))
        .map((ri: any) => ri.ingredient as Ingredient)
      
      const missingIngredients = recipeIngredients
        .filter((ri: any) => ri.ingredient && ri.is_required && !detectedIngredientIds.includes(ri.ingredient_id))
        .map((ri: any) => ri.ingredient as Ingredient)
      
      const mainMatched = mainIngredients.filter(
        (ri: any) => detectedIngredientIds.includes(ri.ingredient_id)
      ).length
      
      const matchPercentage = mainIngredients.length > 0
        ? Math.round((mainMatched / mainIngredients.length) * 100)
        : 0

      return {
        recipe: {
          ...recipe,
          recipe_ingredients: undefined
        } as Recipe,
        matchedIngredients,
        missingIngredients,
        matchPercentage
      }
    })

    let filteredMatches = matches
    
    if (onlyUbiquitous) {
      // If ONLY supporting ingredients were scanned (e.g. just Soy Sauce), 
      // heavily penalize recipes to avoid suggesting 500 dishes.
      // We'll just return recipes where the supporting ingredient is a key component,
      // or filter it down to 1-2 generic recipes.
      filteredMatches = matches
        .filter(m => m.recipe.is_base_recipe)
        .slice(0, 3)
    } else {
      filteredMatches = matches
        .filter(m => m.matchPercentage > 0)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 10)
    }

    return filteredMatches
  } catch (err) {
    console.warn('Network error finding recipes, returning mock matches', err)
    
    // Fallback Mock Logic with Main vs Supporting logic
    const detectedMocks = MOCK_INGREDIENTS.filter(i => detectedIngredientIds.includes(i.id))
    const nonUbiquitousMocks = detectedMocks.filter(i => !i.is_ubiquitous)
    
    if (nonUbiquitousMocks.length === 0 && detectedMocks.length > 0) {
      // Only scanned a supporting ingredient like Soy Sauce
      // Don't show all recipes, just return an empty array to ask for more ingredients
      return []
    }
    
    // Sort by match quality
    return MOCK_RECIPES.filter(r => 
      r.matchedIngredients.some(i => detectedIngredientIds.includes(i.id))
    ).sort((a, b) => b.matchPercentage - a.matchPercentage)
  }
}

export async function getRecipesByIds(ids: string[]): Promise<Recipe[]> {
  if (ids.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .in('id', ids);

    if (error || !data) {
      console.error('Error fetching saved recipes:', error);
      return [];
    }
    return data;
  } catch (err) {
    console.error('Network error fetching saved recipes:', err);
    return [];
  }
}

export async function getRecipeHistory(userId: string) {
  const { data, error } = await supabase
    .from('recipe_history')
    .select('id, created_at, recipes(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }
  return data || [];
}

export async function addRecipeHistory(userId: string, recipeId: string) {
  const { data, error } = await supabase
    .from('recipe_history')
    .insert({ user_id: userId, recipe_id: recipeId })
    .select()
    .single();
  if (error) {
    console.error('Error adding history:', error);
    return null;
  }
  return data;
}

export async function deleteRecipeHistory(id: string) {
  const { error } = await supabase
    .from('recipe_history')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting history:', error);
    return false;
  }
  return true;
}

