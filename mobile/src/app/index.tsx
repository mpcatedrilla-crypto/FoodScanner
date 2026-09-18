import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Leaf, Heart, Drumstick, Beef, Fish, Info } from 'lucide-react-native';
import { Link, router } from 'expo-router';
import { Image } from 'expo-image';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';
import { wikiImageMap } from '../lib/image-map';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Onboarding } from '../components/onboarding';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@has_seen_onboarding').then(val => {
      if (!val) setShowOnboarding(true);
      setIsReady(true);
    });
    getRecipes().then(data => setRecipes(data));
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@has_seen_onboarding', 'true');
    setShowOnboarding(false);
  };

  if (!isReady) return null;

  const categories = [
    { name: 'Chicken', icon: Drumstick, color: ['#d97706', '#78350f'], query: 'chicken|manok', image: require('../assets/images/cat_chicken.png') },
    { name: 'Pork', icon: Drumstick, color: ['#db2777', '#831843'], query: 'pork|baboy|lechon', image: require('../assets/images/cat_pork.png') },
    { name: 'Beef', icon: Beef, color: ['#dc2626', '#7f1d1d'], query: 'beef|baka', image: require('../assets/images/cat_beef.png') },
    { name: 'Seafood', icon: Fish, color: ['#2563eb', '#1e3a8a'], query: 'fish|shrimp|squid|bangus|tilapia|pusit|isda', image: require('../assets/images/cat_seafood.png') },
    { name: 'Vegetables', icon: Leaf, color: ['#16a34a', '#14532d'], query: 'vegetable|gourd|eggplant|squash|gulay|pinakbet', image: require('../assets/images/cat_veggies.png') },
  ];

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-[#09090b]" bounces={false} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="h-[360px] w-full relative">
          <Image
            source={require('../assets/images/home_bg.jpg')}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(9,9,11,0.5)', 'rgba(9,9,11,0.9)', '#09090b']}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          />
          
          <SafeAreaView className="flex-1 px-6 pt-4 pb-8 justify-between">
            {/* Header */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-[#0fa958]/20 items-center justify-center border border-[#0fa958]/30">
                <Info size={20} color="#0fa958" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg leading-tight">Filipino Recipes</Text>
                <Text className="text-gray-300 text-xs">Cook • Share • Enjoy</Text>
              </View>
            </View>

            {/* Hero Text */}
            <View>
              <Text className="text-white text-3xl font-extrabold mb-2 leading-tight">
                Authentic Filipino{'\n'}
                <Text className="text-[#0fa958]">Recipes, Made Easy</Text>
              </Text>
              <Text className="text-gray-300 text-sm w-4/5 leading-relaxed">
                Discover traditional flavors and modern twists, all in one place.
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View className="px-6 pb-[100px] -mt-4">
          {/* Categories */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Browse by Category</Text>
            <TouchableOpacity onPress={() => router.push('/recipes')}>
              <Text className="text-[#0fa958] text-sm font-medium">View all &gt;</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible mb-8">
            {categories.map((cat, i) => (
              <TouchableOpacity 
                key={cat.name}
                className="w-[100px] h-[110px] rounded-2xl mr-4 overflow-hidden relative items-center justify-end pb-3 border border-white/10"
                onPress={() => router.push(`/recipes?category=${encodeURIComponent(cat.query)}&title=${encodeURIComponent(cat.name)}`)}
              >
                <LinearGradient
                  colors={cat.color as [string, string]}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="absolute inset-0 opacity-40 mix-blend-overlay">
                    <Image
                      source={cat.image}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                </View>
                <cat.icon size={28} color="rgba(255,255,255,0.9)" className="mb-2" />
                <Text className="text-white text-sm font-medium">{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick Options */}
          <Text className="text-white text-xl font-bold mb-4">Quick Options</Text>
          <View className="bg-[#1c1c1e] rounded-[20px] p-2 mb-8 border border-white/5">
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-white/5"
              onPress={() => router.push('/recipes')}
            >
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
                <Search size={20} color="#a1a1aa" />
              </View>
              <View>
                <Text className="text-white text-base font-medium">Search Recipes</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Find perfect recipes with ingredients at home.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center p-4 border-b border-white/5"
              onPress={() => router.push(`/recipes?category=${encodeURIComponent('vegetable|gourd|eggplant|squash')}&title=Vegetables`)}
            >
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
                <Leaf size={20} color="#a1a1aa" />
              </View>
              <View>
                <Text className="text-white text-base font-medium">Healthy Recipes</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Nutritious and delicious choices.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-row items-center p-4"
              onPress={() => router.push('/saved')}
            >
              <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-4">
                <Heart size={20} color="#a1a1aa" />
              </View>
              <View>
                <Text className="text-white text-base font-medium">Favorites</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Your saved recipes in one place.</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recommended for You */}
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white text-xl font-bold">Recommended for You</Text>
            <TouchableOpacity onPress={() => router.push('/recipes')}>
              <Text className="text-[#0fa958] text-sm font-medium">View all &gt;</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            {recipes.slice(0, 5).map(recipe => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}?from=index`} asChild>
                <TouchableOpacity className="w-[280px] h-[220px] mr-4 bg-[#1c1c1e] rounded-[24px] overflow-hidden border border-white/5">
                  <View className="h-[140px] w-full bg-[#27272a]">
                    <Image 
                      source={{ uri: recipe.image_url || wikiImageMap[recipe.name] || 'https://placehold.co/600x400/0fa958/ffffff.png?text=Recipe' }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={200}
                    />
                    <TouchableOpacity className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 items-center justify-center backdrop-blur-md">
                      <Heart size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                  <View className="p-4">
                    <Text className="text-white font-bold text-base mb-1" numberOfLines={1}>{recipe.name}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-gray-400 text-xs mr-4">⏱ {recipe.cooking_time_minutes || 30} min</Text>
                      <Text className="text-gray-400 text-xs">👨‍🍳 {recipe.difficulty || 'Medium'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </>
  );
}
