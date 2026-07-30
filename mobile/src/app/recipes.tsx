import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, ChefHat } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';

const recipeImages: Record<string, any> = {
  'Chicken Adobo': require('../../assets/images/adobo.jpg'),
  'Sinigang na Baboy': require('../../assets/images/sinigang.jpg'),
  'Pancit Canton': require('../../assets/images/pancit.jpg'),
};

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border">
        <TouchableOpacity 
          className="w-10 h-10 bg-secondary rounded-full items-center justify-center mr-4"
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground">All Recipes</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="hsl(33 100% 50%)" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          <View className="gap-4">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`} asChild>
                <TouchableOpacity className="flex-row gap-4 p-3 rounded-2xl bg-card border border-border/50">
                  <View className="w-24 h-24 rounded-xl overflow-hidden bg-muted">
                    <Image
                      source={recipeImages[recipe.name] || require('../../assets/images/adobo.jpg')}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="font-semibold text-foreground text-lg" numberOfLines={1}>
                      {recipe.name}
                    </Text>
                    {recipe.name_tagalog && (
                      <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                        {recipe.name_tagalog}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-4 mt-2">
                      {recipe.cooking_time_minutes && (
                        <View className="flex-row items-center gap-1.5">
                          <Clock size={14} className="text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">{recipe.cooking_time_minutes} min</Text>
                        </View>
                      )}
                      {recipe.difficulty && (
                        <View className="flex-row items-center gap-1.5">
                          <ChefHat size={14} className="text-muted-foreground" />
                          <Text className="text-xs text-muted-foreground">{recipe.difficulty}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
