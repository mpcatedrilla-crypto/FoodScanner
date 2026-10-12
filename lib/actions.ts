'use server'

import { createClient } from '@/lib/supabase/server'
import type { Ingredient, Recipe, RecipeWithIngredients, RecipeMatch } from '@/lib/types'

export async function getIngredients(): Promise<Ingredient[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching ingredients:', error)
    return []
  }

  return data || []
}

export async function getRecipes(): Promise<Recipe[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('popularity_score', { ascending: false })

  if (error) {
    console.error('Error fetching recipes:', error)
    return []
  }

  return data || []
}

export async function getRecipeById(id: string): Promise<RecipeWithIngredients | null> {
  const supabase = await createClient()
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

  if (error) {
    console.error('Error fetching recipe:', error)
    return null
  }

  return data
}

export async function findMatchingRecipes(
  detectedIngredientIds: string[]
): Promise<RecipeMatch[]> {
  const supabase = await createClient()
  
  // Get all ingredients to filter ubiquitous ones
  const { data: allIngredients } = await supabase
    .from('ingredients')
    .select('id, name, is_ubiquitous')
  
  const ingredientMap = new Map(
    allIngredients?.map(i => [i.id, i]) || []
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

  if (error || !recipes) {
    console.error('Error finding recipes:', error)
    return []
  }

  // Calculate match scores
  const matches: RecipeMatch[] = recipes.map(recipe => {
    const recipeIngredients = recipe.recipe_ingredients || []
    
    // Get main (non-ubiquitous) ingredients for the recipe
    const mainIngredients = recipeIngredients.filter(
      ri => ri.ingredient && !ri.ingredient.is_ubiquitous && ri.is_required
    )
    
    const matchedIngredients = recipeIngredients
      .filter(ri => ri.ingredient && detectedIngredientIds.includes(ri.ingredient_id))
      .map(ri => ri.ingredient as Ingredient)
    
    const missingIngredients = recipeIngredients
      .filter(ri => ri.ingredient && ri.is_required && !detectedIngredientIds.includes(ri.ingredient_id))
      .map(ri => ri.ingredient as Ingredient)
    
    // Calculate match percentage based on main ingredients
    const mainMatched = mainIngredients.filter(
      ri => detectedIngredientIds.includes(ri.ingredient_id)
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

  // Filter and sort results
  let filteredMatches = matches
  
  if (onlyUbiquitous) {
    // Return top 3 base recipes when only ubiquitous ingredients detected
    filteredMatches = matches
      .filter(m => m.recipe.is_base_recipe)
      .slice(0, 3)
  } else {
    // Return recipes with at least one main ingredient match
    filteredMatches = matches
      .filter(m => m.matchPercentage > 0)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 10)
  }

  return filteredMatches
}
