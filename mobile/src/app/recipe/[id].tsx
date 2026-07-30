import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Users, Flame, ChefHat, Check, ShoppingCart, Heart } from 'lucide-react-native';
import { Image } from 'expo-image';

import { getRecipeById } from '../../lib/actions';
import type { RecipeWithIngredients } from '../../lib/types';
import { useBookmarks } from '../../lib/bookmark-context';

export default function RecipePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Interactive Cooking State
  const [checkedIngredients, setCheckedIngredients] = useState<Record<string, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  
  // Bookmarks
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = id ? isBookmarked(id) : false;

  useEffect(() => {
    if (id) {
      getRecipeById(id).then(data => {
        setRecipe(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0fa958" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <Text className="text-foreground text-lg mb-4">Recipe not found</Text>
        <TouchableOpacity 
          className="px-6 py-3 bg-[#0fa958] rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const instructions = recipe.instructions || [];
  const ingredients = recipe.recipe_ingredients || [];

  const toggleIngredient = (ingId: string) => {
    setCheckedIngredients(prev => ({ ...prev, [ingId]: !prev[ingId] }));
  };

  const toggleStep = (stepNum: number) => {
    setCheckedSteps(prev => ({ ...prev, [stepNum]: !prev[stepNum] }));
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero section */}
        <View className="relative h-72 bg-secondary">
          {recipe.image_url ? (
            <Image 
              source={recipe.image_url} 
              className="absolute inset-0 w-full h-full"
              contentFit="cover"
            />
          ) : (
            <View className="absolute inset-0 items-center justify-center">
              <ChefHat size={96} className="text-muted-foreground/30" />
            </View>
          )}
          {/* Gradient Overlay for back button visibility */}
          <View className="absolute inset-0 bg-black/20" />

          <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
            >
              <ArrowLeft size={20} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => toggleBookmark(id!)}
              className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
            >
              <Heart size={20} color={saved ? "#0fa958" : "white"} fill={saved ? "#0fa958" : "transparent"} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View className="px-6 -mt-8 relative z-10">
          {/* Title card */}
          <View className="bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/40">
            <Text className="text-2xl font-bold text-foreground">{recipe.name}</Text>
            {recipe.name_tagalog && (
              <Text className="text-muted-foreground mt-1 text-sm">{recipe.name_tagalog}</Text>
            )}
            
            {recipe.description && (
              <Text className="text-foreground/80 mt-3 text-sm leading-relaxed">
                {recipe.description}
              </Text>
            )}

            {/* Meta badges */}
            <View className="flex-row flex-wrap gap-3 mt-5">
              {recipe.cooking_time_minutes && (
                <View className="flex-row items-center gap-2 bg-[#e6f4ea] px-3 py-2 rounded-lg">
                  <Clock size={16} color="#0fa958" />
                  <Text className="text-sm font-medium text-[#0fa958]">{recipe.cooking_time_minutes} min</Text>
                </View>
              )}
              {recipe.servings && (
                <View className="flex-row items-center gap-2 bg-[#e6f4ea] px-3 py-2 rounded-lg">
                  <Users size={16} color="#0fa958" />
                  <Text className="text-sm font-medium text-[#0fa958]">{recipe.servings} portions</Text>
                </View>
              )}
              {recipe.difficulty && (
                <View className="flex-row items-center gap-2 bg-[#e6f4ea] px-3 py-2 rounded-lg">
                  <Flame size={16} color="#0fa958" />
                  <Text className="text-sm font-medium text-[#0fa958] capitalize">{recipe.difficulty}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Interactive Ingredients */}
          <View className="mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-foreground">Ingredients</Text>
              <Text className="text-sm text-muted-foreground font-medium">{ingredients.length} items</Text>
            </View>
            
            <View className="bg-card rounded-2xl overflow-hidden border border-border/40">
              {ingredients.map((ri, index) => {
                const isChecked = checkedIngredients[ri.id];
                return (
                  <TouchableOpacity
                    key={ri.id}
                    onPress={() => toggleIngredient(ri.id)}
                    activeOpacity={0.7}
                    className={`flex-row items-center justify-between p-4 ${
                      index < ingredients.length - 1 ? 'border-b border-border/50' : ''
                    } ${isChecked ? 'bg-secondary/30' : ''}`}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <View className={`w-6 h-6 rounded-md border items-center justify-center ${
                        isChecked ? 'bg-[#0fa958] border-[#0fa958]' : 'border-muted-foreground/50'
                      }`}>
                        {isChecked && <Check size={14} color="white" />}
                      </View>
                      <View className="flex-1 pr-2">
                        <Text className={`font-medium ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                          {ri.ingredient?.name}
                        </Text>
                        {ri.ingredient?.name_tagalog && (
                          <Text className={`text-xs ${isChecked ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                            {ri.ingredient.name_tagalog}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className={`text-sm font-medium ${isChecked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {ri.amount} {ri.unit}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Interactive Instructions */}
          {instructions.length > 0 && (
            <View className="mt-8">
              <Text className="text-xl font-bold text-foreground mb-4">Instructions</Text>
              <View className="gap-4">
                {instructions.map((step, index) => {
                  const isChecked = checkedSteps[step.step];
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => toggleStep(step.step)}
                      activeOpacity={0.8}
                      className={`flex-row gap-4 bg-card border border-border/40 rounded-2xl p-5 shadow-sm shadow-black/5 ${
                        isChecked ? 'opacity-60 bg-secondary/20' : ''
                      }`}
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center flex-shrink-0 ${
                        isChecked ? 'bg-[#0fa958]' : 'bg-primary/10'
                      }`}>
                        {isChecked ? (
                          <Check size={16} color="white" />
                        ) : (
                          <Text className="text-[#0fa958] font-bold text-sm">
                            {step.step}
                          </Text>
                        )}
                      </View>
                      <Text className={`text-foreground leading-relaxed flex-1 mt-1 text-[15px] ${
                        isChecked ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {step.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
