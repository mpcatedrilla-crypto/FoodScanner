import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function TermsScreen() {
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
        <Text className="text-white text-xl font-bold">Terms of Service</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-300 text-base leading-6 mb-4">
          Welcome to FoodScanner! By using this application, you agree to these Terms of Service. This application is developed for a university thesis project and is provided "as is".
        </Text>
        
        <Text className="text-white font-bold text-lg mt-4 mb-2">1. Use of the App</Text>
        <Text className="text-gray-400 text-sm leading-5 mb-4">
          This application utilizes device cameras and object detection AI to recognize food ingredients. Accuracy may vary based on lighting and image quality. The provided recipes are suggestions and you should exercise your own judgement regarding food safety, allergens, and dietary restrictions.
        </Text>

        <Text className="text-white font-bold text-lg mt-4 mb-2">2. Data Privacy</Text>
        <Text className="text-gray-400 text-sm leading-5 mb-4">
          We collect basic usage analytics and scan history to evaluate the AI model's performance for our thesis research. Your personal information will not be sold to third parties. Images processed by the AI may be logged anonymously to improve accuracy.
        </Text>

        <Text className="text-white font-bold text-lg mt-4 mb-2">3. User Accounts</Text>
        <Text className="text-gray-400 text-sm leading-5 mb-8">
          You are responsible for safeguarding the password that you use to access the service. We reserve the right to suspend or terminate accounts that violate these terms or attempt to abuse the database or AI inference endpoints.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}