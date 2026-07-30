import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Camera, Sparkles } from 'lucide-react-native';

export function HeroSection() {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View className="relative flex-[0.35] min-h-[220px] flex-col justify-end overflow-hidden">
      {/* Background image */}
      <View className="absolute inset-0">
        <Image
          source={require('../../../assets/images/hero-new.jpg')}
          style={[
            StyleSheet.absoluteFill,
            { opacity: imageLoaded ? 1 : 0 }
          ]}
          contentFit="cover"
          onLoad={() => setImageLoaded(true)}
        />
        {/* Gradient overlay - simplified for RN */}
        <View className="absolute inset-0 bg-black/40" />
      </View>

      {/* Content */}
      <View className="relative z-10 px-6 pb-6 pt-12">
        {/* Heading */}
        <Text className="text-3xl font-bold tracking-tight text-white mb-1">
          Scan ingredients,
          {'\n'}
          discover <Text className="text-[#0fa958]">Filipino</Text>
          {'\n'}
          <Text className="text-[#0fa958]">recipes.</Text>
        </Text>

        {/* Subheading */}
        <Text className="text-white/80 text-sm leading-relaxed mb-4 max-w-sm">
          Point your camera at ingredients and instantly find authentic Filipino recipes you can cook.
        </Text>

        {/* CTA Button */}
        <Link href="/scan" asChild>
          <TouchableOpacity className="flex-row items-center justify-center gap-3 w-[200px] py-3 rounded-full bg-primary shadow-lg shadow-primary/25 active:scale-[0.98]">
            <Camera size={20} color="white" />
            <Text className="text-primary-foreground font-semibold text-base">Start Scanning</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
