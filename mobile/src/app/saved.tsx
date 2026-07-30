import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Link, useFocusEffect } from 'expo-router';
import { Bookmark, Clock, Flame } from 'lucide-react-native';
import { useBookmarks } from '../lib/bookmark-context';
import { getRecipesByIds } from '../lib/actions';
import type { Recipe } from '../lib/types';

export default function SavedScreen() {
  const { bookmarkedIds } = useBookmarks();
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

  if (loading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#0fa958" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-2 border-b border-border">
        <Text className="text-3xl font-bold text-foreground">Saved Recipes</Text>
        <Text className="text-muted-foreground mt-1 mb-4">Your personal collection of favorites</Text>
      </View>

      {recipes.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center mb-4">
            <Bookmark size={40} className="text-muted-foreground" />
          </View>
          <Text className="text-xl font-semibold text-foreground text-center">No saved recipes yet</Text>
          <Text className="text-muted-foreground text-center mt-2">
            When you find a recipe you love, tap the heart icon to save it here for quick access.
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Link href={`/recipe/${item.id}`} asChild>
              <TouchableOpacity className="flex-row bg-card rounded-2xl mb-4 overflow-hidden shadow-sm border border-border/50 h-32">
                <Image 
                  source={item.image_url || 'https://via.placeholder.com/150'} 
                  className="w-32 h-full bg-secondary"
                  contentFit="cover"
                />
                <View className="flex-1 p-3 justify-between">
                  <View>
                    <Text className="font-bold text-lg text-foreground line-clamp-1">{item.name}</Text>
                    {item.name_tagalog && (
                      <Text className="text-sm text-muted-foreground line-clamp-1">{item.name_tagalog}</Text>
                    )}
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground">{item.cooking_time_minutes}m</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Flame size={12} className="text-muted-foreground" />
                      <Text className="text-xs text-muted-foreground capitalize">{item.difficulty}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Link>
          )}
        />
      )}
    </SafeAreaView>
  );
}
