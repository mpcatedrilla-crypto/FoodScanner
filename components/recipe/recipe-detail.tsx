'use client'

import Link from 'next/link'
import { ArrowLeft, Clock, Users, Flame, ChefHat, Check, ShoppingCart } from 'lucide-react'
import type { RecipeWithIngredients } from '@/lib/types'

interface RecipeDetailProps {
  recipe: RecipeWithIngredients
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const instructions = recipe.instructions || []
  const ingredients = recipe.recipe_ingredients || []

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero section */}
      <div className="relative h-64 bg-gradient-to-br from-primary/40 to-primary/20">
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-4 left-4 safe-area-top z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        {/* Recipe icon placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ChefHat className="w-24 h-24 text-primary/30" />
        </div>

        {/* Gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 relative z-10">
        {/* Title card */}
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground">{recipe.name}</h1>
          {recipe.name_tagalog && (
            <p className="text-muted-foreground mt-1">{recipe.name_tagalog}</p>
          )}
          
          {recipe.description && (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {recipe.description}
            </p>
          )}

          {/* Meta badges */}
          <div className="flex flex-wrap gap-3 mt-4">
            {recipe.cooking_time_minutes && (
              <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{recipe.cooking_time_minutes} min</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{recipe.servings} servings</span>
              </div>
            )}
            {recipe.difficulty && (
              <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                <Flame className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{recipe.difficulty}</span>
              </div>
            )}
          </div>
        </div>

        {/* Nutrition info */}
        {(recipe.calories_per_serving || recipe.protein_per_serving) && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Nutrition per Serving</h2>
            <div className="grid grid-cols-4 gap-2">
              <NutritionCard label="Calories" value={recipe.calories_per_serving} unit="kcal" />
              <NutritionCard label="Protein" value={recipe.protein_per_serving} unit="g" />
              <NutritionCard label="Carbs" value={recipe.carbs_per_serving} unit="g" />
              <NutritionCard label="Fats" value={recipe.fats_per_serving} unit="g" />
            </div>
          </div>
        )}

        {/* Ingredients */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Ingredients</h2>
            <span className="text-sm text-muted-foreground">{ingredients.length} items</span>
          </div>
          
          <div className="bg-card rounded-2xl divide-y divide-border">
            {ingredients.map((ri) => (
              <div
                key={ri.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ri.is_main_ingredient 
                      ? 'bg-primary/20' 
                      : 'bg-secondary'
                  }`}>
                    {ri.is_main_ingredient ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {ri.ingredient?.name}
                    </p>
                    {ri.ingredient?.name_tagalog && (
                      <p className="text-xs text-muted-foreground">
                        {ri.ingredient.name_tagalog}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {ri.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        {instructions.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">Instructions</h2>
            <div className="space-y-4">
              {instructions.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 bg-card rounded-2xl p-4"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {step.step}
                  </div>
                  <p className="text-foreground leading-relaxed pt-1">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to scanner button */}
        <Link
          href="/"
          className="block mt-8 w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium text-center"
        >
          Scan More Ingredients
        </Link>
      </div>
    </div>
  )
}

function NutritionCard({ 
  label, 
  value, 
  unit 
}: { 
  label: string
  value: number | null
  unit: string 
}) {
  if (!value) return null
  
  return (
    <div className="bg-card rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-foreground">
        {Math.round(value)}
        <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}
