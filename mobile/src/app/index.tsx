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
        <View className="h-[220px] w-full relative">
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

        <View className="flex-1">
          <View className="px-6 pb-[90px] pt-2 flex-1">
            {/* Categories */}
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-900 text-xl font-bold">Available recipes</Text>
              <TouchableOpacity onPress={() => router.push('/recipes')}>
                <Text className="text-[#ea580c] text-sm font-bold">View all &gt;</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-xs mb-4">Filipino recipes available by category</Text>
            
                        <View className="flex-1 mb-6">
              {categories.map((cat, i) => (
                <TouchableOpacity 
                  key={cat.name}
                  className="w-full flex-1 rounded-xl mb-3 overflow-hidden relative flex-row items-center shadow-sm"
                  style={{ minHeight: 75 }}
                  onPress={() => router.push(`/recipes?category=${encodeURIComponent(cat.query)}&title=${encodeURIComponent(cat.name)}`)}
                >
                  <Image
                    source={cat.image}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'transparent', cat.color[0], cat.color[1]]}
                    locations={[0, 0.4, 0.75, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  />
                  <View className="flex-1" />
                  <View className="w-[110px] items-center justify-center mr-2">
                    <cat.icon size={26} color="white" />
                    <Text className="text-white text-[15px] font-bold mt-1">{cat.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </>
  );
}





