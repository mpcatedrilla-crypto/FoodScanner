'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, ChefHat, ArrowRight } from 'lucide-react'
import type { Recipe } from '@/lib/types'

interface FeaturedRecipesProps {
  recipes: Recipe[]
}

const recipeImages: Record<string, string> = {
  'Chicken Adobo': '/images/adobo.jpg',
  'Sinigang na Baboy': '/images/sinigang.jpg',
  'Pancit Canton': '/images/pancit.jpg',
}

export function FeaturedRecipes({ recipes }: FeaturedRecipesProps) {
  const featuredRecipes = recipes.slice(0, 3)

  return (
    <section className="px-6 py-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Popular Recipes</h2>
          <p className="text-sm text-muted-foreground mt-1">Classic Filipino favorites</p>
        </div>
        <Link
          href="/recipes"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Recipe cards */}
      <div className="flex flex-col gap-4">
        {featuredRecipes.map((recipe, index) => (
          <Link
            key={recipe.id}
            href={`/recipe/${recipe.id}`}
            className="group flex gap-4 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
          >
            {/* Image */}
            <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
              <Image
                src={recipeImages[recipe.name] || '/images/adobo.jpg'}
                alt={recipe.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {recipe.name}
              </h3>
              {recipe.name_tagalog && (
                <p className="text-sm text-muted-foreground truncate">
                  {recipe.name_tagalog}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{recipe.cooking_time_minutes} min</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>{recipe.difficulty}</span>
                </div>
              </div>
            </div>

            {/* Rank badge for top 3 */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">#{index + 1}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
