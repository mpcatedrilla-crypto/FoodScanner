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
    { name: 'Chicken', icon: Drumstick, color: ['#ea580c', '#c2410c'], query: 'chicken|manok', image: require('../assets/images/cat_chicken.png') },
    { name: 'Pork', icon: Drumstick, color: ['#ef4444', '#b91c1c'], query: 'pork|baboy|lechon', image: require('../assets/images/cat_pork.png') },
    { name: 'Beef', icon: Beef, color: ['#b91c1c', '#7f1d1d'], query: 'beef|baka', image: require('../assets/images/cat_beef.png') },
    { name: 'Seafood', icon: Fish, color: ['#3b82f6', '#1d4ed8'], query: 'fish|shrimp|squid|bangus|tilapia|pusit|isda', image: require('../assets/images/cat_seafood.png') },
    { name: 'Vegetables', icon: Leaf, color: ['#84cc16', '#4d7c0f'], query: 'vegetable|gourd|eggplant|squash|gulay|pinakbet', image: require('../assets/images/cat_veggies.png') },
  ];

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <StatusBar style="dark" />
      <View className="flex-1 bg-[#FFF9F2]">
        {/* Hero Section */}
        <View className="h-[360px] w-full relative">
          <Image
            source={require('../assets/images/home_bg.jpg')}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(255,249,242,0.1)', 'rgba(255,249,242,0.8)', '#FFF9F2']}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
          />
          
          <SafeAreaView className="flex-1 px-6 pt-4 pb-8 justify-between">
            {/* Header */}
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-[#ea580c] items-center justify-center shadow-sm">
                <Info size={20} color="white" />
              </View>
              <View>
                <Text className="text-gray-900 font-bold text-lg leading-tight">Filipino Recipes</Text>
                <Text className="text-gray-600 text-xs">Cook {'\u2022'} Share {'\u2022'} Enjoy</Text>
              </View>
            </View>

            {/* Hero Text */}
            <View>
              <Text className="text-gray-900 text-3xl font-extrabold mb-2 leading-tight">
                Authentic Filipino{'\n'}
                <Text className="text-[#ea580c]">Recipes, Made Easy</Text>
              </Text>
              <Text className="text-gray-600 text-sm w-4/5 leading-relaxed">
                Discover traditional flavors and modern twists, all in one place.
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <ScrollView className="flex-1" bounces={false} overScrollMode="never" showsVerticalScrollIndicator={false}>
          <View className="px-6 pb-[100px] pt-2">
            {/* Categories */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-900 text-xl font-bold">Recipes Available</Text>
              <TouchableOpacity onPress={() => router.push('/recipes')}>
                <Text className="text-[#ea580c] text-sm font-bold">View all &gt;</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-xs mb-4">Filipino Available Recipes by category</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible mb-8">
              {categories.map((cat, i) => (
                <TouchableOpacity 
                  key={cat.name}
                  className="w-[100px] h-[110px] rounded-2xl mr-4 overflow-hidden relative items-center justify-end pb-3 border border-gray-200"
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
          </View>
        </ScrollView>
      </View>
    </>
  );
}


