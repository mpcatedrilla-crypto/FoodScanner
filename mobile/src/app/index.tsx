import React, { useEffect, useState } from 'react';
import { View, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HeroSection } from '../components/home/hero-section';
import { FeaturedRecipes } from '../components/home/featured-recipes';
import { HowItWorks } from '../components/home/how-it-works';
import { BottomBanner } from '../components/home/bottom-banner';
import { Onboarding } from '../components/onboarding';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@has_seen_onboarding').then(val => {
      if (!val) setShowOnboarding(true);
      setIsReady(true);
    });
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@has_seen_onboarding', 'true');
    setShowOnboarding(false);
  };

  const loadRecipes = async () => {
    const data = await getRecipes();
    setRecipes(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  if (!isReady) return null;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} className="flex-1 bg-black">
        <View className="flex-1 flex-col justify-between pb-2 bg-background">
        <HeroSection />
        <FeaturedRecipes recipes={recipes} />
        <HowItWorks />
        <BottomBanner />
      </View>
    </SafeAreaView>
    </>
  );
}
