import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { useBookmarks } from '../lib/bookmark-context';
import { getRecipesByIds } from '../lib/actions';
import { RecipeCardRow } from '../components/RecipeCardRow';
import type { Recipe } from '../lib/types';

export default function SavedScreen() {
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadSaved = async () => {
        setLoading(true);
        if (bookmarkedIds.length > 0) {
          const fetched = await getRecipesByIds(bookmarkedIds);
          if (isActive) setRecipes(fetched);
        } else {
          if (isActive) setRecipes([]);
        }
        if (isActive) setLoading(false);
      };
      
      loadSaved();
      return () => { isActive = false; };
    }, [bookmarkedIds])
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      <View className="px-6 py-6 pb-4">
        <Text className="text-white text-xl font-extrabold uppercase tracking-widest">SAVED RECIPES</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0fa958" />
        </View>
      ) : recipes.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-400 text-center text-lg">No saved recipes yet.</Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RecipeCardRow 
              recipe={item}
              dateText="Saved"
              isBookmarked={true}
              onBookmarkPress={() => toggleBookmark(item.id)}
              showTrash={true}
              onTrashPress={() => toggleBookmark(item.id)}
              onPress={() => router.push(`/recipe/${item.id}?from=saved`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
