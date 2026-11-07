import type { StyleProp, ImageStyle } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { RecipeImages } from '../lib/imageMap';

export function RecipeImage({
  recipe,
  style,
}: {
  recipe: { id: string; image_url: string | null };
  style: StyleProp<ImageStyle>;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const localImage = RecipeImages[recipe.id];
  const placeholder = require('../../assets/images/hero-food.jpg');
  const useRecipeUrl = !!recipe.image_url && recipe.image_url !== failedUrl;
  const source = localImage || (useRecipeUrl ? { uri: recipe.image_url! } : placeholder);

  return (
    <Image
      source={source}
      style={style}
      contentFit="cover"
      onError={() => {
        if (!localImage && recipe.image_url) setFailedUrl(recipe.image_url);
      }}
    />
  );
}
