import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Bookmark, Trash2 } from 'lucide-react-native';

interface RecipeCardRowProps {
  recipe: {
    id: string;
    name: string;
    image_url: string;
  };
  dateText?: string;
  rating?: string;
  showBookmark?: boolean;
  isBookmarked?: boolean;
  onBookmarkPress?: () => void;
  showTrash?: boolean;
  onTrashPress?: () => void;
  onPress?: () => void;
}

export function RecipeCardRow({
  recipe,
  dateText = 'Jun 5',
  rating = '4.5',
  showBookmark = false,
  isBookmarked = false,
  onBookmarkPress,
  showTrash = false,
  onTrashPress,
  onPress
}: RecipeCardRowProps) {
  return (
    <TouchableOpacity 
      className="bg-[#1c1c1e] rounded-[16px] mb-3 flex-row items-center border border-white/5 mx-4 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: recipe.image_url || 'https://placehold.co/600x400/0fa958/ffffff.png' }} 
        style={{ width: 80, height: 80, margin: 12, borderRadius: 12 }} 
        contentFit="cover" 
      />
      
      <View className="flex-1 justify-center py-2">
        <Text className="text-white text-[15px] font-bold uppercase tracking-wider mb-2" numberOfLines={1}>
          {recipe.name}
        </Text>
        <Text className="text-gray-400 text-xs">
          {dateText} | {rating}★
        </Text>
      </View>

      <View className="flex-row items-center pr-4 space-x-3">
        {showBookmark && (
          <TouchableOpacity onPress={onBookmarkPress} className="p-2">
            <Bookmark 
              size={20} 
              color={isBookmarked ? "#0fa958" : "#71717a"} 
              fill={isBookmarked ? "#0fa958" : "transparent"} 
            />
          </TouchableOpacity>
        )}
        
        {showTrash && (
          <TouchableOpacity onPress={onTrashPress} className="p-2">
            <Trash2 size={20} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
