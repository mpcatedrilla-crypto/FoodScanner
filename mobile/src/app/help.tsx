import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Search, BookOpen, Users, Award } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function HelpScreen() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FFF9F2]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-orange-200/40">
        <TouchableOpacity onPress={handleBack} className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
          <ArrowLeft size={20} color="#ea580c" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-xl font-bold">Help & Tutorial</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }} scrollEnabled={false}>
        <Text className="text-gray-900 text-2xl font-bold mb-2">How to use FoodScanner</Text>
        <Text className="text-gray-600 mb-8">Follow this quick guide to master the app and start cooking!</Text>

        {/* Step 1 */}
        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#ea580c]/10 rounded-full items-center justify-center mr-4 mt-1 border border-[#ea580c]/20">
            <Camera size={24} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-bold mb-1">1. Scan Ingredients</Text>
            <Text className="text-gray-600 text-sm leading-5">Go to the 'Scan' tab. Point your camera at raw ingredients (e.g. pork, onions). The offline AI will automatically draw bounding boxes. Press capture to lock them in.</Text>
          </View>
        </View>

        {/* Step 2 */}
        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#ea580c]/10 rounded-full items-center justify-center mr-4 mt-1 border border-[#ea580c]/20">
            <Search size={24} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-bold mb-1">2. Find Matching Recipes</Text>
            <Text className="text-gray-600 text-sm leading-5">If an ingredient was missed, tap '+ Add Scanned Ingredient Manually'. Tap 'FIND MATCHING RECIPES' to discover authentic Filipino dishes matched offline.</Text>
          </View>
        </View>

        {/* Step 3 */}
        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#ea580c]/10 rounded-full items-center justify-center mr-4 mt-1 border border-[#ea580c]/20">
            <BookOpen size={24} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-bold mb-1">3. Enter Cook Mode</Text>
            <Text className="text-gray-600 text-sm leading-5">Tap a recipe to view details. Follow step-by-step cooking instructions with interactive timers that alert you when each phase is complete.</Text>
          </View>
        </View>

        {/* Step 4 (Nutrition & History - Bookmarks removed) */}
        <View className="flex-row mb-8">
          <View className="w-12 h-12 bg-[#ea580c]/10 rounded-full items-center justify-center mr-4 mt-1 border border-[#ea580c]/20">
            <Award size={24} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 text-lg font-bold mb-1">4. DOST Nutritional Facts</Text>
            <Text className="text-gray-600 text-sm leading-5">View accurate nutritional data (calories, protein, carbs, and fats per serving) referenced directly from the FNRI-DOST Philippine food database.</Text>
          </View>
        </View>

        {/* About Us Link */}
        <TouchableOpacity
          onPress={() => router.push('/about')}
          className="bg-white rounded-2xl p-4 flex-row items-center border border-orange-200/50 shadow-sm mb-3"
        >
          <View className="w-10 h-10 rounded-full bg-[#ea580c]/10 items-center justify-center mr-4">
            <Users size={20} color="#ea580c" />
          </View>
          <Text className="flex-1 text-gray-900 font-semibold">About Us</Text>
        </TouchableOpacity>

        {/* Terms Link */}
        <TouchableOpacity
          onPress={() => router.push('/terms')}
          className="bg-white rounded-2xl p-4 flex-row items-center border border-orange-200/50 shadow-sm mb-8"
        >
          <View className="w-10 h-10 rounded-full bg-[#ea580c]/10 items-center justify-center mr-4">
            <BookOpen size={20} color="#ea580c" />
          </View>
          <Text className="flex-1 text-gray-900 font-semibold">Terms of Service</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
