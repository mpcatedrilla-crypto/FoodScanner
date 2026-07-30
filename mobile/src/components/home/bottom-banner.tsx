import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';

export function BottomBanner() {
  return (
    <View className="px-6 py-2 pb-4">
      <View className="flex-row items-center bg-[#f0f9f4] rounded-2xl p-4 border border-[#e6f4ea] shadow-sm">
        {/* Left Image (Vegetables) */}
        <View className="w-20 h-20 rounded-full overflow-hidden mr-4 bg-white items-center justify-center -ml-8 border-4 border-white shadow-sm">
          <Image
            source={require('../../../assets/images/banner-new.png')}
            style={{ width: '120%', height: '120%' }}
            contentFit="cover"
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-[#0fa958] mb-1 leading-tight">
            Discover the taste of home.
          </Text>
          <Text className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Explore authentic Filipino recipes made easy for you.
          </Text>
          
          <Link href="/recipes" asChild>
            <TouchableOpacity className="bg-[#0fa958] py-2 px-4 rounded-xl self-start">
              <Text className="text-white font-bold text-xs">Explore Recipes</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
