import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function TermsScreen() {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.navigate('/help');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [])
  );

  const handleBack = () => {
    router.navigate('/help');
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#FFF9F2]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-orange-200/40">
        <TouchableOpacity onPress={handleBack} className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-4">
          <ArrowLeft size={20} color="#ea580c" />
        </TouchableOpacity>
        <Text className="text-gray-900 text-xl font-bold">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-700 text-base leading-6 mb-4">
          Welcome to FoodScanner! By using this application, you agree to these Terms of Service. This application was developed for an academic computer science thesis project.
        </Text>

        <Text className="text-gray-900 font-bold text-lg mt-4 mb-2">1. Use of the App</Text>
        <Text className="text-gray-600 text-sm leading-5 mb-4">
          This application utilizes on-device computer vision to detect raw food ingredients offline. The recipes and nutritional information provided are suggestions and reference estimates. Users should always exercise personal judgement regarding food safety, allergens, and dietary restrictions.
        </Text>

        <Text className="text-gray-900 font-bold text-lg mt-4 mb-2">2. Offline Privacy & Data</Text>
        <Text className="text-gray-600 text-sm leading-5 mb-4">
          All image recognition is processed locally on your device without transmitting camera frames to external cloud servers. Your personal information and meal history remain private on your device.
        </Text>

        <Text className="text-gray-900 font-bold text-lg mt-4 mb-2">3. Intellectual Property</Text>
        <Text className="text-gray-600 text-sm leading-5 mb-8">
          The machine learning models, UI assets, and application software are created by the development team under academic license. Nutritional reference standards are derived from FNRI-DOST guidelines.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}