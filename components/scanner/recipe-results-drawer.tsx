'use client'

import { Drawer } from 'vaul'
import { Clock, Users, ChefHat, Check, X } from 'lucide-react'
import Link from 'next/link'
import type { RecipeMatch, Ingredient } from '@/lib/types'

interface RecipeResultsDrawerProps {
  isOpen: boolean
  onClose: () => void
  recipes: RecipeMatch[]
  detectedIngredients: Ingredient[]
}

export function RecipeResultsDrawer({
  isOpen,
  onClose,
  recipes,
  detectedIngredients
}: RecipeResultsDrawerProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 outline-none">
          <div className="bg-card rounded-t-3xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="drawer-handle" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-border">
              <Drawer.Title className="text-xl font-semibold text-foreground">
                Recipe Suggestions
              </Drawer.Title>
              <p className="text-sm text-muted-foreground mt-1">
                Based on {detectedIngredients.length} detected ingredient{detectedIngredients.length !== 1 ? 's' : ''}
              </p>
              
              {/* Detected ingredients chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {detectedIngredients.map(ing => (
                  <span
                    key={ing.id}
                    className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                  >
                    {ing.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Recipe list */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {recipes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                    <ChefHat className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    No matching recipes found. Try scanning more ingredients!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recipes.map(match => (
                    <RecipeCard key={match.recipe.id} match={match} />
                  ))}
                </div>
              )}
            </div>

            {/* Close button */}
            <div className="px-4 pb-6 safe-area-bottom">
              <button
                onClick={onClose}
                className="w-full py-4 bg-secondary text-secondary-foreground rounded-xl font-medium"
              >
                Scan More Ingredients
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

function RecipeCard({ match }: { match: RecipeMatch }) {
  const { recipe, matchedIngredients, missingIngredients, matchPercentage } = match

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="block bg-secondary/50 rounded-2xl overflow-hidden hover:bg-secondary/70 transition-colors"
    >
      {/* Recipe image placeholder */}
      <div className="h-32 bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center relative">
        <ChefHat className="w-12 h-12 text-primary/50" />
        
        {/* Match percentage badge */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${
          matchPercentage >= 80 
            ? 'bg-primary text-primary-foreground' 
            : matchPercentage >= 50 
              ? 'bg-warning text-black' 
              : 'bg-muted text-muted-foreground'
        }`}>
          {matchPercentage}% match
        </div>
      </div>

      <div className="p-4">
        {/* Recipe title */}
        <h3 className="font-semibold text-foreground text-lg">{recipe.name}</h3>
        {recipe.name_tagalog && (
          <p className="text-sm text-muted-foreground">{recipe.name_tagalog}</p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {recipe.cooking_time_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {recipe.cooking_time_minutes} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {recipe.servings} servings
            </span>
          )}
          {recipe.difficulty && (
            <span className="px-2 py-0.5 bg-muted rounded text-xs">
              {recipe.difficulty}
            </span>
          )}
        </div>

        {/* Ingredient status */}
        <div className="mt-3 space-y-2">
          {matchedIngredients.length > 0 && (
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">
                <span className="text-primary font-medium">You have: </span>
                {matchedIngredients.map(i => i.name).join(', ')}
              </p>
            </div>
          )}
          {missingIngredients.length > 0 && (
            <div className="flex items-start gap-2">
              <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Missing: </span>
                {missingIngredients.slice(0, 3).map(i => i.name).join(', ')}
                {missingIngredients.length > 3 && ` +${missingIngredients.length - 3} more`}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
