import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Clock, ChefHat, ArrowRight } from 'lucide-react-native';
import type { Recipe } from '../../lib/types';

interface FeaturedRecipesProps {
  recipes: Recipe[];
}

const recipeImages: Record<string, any> = {
  'Chicken Adobo': require('../../../assets/images/adobo.jpg'),
  'Sinigang na Baboy': require('../../../assets/images/sinigang.jpg'),
  'Pancit Canton': require('../../../assets/images/pancit.jpg'),
};

export function FeaturedRecipes({ recipes }: FeaturedRecipesProps) {
  const featuredRecipes = recipes.slice(0, 2);

  return (
    <View className="px-6 py-8">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-2">
        <View>
          <Text className="text-xl font-bold text-foreground">Popular Recipes</Text>
          <Text className="text-sm text-muted-foreground mt-1">Classic Filipino favorites</Text>
        </View>
        <Link href="/recipes" asChild>
          <TouchableOpacity className="flex-row items-center gap-1">
            <Text className="text-sm font-medium text-primary">View all</Text>
            <ArrowRight size={16} className="text-primary" />
          </TouchableOpacity>
        </Link>
      </View>

      {/* Recipe cards */}
      <View className="flex-col gap-2">
        {featuredRecipes.map((recipe, index) => (
          <Link
            key={recipe.id}
            href={`/recipe/${recipe.id}`}
            asChild
          >
            <TouchableOpacity className="flex-row gap-3 p-2 rounded-2xl bg-card border border-border/50 active:bg-primary/5">
              {/* Image */}
              <View className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                <Image
                  source={recipeImages[recipe.name] || require('../../../assets/images/adobo.jpg')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>

              {/* Content */}
              <View className="flex-1 flex-col justify-center min-w-0">
                <Text className="font-semibold text-foreground" numberOfLines={1}>
                  {recipe.name}
                </Text>
                {recipe.name_tagalog && (
                  <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                    {recipe.name_tagalog}
                  </Text>
                )}
                <View className="flex-row items-center gap-4 mt-2">
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={14} className="text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground">{recipe.cooking_time_minutes} min</Text>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <ChefHat size={14} className="text-muted-foreground" />
                    <Text className="text-xs text-muted-foreground">{recipe.difficulty}</Text>
                  </View>
                </View>
              </View>

              {/* Rank badge for top 3 */}
              <View className="justify-center">
                <View className="w-8 h-8 rounded-full bg-[#e6f4ea] items-center justify-center">
                  <Text className="text-sm font-bold text-[#0fa958]">#{index + 1}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </Link>
        ))}
      </View>
    </View>
  );
}
