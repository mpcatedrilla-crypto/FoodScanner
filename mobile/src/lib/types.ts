export interface Ingredient {
  id: string
  name: string
  name_tagalog: string | null
  category: string
  is_ubiquitous: boolean
  calories_per_100g: number | null
  protein_per_100g: number | null
  carbs_per_100g: number | null
  fats_per_100g: number | null
  coco_class: string | null
  image_url: string | null
}

export interface Recipe {
  id: string
  name: string
  name_tagalog: string | null
  description: string | null
  category?: string | null
  image_url: string | null
  hero_image_url: string | null
  reference_url?: string | null
  cooking_time_minutes: number | null
  servings: number | null
  difficulty: string | null
  instructions: RecipeStep[] | string | null
  calories_per_serving: number | null
  protein_per_serving: number | null
  carbs_per_serving: number | null
  fats_per_serving: number | null
  is_base_recipe: boolean
  popularity_score: number
}

export interface RecipeStep {
  step: number
  title?: string
  text: string
  timer?: number
  timer_minutes?: number
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  amount?: string | number | null
  unit?: string | null
  quantity?: string | null
  is_required: boolean
  is_main_ingredient?: boolean
  is_main?: number | boolean | string | null
  created_at?: string
  ingredient?: {
    id: string
    name: string
    name_tagalog: string | null
    coco_class: string | null
    calories_per_100g?: number | null
    protein_per_100g?: number | null
    carbs_per_100g?: number | null
    fats_per_100g?: number | null
  }
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: RecipeIngredient[]
}

export interface DetectedIngredient {
  ingredient: Ingredient
  confidence: number
  boundingBox: BoundingBox
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface RecipeMatch {
  recipe: Recipe
  matchedIngredients: Ingredient[]
  missingIngredients: Ingredient[]
  matchPercentage: number
  matchScore: number
  matchCount: number
  totalIngredients: number
}
