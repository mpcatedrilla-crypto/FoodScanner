import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, BackHandler, Vibration } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Users, ChefHat, Play, Pause, TimerReset } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

import { getRecipeById, addRecipeHistory } from '../../lib/actions';
import type { RecipeWithIngredients } from '../../lib/types';
import { useBookmarks } from '../../lib/bookmark-context';
import { useAuth } from '../../lib/auth-context';

function TimerBox({ minutes }: { minutes: number }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [notifId, setNotifId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (isActive) {
        setIsActive(false);
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
        Alert.alert("Time's up!", "Your step is complete.");
      }
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = async () => {
    if (!isActive) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time's up! \uD83D\uDC68\u200D\uD83C\uDF73",
          body: 'Your recipe step is complete.',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: timeLeft > 0 ? timeLeft : 1 },
      });
      setNotifId(id);
    } else if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      setNotifId(null);
    }
    setIsActive(!isActive);
  };

  const resetTimer = async () => {
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      setNotifId(null);
    }
    setIsActive(false);
    setTimeLeft(minutes * 60);
  };

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  return (
    <View className="flex-row items-center justify-between border-t border-white/10 pt-4 mt-4">
      <View className="flex-row items-center">
        <Clock size={24} color={isActive ? "#0fa958" : "#71717a"} />
        <View className="ml-3">
          <Text className="text-gray-400 text-xs">Timer</Text>
          <Text className="text-white text-lg font-bold font-mono tracking-widest">{timeString}</Text>
          <Text className="text-gray-500 text-[10px]">({minutes} minutes)</Text>
        </View>
      </View>
      
      <View className="flex-row space-x-2">
        {timeLeft < minutes * 60 && !isActive && (
          <TouchableOpacity onPress={resetTimer} className="bg-gray-800 p-3 rounded-full items-center justify-center">
            <TimerReset size={16} color="white" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          onPress={toggleTimer} 
          className={`flex-row items-center px-6 py-3 rounded-full ${isActive ? 'bg-amber-500' : 'bg-[#0fa958]'}`}
        >
          {isActive ? <Pause size={16} color="white" fill="white" /> : <Play size={16} color="white" fill="white" />}
          <Text className="text-white font-bold ml-2">{isActive ? 'Pause' : 'Start'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CookModeScreen() {
  const { id, from } = useLocalSearchParams<{ id: string, from?: string }>();
  const { session } = useAuth();

  const handleBack = () => {
    if (from) {
      router.navigate(`/${from}`);
    } else {
      router.navigate('/');
    }
    return true;
  };

  const handleComplete = async () => {
    if (session?.user && id) {
      await addRecipeHistory(session.user.id, id as string);
    }
    setActiveStep(1);
    handleBack();
  };

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => sub.remove();
    }, [from])
  );
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  useFocusEffect(
    React.useCallback(() => {
      setActiveStep(1);
    }, [id])
  );
  
  useEffect(() => {
    if (id) {
      getRecipeById(id).then(data => {
        setRecipe(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#09090b] justify-center items-center">
        <ActivityIndicator size="large" color="#0fa958" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View className="flex-1 bg-[#09090b] justify-center items-center px-6">
        <Text className="text-white text-lg mb-4">Recipe not found</Text>
        <TouchableOpacity className="px-6 py-3 bg-[#0fa958] rounded-full" onPress={() => handleBack()}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Parse instructions with fallback for old format
  const steps = (recipe.instructions || []).map((s: any) => {
    // If the db update hasn't propagated, we fallback
    let title = s.title;
    if (!title) {
      title = s.text.split('.')[0];
    }
    let timer = s.timer_minutes;
    if (!timer) {
      const match = s.text.match(/(\d+)\s*min/i) || s.text.match(/(\d+)\s*to\s*\d+\s*min/i);
      if (match) timer = parseInt(match[1], 10);
    }
    return { ...s, title, timer_minutes: timer };
  });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => handleBack()} className="w-10 h-10 bg-[#1c1c1e] rounded-full items-center justify-center mr-4">
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <View>
          <Text className="text-white text-xl font-bold">Cook Mode</Text>
          <Text className="text-gray-400 text-xs">Follow the steps and cook with confidence</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Recipe Hero Card */}
        <View className="bg-[#1c1c1e] rounded-3xl overflow-hidden mb-6 border border-white/5 pb-5">
          <View className="relative h-48 w-full">
            <Image 
              source={{ uri: recipe.image_url || 'https://placehold.co/600x400/0fa958/ffffff.png' }} 
              style={{ width: '100%', height: '100%', opacity: 0.8 }} 
              contentFit="cover" 
            />
            <View className="absolute top-4 left-4 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center border border-white/10">
              <ChefHat size={12} color="white" className="mr-1.5" />
              <Text className="text-white text-xs font-medium">Filipino Recipe</Text>
            </View>
            <View className="absolute top-4 right-4 bg-black/60 rounded-full px-3 py-1.5 border border-white/10">
              <Text className="text-white text-xs font-medium">1 / {steps.length}</Text>
            </View>
            {/* Gradient overlay at bottom of image */}
            <View className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-[#1c1c1e] to-transparent" />
          </View>
          
          <View className="px-5 -mt-6">
            <Text className="text-white text-2xl font-bold mb-2 shadow-sm">{recipe.name}</Text>
            <Text className="text-gray-300 text-sm leading-relaxed mb-5">
              {recipe.description || 'A classic Filipino dish with tender ingredients in a savory, tangy sauce.'}
            </Text>
            
            <View className="flex-row items-center justify-between border-t border-white/10 pt-4">
              <View className="flex-row items-center">
                <Clock size={14} color="#71717a" className="mr-1.5" />
                <Text className="text-gray-300 text-xs font-medium">Prep: 15 mins</Text>
              </View>
              <View className="w-[1px] h-4 bg-white/10" />
              <View className="flex-row items-center">
                <ChefHat size={14} color="#71717a" className="mr-1.5" />
                <Text className="text-gray-300 text-xs font-medium">Cook: {recipe.cooking_time_minutes || 30} mins</Text>
              </View>
              <View className="w-[1px] h-4 bg-white/10" />
              <View className="flex-row items-center">
                <Users size={14} color="#71717a" className="mr-1.5" />
                <Text className="text-gray-300 text-xs font-medium">Serves: {recipe.servings || 4}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-end mb-4 px-2">
          <Text className="text-white text-xl font-bold">Cooking Steps</Text>
          <Text className="text-[#0fa958] text-xs font-medium">Swipe to navigate &lt; &gt;</Text>
        </View>

        {/* Steps List */}
        <View className="pb-10">
          {steps.map((step: any, index: number) => {
            const isActive = activeStep === step.step;
            const isCompleted = step.step < activeStep;
            
            return (
              <TouchableOpacity 
                key={step.step}
                activeOpacity={0.9}
                onPress={() => setActiveStep(step.step)}
                className={`mb-4 rounded-3xl p-5 border ${isActive ? 'bg-[#1c1c1e] border-white/10 shadow-lg' : 'bg-[#09090b] border-white/5 opacity-60'}`}
              >
                <View className="flex-row mb-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 mt-1 ${isActive ? 'bg-[#0fa958]' : 'bg-gray-800'}`}>
                    {isCompleted ? (
                      <Text className="text-white font-bold">✓</Text>
                    ) : (
                      <Text className={`font-bold ${isActive ? 'text-white text-lg' : 'text-gray-400'}`}>{step.step}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-lg mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>{step.title}</Text>
                    <Text className={`text-sm leading-relaxed ${isActive ? 'text-gray-300' : 'text-gray-500'}`}>
                      {step.text}
                    </Text>
                  </View>
                </View>

                {isActive && (
                  <View className="mt-2">
                    {step.timer_minutes ? (
                      <TimerBox minutes={step.timer_minutes} />
                    ) : (
                      <View className="border-t border-white/10 pt-4 mt-2" />
                    )}
                    
                    {index < steps.length - 1 ? (
                      <TouchableOpacity 
                        onPress={() => setActiveStep(step.step + 1)}
                        className="mt-4 bg-[#1c1c1e] border border-[#0fa958]/50 py-3 rounded-xl items-center"
                      >
                        <Text className="text-[#0fa958] font-bold">Next Step</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        onPress={handleComplete}
                        className="mt-4 bg-[#0fa958]/20 border border-[#0fa958] py-3 rounded-xl items-center"
                      >
                        <Text className="text-[#0fa958] font-bold">Recipe Complete!</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
