import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, User, Code, Monitor, FileText } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';

export default function AboutScreen() {
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
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.navigate('/profile')} className="w-10 h-10 bg-[#1c1c1e] rounded-full items-center justify-center mr-4">
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">About Us</Text>
          <Text className="text-gray-400 text-xs">Meet the team behind this application</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-3xl font-extrabold mb-4 mt-2">
          Our <Text className="text-[#0fa958]">Creators</Text>
        </Text>
        <Text className="text-gray-300 text-sm leading-6 mb-8">
          We are a team of passionate students who came together to create this application. Each of us plays an important role in making this project possible.
        </Text>

        {/* Marck */}
        <View className="bg-[#1c1c1e] rounded-2xl p-5 mb-4 border border-white/5">
          <View className="flex-row items-center mb-3">
            <View className="w-16 h-16 rounded-full bg-gray-800 items-center justify-center mr-4">
              <User size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Marck Angel Catedrilla</Text>
              <View className="flex-row items-center bg-[#0fa958]/20 px-2 py-1 rounded-md self-start mt-1">
                <Code size={12} color="#0fa958" className="mr-1" />
                <Text className="text-[#0fa958] text-[10px] font-bold">Main Programmer</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-400 text-sm leading-5">
            I am a 3rd year Computer Science student and the main programmer of this application. I enjoy developing and coding applications. For me, programming is not just a school requirement, but also a hobby and a way to turn ideas into real solutions.
          </Text>
        </View>

        {/* Joiamae */}
        <View className="bg-[#1c1c1e] rounded-2xl p-5 mb-4 border border-white/5">
          <View className="flex-row items-center mb-3">
            <View className="w-16 h-16 rounded-full bg-gray-800 items-center justify-center mr-4">
              <User size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Joiamae Ruma</Text>
              <View className="flex-row items-center bg-[#0fa958]/20 px-2 py-1 rounded-md self-start mt-1">
                <Monitor size={12} color="#0fa958" className="mr-1" />
                <Text className="text-[#0fa958] text-[10px] font-bold">System Developer</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-400 text-sm leading-5">
            I am also a 3rd year Computer Science student and the one who developed this system. I focused on turning our ideas into a functional and user-friendly application. I worked on the system design, features, and implementation to make sure everything works smoothly and efficiently.
          </Text>
        </View>

        {/* Anna */}
        <View className="bg-[#1c1c1e] rounded-2xl p-5 mb-8 border border-white/5">
          <View className="flex-row items-center mb-3">
            <View className="w-16 h-16 rounded-full bg-gray-800 items-center justify-center mr-4">
              <User size={30} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Anna Angelika Arandia</Text>
              <View className="flex-row items-center bg-[#0fa958]/20 px-2 py-1 rounded-md self-start mt-1">
                <FileText size={12} color="#0fa958" className="mr-1" />
                <Text className="text-[#0fa958] text-[10px] font-bold">Thesis Support</Text>
              </View>
            </View>
          </View>
          <Text className="text-gray-400 text-sm leading-5">
            I helped our team by working on the software engineering thesis papers. I contributed to the research, documentation, and organization of our findings, making sure that our project is well-documented and follows the proper format and standards.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}