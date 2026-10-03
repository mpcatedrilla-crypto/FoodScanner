import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Trash2 } from 'lucide-react-native';

interface RecipeCardRowProps {
  recipe: {
    id: string;
    name: string;
    image_url: string | null;
    calories_per_serving?: number | null;
    protein_per_serving?: number | null;
    carbs_per_serving?: number | null;
    fats_per_serving?: number | null;
  };
  dateText?: string;
  showTrash?: boolean;
  onTrashPress?: () => void;
  onPress?: () => void;
}

export function RecipeCardRow({
  recipe,
  dateText = '30 min',
  showTrash = false,
  onTrashPress,
  onPress,
}: RecipeCardRowProps) {
  return (
    <TouchableOpacity
      className="bg-white rounded-[16px] mb-3 flex-row items-center border border-orange-100 mx-4 overflow-hidden shadow-sm"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: recipe.image_url || 'https://placehold.co/600x400/ea580c/ffffff.png?text=Recipe' }}
        style={{ width: 80, height: 80, margin: 12, borderRadius: 12 }}
        contentFit="cover"
      />

      <View className="flex-1 justify-center py-2 pr-2">
        <Text className="text-gray-900 text-[15px] font-bold uppercase tracking-wider mb-1" numberOfLines={1}>
          {recipe.name}
        </Text>
        {dateText ? (
          <Text className="text-gray-500 text-[11px] mb-1">
            ⏱️ {dateText}
          </Text>
        ) : null}
        {recipe.calories_per_serving ? (
          <Text className="text-gray-600 text-[11px]" numberOfLines={1}>
            {recipe.calories_per_serving} cal • {recipe.protein_per_serving}g pro • {recipe.carbs_per_serving}g carb • {recipe.fats_per_serving}g fat
          </Text>
        ) : null}
      </View>

      {showTrash && onTrashPress && (
        <View className="pr-4">
          <TouchableOpacity onPress={onTrashPress} className="p-2">
            <Trash2 size={20} color="#71717a" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}
