import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Search } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';
import { RecipeImages } from '../lib/imageMap';

export default function RecipesScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; title?: string | string[] }>();
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    getRecipes(categoryParam)
      .then((data: Recipe[]) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load recipes', err);
        setLoading(false);
      });
  }, [categoryParam]);

  const displayTitle = titleParam
    ? titleParam.toUpperCase()
    : categoryParam
      ? categoryParam.replace('|', '/').toUpperCase()
      : 'ALL RECIPES';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FFF9F2]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-orange-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4 w-10 h-10 rounded-full bg-orange-100 items-center justify-center"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#ea580c" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-stone-900 text-xl font-extrabold uppercase tracking-wider" numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text className="text-stone-500 text-xs mt-0.5">
            {loading ? 'Searching...' : `${recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.name_tagalog && r.name_tagalog.toLowerCase().includes(searchQuery.toLowerCase()))).length} recipes available`}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-3 border-b border-orange-50 bg-white">
        <View className="flex-row items-center bg-stone-100 rounded-xl px-4 py-3">
          <Search size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-3 text-base text-stone-800"
            placeholder="Search for a recipe..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#ea580c" />
          <Text className="text-stone-500 text-sm mt-3 font-medium">Loading recipes...</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-stone-800 text-lg font-bold text-center">No recipes found</Text>
          <Text className="text-stone-500 text-sm text-center mt-1">
            No recipes matching "{displayTitle.toLowerCase()}" are currently available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || (r.name_tagalog && r.name_tagalog.toLowerCase().includes(searchQuery.toLowerCase())))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push((`/recipe/${item.id}?from=recipes`) as any)}
              className="bg-white rounded-2xl mb-3 flex-row items-center border border-orange-100 p-3 shadow-sm mx-4"
              activeOpacity={0.8}
            >
              <Image
                source={RecipeImages[item.id] || require('../../assets/images/hero-food.jpg')}
                style={{ width: 84, height: 84, borderRadius: 12 }}
                contentFit="cover"
              />
              <View className="flex-1 ml-3 justify-center">
                <Text className="text-stone-900 text-base font-bold" numberOfLines={1}>
                  {item.name}
                </Text>
                {item.cooking_time_minutes ? (
                  <View className="flex-row items-center mt-0.5">
                    <Clock size={12} color="#ea580c" />
                    <Text className="text-stone-500 text-xs ml-1">
                      {item.cooking_time_minutes} min
                    </Text>
                  </View>
                ) : null}

                {/* DOST Nutritional Facts */}
                <View className="mt-2 flex-row flex-wrap items-center gap-x-2 gap-y-1">
                  <View className="bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    <Text className="text-[#ea580c] text-[11px] font-bold">
                      {item.calories_per_serving ?? 0} cal
                    </Text>
                  </View>
                  <View className="bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                      <Text className="text-stone-600 text-[11px] font-medium">Protein: {item.protein_per_serving ?? 0}g</Text>
                    </View>
                    <View className="bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                      <Text className="text-stone-600 text-[11px] font-medium">Carbs: {item.carbs_per_serving ?? 0}g</Text>
                    </View>
                    <View className="bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                      <Text className="text-stone-600 text-[11px] font-medium">Fats: {item.fats_per_serving ?? 0}g</Text>
                    </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
