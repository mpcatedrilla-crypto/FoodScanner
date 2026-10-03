import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WifiOff } from 'lucide-react-native';

interface NoInternetScreenProps {
  onRetry: () => void;
}

export function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  return (
    <View className="flex-1 bg-[#FFF9F2] justify-center items-center px-6">
      <View className="w-20 h-20 bg-orange-100 rounded-full items-center justify-center mb-6 border border-orange-200">
        <WifiOff size={40} color="#ea580c" />
      </View>
      <Text className="text-gray-900 text-2xl font-extrabold text-center mb-2">No Internet Connection</Text>
      <Text className="text-gray-600 text-center mb-8">
        FoodScanner requires an internet connection to work. Please check your WiFi or mobile data and try again.
      </Text>
      <TouchableOpacity
        className="bg-[#ea580c] rounded-full py-4 px-12 items-center justify-center shadow-sm"
        onPress={onRetry}
      >
        <Text className="text-white font-bold text-base">Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
