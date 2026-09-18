import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Search, BookOpen, UserCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function HelpScreen() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.navigate('/profile');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      <View className="flex-row items-center px-6 py-4 border-b border-white/5">
        <TouchableOpacity onPress={() => router.navigate('/profile')} className="w-10 h-10 bg-[#1c1c1e] rounded-full items-center justify-center mr-4">
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Help & Tutorial</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-bold mb-2">How to use FoodScanner</Text>
        <Text className="text-gray-400 mb-8">Follow this quick guide to master the app and start cooking!</Text>

        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#0fa958]/20 rounded-full items-center justify-center mr-4 mt-1">
            <Camera size={24} color="#0fa958" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-1">1. Scan Ingredients</Text>
            <Text className="text-gray-400 text-sm leading-5">Go to the 'Scan' tab. Point your camera at raw ingredients (e.g. pork, onions). The AI will automatically draw boxes around them. Press the capture button to lock them in.</Text>
          </View>
        </View>

        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#0fa958]/20 rounded-full items-center justify-center mr-4 mt-1">
            <Search size={24} color="#0fa958" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-1">2. Find Matching Recipes</Text>
            <Text className="text-gray-400 text-sm leading-5">If the camera misses an ingredient, tap '+ Add Scanned Ingredient Manually' to type it in. When you're ready, tap 'FIND MATCHING RECIPES' to see what Filipino dishes you can cook!</Text>
          </View>
        </View>

        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#0fa958]/20 rounded-full items-center justify-center mr-4 mt-1">
            <BookOpen size={24} color="#0fa958" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-1">3. Enter Cook Mode</Text>
            <Text className="text-gray-400 text-sm leading-5">Tap a recipe to view its details. Use the 'Next Step' button to progress through the instructions. If a step requires cooking time, an interactive timer will automatically appear!</Text>
          </View>
        </View>

        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#0fa958]/20 rounded-full items-center justify-center mr-4 mt-1">
            <UserCircle size={24} color="#0fa958" />
          </View>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold mb-1">4. Save & Manage</Text>
            <Text className="text-gray-400 text-sm leading-5">Tap the bookmark icon on any recipe to save it for later. You can view all your saved recipes in the 'Saved' tab, and revisit past scans in the 'History' tab.</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}