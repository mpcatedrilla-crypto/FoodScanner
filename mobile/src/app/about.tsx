import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, User, Code, Monitor, FileText } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function AboutScreen() {
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
        <View>
          <Text className="text-gray-900 text-xl font-bold">About Us</Text>
          <Text className="text-gray-500 text-xs">Meet the team behind this application</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-gray-900 text-3xl font-extrabold mb-2 mt-2">
          Our <Text className="text-[#ea580c]">Creators</Text>
        </Text>
        <Text className="text-gray-600 text-sm leading-6 mb-6">
          We are a team of passionate Computer Science students who came together to create this offline AR food scanner. Each of us plays an important role in making this project possible.
        </Text>

        {/* Marck Angel Catedrilla */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-orange-200/50 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mr-4">
              <Image source={require("../../assets/creators/creator_0.png")} style={{width: 56, height: 56, borderRadius: 28}} contentFit="cover" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold">Marck Angel Catedrilla</Text>
              <View className="flex-row items-center bg-[#ea580c]/10 px-2 py-1 rounded-md self-start mt-1">
                <Code size={12} color="#ea580c" />
                <Text className="text-[#ea580c] text-[11px] font-bold ml-1">Main Programmer</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            3rd year Computer Science student and the main programmer. Passionate about mobile architecture, offline on-device machine learning, and turning conceptual ideas into efficient, working software.
          </Text>
        </View>

        {/* Joiamae Ruma */}
        <View className="bg-white rounded-2xl p-5 mb-4 border border-orange-200/50 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mr-4">
              <Image source={require("../../assets/creators/creator_1.png")} style={{width: 56, height: 56, borderRadius: 28}} contentFit="cover" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold">Joiamae Ruma</Text>
              <View className="flex-row items-center bg-[#ea580c]/10 px-2 py-1 rounded-md self-start mt-1">
                <Monitor size={12} color="#ea580c" />
                <Text className="text-[#ea580c] text-[11px] font-bold ml-1">System Developer</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            3rd year Computer Science student and system developer. Focused on UI/UX flow, user interaction design, and feature integration to ensure seamless and intuitive operation.
          </Text>
        </View>

        {/* Anna Angelika Arandia */}
        <View className="bg-white rounded-2xl p-5 mb-8 border border-orange-200/50 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center mr-4">
              <Image source={require("../../assets/creators/creator_2.png")} style={{width: 56, height: 56, borderRadius: 28}} contentFit="cover" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold">Anna Angelika Arandia</Text>
              <View className="flex-row items-center bg-[#ea580c]/10 px-2 py-1 rounded-md self-start mt-1">
                <FileText size={12} color="#ea580c" />
                <Text className="text-[#ea580c] text-[11px] font-bold ml-1">Thesis Support</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            Software engineering thesis researcher and documentation specialist. Contributed to research methodology, data validation, and project standardization.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}