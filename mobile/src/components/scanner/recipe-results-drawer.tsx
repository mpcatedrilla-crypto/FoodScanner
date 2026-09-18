import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChefHat, Clock, Users, Check, X } from 'lucide-react-native';
import { Image } from 'expo-image';
import { wikiImageMap } from '../../lib/image-map';
import { Link, router } from 'expo-router';
import type { RecipeMatch, Ingredient } from '../../lib/types';

interface RecipeResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: RecipeMatch[];
  detectedIngredients: Ingredient[];
}

export function RecipeResultsDrawer({
  isOpen,
  onClose,
  recipes,
  detectedIngredients
}: RecipeResultsDrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Snap points for the bottom sheet (can swipe up to 85% or down to 25% to peek)
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.snapToIndex(1); // Open to 50% by default
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={1}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    []
  );

  const readyToCook = recipes.filter(r => r.missingIngredients.length === 0);
  const missingIngredientsList = recipes.filter(r => r.missingIngredients.length > 0);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 1 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={(idx) => {
        if (idx === -1) onClose();
      }}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#111' }}
      handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
    >
      <View className="flex-1 bg-[#111]">
        {/* Header */}
        <View className="px-6 pb-4 border-b border-white/10 relative">
          <TouchableOpacity 
            onPress={onClose} 
            className="absolute top-0 right-6 w-8 h-8 rounded-full bg-white/10 items-center justify-center z-10"
          >
            <X size={16} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-white mr-10">
            Recipe Suggestions
          </Text>
          <Text className="text-sm text-white/60 mt-1">
            Based on {detectedIngredients.length} detected ingredient{detectedIngredients.length !== 1 ? 's' : ''}
          </Text>
          
          {/* Detected ingredients chips */}
          <View className="flex-row flex-wrap gap-2 mt-3">
            {detectedIngredients.map(ing => (
              <View
                key={ing.id}
                className="px-3 py-1 bg-[#0fa958]/20 rounded-full"
              >
                <Text className="text-[#0fa958] text-sm font-medium">{ing.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recipe list */}
        <BottomSheetScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {recipes.length === 0 ? (
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-full bg-white/5 items-center justify-center mb-4">
                <ChefHat size={32} className="text-white/40" />
              </View>
              <Text className="text-white/60 text-center">
                No matching recipes found. Try scanning more ingredients!
              </Text>
            </View>
          ) : (
            <View className="gap-6">
              {/* Ready to Cook */}
              {readyToCook.length > 0 && (
                <View>
                  <Text className="text-[#0fa958] font-bold mb-3 px-2">✨ Ready to Cook</Text>
                  <View className="gap-3">
                    {readyToCook.map(match => (
                      <RecipeCard key={match.recipe.id} match={match} type="ready" />
                    ))}
                  </View>
                </View>
              )}

              {/* Missing Ingredients */}
              {missingIngredientsList.length > 0 && (
                <View>
                  <Text className="text-[#f59e0b] font-bold mb-3 px-2">🛒 Missing Ingredients</Text>
                  <View className="gap-3">
                    {missingIngredientsList.slice(0, 5).map(match => (
                      <RecipeCard key={match.recipe.id} match={match} type="missing" />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
}

function RecipeCard({ match, type }: { match: RecipeMatch; type: 'ready' | 'missing' }) {
  const { recipe, missingIngredients } = match;

  return (
    <Link href={`/recipe/${recipe.id}?from=scan`} asChild>
      <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl flex-row overflow-hidden active:bg-[#2c2c2e] border border-white/5 h-28">
        <View className="flex-1 p-4 justify-center">
          <Text className="font-semibold text-white text-lg mb-1" numberOfLines={1}>{recipe.name}</Text>
          {type === 'ready' ? (
            <Text className="text-sm text-white/60" numberOfLines={1}>You have all required ingredients!</Text>
          ) : (
            <Text className="text-sm text-[#ef4444]" numberOfLines={1}>
              Missing: {missingIngredients.map(i => i.name).join(', ')}
            </Text>
          )}
        </View>
        
        {recipe.image_url || wikiImageMap[recipe.name] ? (
          <Image source={{ uri: recipe.image_url || wikiImageMap[recipe.name] }} className="w-28 h-full bg-white/5" contentFit="cover" />
        ) : (
          <View className="w-28 h-full bg-white/5 items-center justify-center">
            <ChefHat size={24} className="text-white/30" />
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
}
