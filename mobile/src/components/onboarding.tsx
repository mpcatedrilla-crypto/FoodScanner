import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Camera, Search, CookingPot } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  return (
    <View className="absolute inset-0 z-50 bg-background">
      <View className="flex-1 items-center pt-24 px-8">
        <View className="w-full h-[300px] bg-[#e6f4ea] rounded-[40px] items-center justify-center mb-12 shadow-sm border border-[#0fa958]/10 overflow-hidden">
            <Image 
              source="https://images.unsplash.com/photo-1556909211-36987daf1b95?q=80&w=1000&auto=format&fit=crop" 
              className="absolute inset-0 w-full h-full opacity-30"
              contentFit="cover"
            />
            <View className="flex-row gap-6">
                <View className="w-16 h-16 rounded-2xl bg-white shadow-xl items-center justify-center -rotate-12">
                  <Camera size={28} color="#0fa958" />
                </View>
                <View className="w-16 h-16 rounded-2xl bg-[#0fa958] shadow-xl items-center justify-center -translate-y-8">
                  <Search size={28} color="white" />
                </View>
                <View className="w-16 h-16 rounded-2xl bg-white shadow-xl items-center justify-center rotate-12">
                  <CookingPot size={28} color="#0fa958" />
                </View>
            </View>
        </View>

        <Text className="text-3xl font-extrabold text-foreground text-center mb-4 leading-tight">
          Turn Ingredients{'\n'}Into <Text className="text-[#0fa958]">Masterpieces</Text>
        </Text>
        
        <Text className="text-lg text-muted-foreground text-center mb-12 px-4 leading-relaxed">
          Simply scan whatever is in your fridge, and our AI will instantly suggest authentic Filipino recipes you can cook right now.
        </Text>

        <TouchableOpacity 
          onPress={onComplete}
          className="w-full bg-[#0fa958] py-4 rounded-2xl items-center shadow-lg shadow-[#0fa958]/30 mt-auto mb-12"
        >
          <Text className="text-white font-bold text-lg">Let's Get Cooking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
