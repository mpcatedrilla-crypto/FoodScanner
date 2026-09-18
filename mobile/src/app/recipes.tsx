import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRecipes } from '../lib/actions';
import { RecipeCardRow } from '../components/RecipeCardRow';
import type { Recipe } from '../lib/types';

export default function RecipesScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then(data => {
      let filtered = data;
      if (category) {
        const keywords = category.toLowerCase().split('|');
        filtered = data.filter(r => 
          keywords.some(k => r.name.toLowerCase().includes(k) || (r.name_tagalog && r.name_tagalog.toLowerCase().includes(k)))
        );
      }
      setRecipes(filtered);
      setLoading(false);
    });
  }, [category]);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-6 pb-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="#0fa958" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-extrabold uppercase tracking-widest">
          {category ? `${category.replace('|', '/').toUpperCase()}` : 'ALL RECIPES'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0fa958" />
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-400 text-center text-lg">No recipes found for this category.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecipeCardRow 
              recipe={item}
              dateText={`${item.cooking_time_minutes} min`}
              onPress={() => router.push(`/recipe/${item.id}?from=recipes`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
