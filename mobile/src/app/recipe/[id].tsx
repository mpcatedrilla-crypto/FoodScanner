import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, BackHandler, Vibration } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, Users, ChefHat, Play, Pause, TimerReset, Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
 handleNotification: async () => ({
 shouldShowAlert: true,
 shouldPlaySound: true,
 shouldSetBadge: false,
 shouldShowBanner: true,
 shouldShowList: true,
 }),
});

import { getRecipeById, addRecipeHistory } from '../../lib/actions';
import type { RecipeWithIngredients } from '../../lib/types';
import { useAuth } from '../../lib/auth-context';
import { RecipeImages } from '../../lib/imageMap';

function TimerBox({ minutes }: { minutes: number }) {
 const [timeLeft, setTimeLeft] = useState(minutes * 60);
 const [isActive, setIsActive] = useState(false);
 const [notifId, setNotifId] = useState<string | null>(null);
 const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
 <View className="flex-row items-center justify-between border-t border-orange-200 pt-4 mt-4">
 <View className="flex-row items-center">
 <Clock size={24} color={isActive ? "#ea580c" : "#71717a"} />
 <View className="ml-3">
 <Text className="text-stone-500 text-xs">Timer</Text>
 <Text className="text-stone-900 text-lg font-bold font-mono tracking-widest">{timeString}</Text>
 <Text className="text-gray-500 text-[10px]">({minutes} minutes)</Text>
 </View>
 </View>
 
 <View className="flex-row space-x-2">
 {timeLeft < minutes * 60 && !isActive && (
 <TouchableOpacity onPress={resetTimer} className="bg-gray-800 p-3 rounded-full items-center justify-center">
 <TimerReset size={16} color="#ea580c" />
 </TouchableOpacity>
 )}
 <TouchableOpacity 
 onPress={toggleTimer} 
 className={`flex-row items-center px-6 py-3 rounded-full ${isActive ? 'bg-amber-500' : 'bg-[#ea580c]'}`}
 >
 {isActive ? <Pause size={16} color="#ea580c" fill="white" /> : <Play size={16} color="#ea580c" fill="white" />}
 <Text className="text-stone-900 font-bold ml-2">{isActive ? 'Pause' : 'Start'}</Text>
 </TouchableOpacity>
 </View>
 </View>
 );
}

export default function CookModeScreen() {
 const { id, from, scanned } = useLocalSearchParams<{ id: string, from?: string, scanned?: string }>();
 const { session } = useAuth();
 const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
 const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
 const [loading, setLoading] = useState(true);
 const [activeStep, setActiveStep] = useState(1);

 useEffect(() => {
 const initStorage = async () => {
 try {
 const stored = await AsyncStorage.getItem(`recipe_checks_${id}`);
 let initialSet = new Set<string>();
 
 if (stored) {
 initialSet = new Set(JSON.parse(stored));
 }
 
 if (scanned) {
 const scannedIds = scanned.split(',');
 scannedIds.forEach(scannedId => initialSet.add(scannedId));
 await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...initialSet]));
 }
 
 setCheckedIngredients(initialSet);
 } catch (e) {}
 };
 initStorage();
 }, [id, scanned]);

 const uniqueIngredients = useMemo(() => {
 if (!recipe?.recipe_ingredients) return [];
 const seen = new Set<string>();
 return recipe.recipe_ingredients.filter(ri => {
 const ingId = ri.ingredient?.id;
 if (!ingId || seen.has(ingId)) return false;
 seen.add(ingId);
 return true;
 });
 }, [recipe?.recipe_ingredients]);

 const toggleIngredient = async (ingId: string) => {
 const next = new Set(checkedIngredients);
 if (next.has(ingId)) next.delete(ingId);
 else next.add(ingId);
 setCheckedIngredients(next);
 await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...next]));
 };

 const toggleAll = async () => {
 if (!recipe) return;
 if (checkedIngredients.size === uniqueIngredients.length) {
 setCheckedIngredients(new Set());
 await AsyncStorage.removeItem(`recipe_checks_${id}`);
 } else {
 const allIds = uniqueIngredients.map(r => r.ingredient?.id).filter(Boolean) as string[];
 const next = new Set(allIds);
 setCheckedIngredients(next);
 await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...next]));
 }
 };

 const handleBack = () => {
 if (from && from !== 'index') {
 router.navigate((`/${from}`) as any);
 } else {
 router.navigate('/');
 }
 return true;
 };

 const handleComplete = async () => {
 if (session?.user && id) {
 await addRecipeHistory(session.user.id, id as string);
 }
 await AsyncStorage.removeItem(`recipe_checks_${id}`);
 setCheckedIngredients(new Set());
 setActiveStep(1);
 handleBack();
 };

 useFocusEffect(
 React.useCallback(() => {
 const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
 return () => sub.remove();
 }, [from])
 );
 
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
 <View className="flex-1 bg-[#FFF9F2] justify-center items-center">
 <ActivityIndicator size="large" color="#ea580c" />
 </View>
 );
 }

 if (!recipe) {
 return (
 <View className="flex-1 bg-[#FFF9F2] justify-center items-center px-6">
 <Text className="text-stone-900 text-lg mb-4">Recipe not found</Text>
 <TouchableOpacity className="px-6 py-3 bg-[#ea580c] rounded-full" onPress={() => handleBack()}>
 <Text className="text-stone-900 font-bold">Go Back</Text>
 </TouchableOpacity>
 </View>
 );
 }

 // Parse instructions with fallback for old format
 let parsedInstructions = recipe.instructions || [];
 if (typeof parsedInstructions === 'string') {
 try { parsedInstructions = JSON.parse(parsedInstructions); } catch(e) { parsedInstructions = []; }
 }
 if (!Array.isArray(parsedInstructions)) parsedInstructions = [];

 const steps = parsedInstructions.map((s: any) => {
 // If the db update hasn't propagated, we fallback
 let title = s?.title;
 if (!title && s?.text) {
 title = s.text.split('.')[0];
 } else if (!title) {
 title = `Step ${s?.step || ''}`;
 }
 let timer = s?.timer_minutes;
 if (!timer && s?.timer && s.timer > 0) {
 timer = Math.round(s.timer / 60);
 if (timer < 1) timer = 1;
 }
 if (!timer && s?.text) {
 const match = s.text.match(/(\d+)\s*min/i) || s.text.match(/(\d+)\s*to\s*\d+\s*min/i);
 if (match) timer = parseInt(match[1], 10);
 }
 return { ...s, title, timer_minutes: timer };
 });

 return (
 <SafeAreaView edges={['top']} className="flex-1 bg-[#FFF9F2]">
 {/* Header */}
 <View className="flex-row items-center px-6 py-4">
 <TouchableOpacity onPress={() => handleBack()} className="w-10 h-10 bg-white rounded-full items-center justify-center mr-4">
 <ArrowLeft size={20} color="#ea580c" />
 </TouchableOpacity>
 <View>
 <Text className="text-stone-900 text-xl font-bold">Cook Mode</Text>
 <Text className="text-stone-500 text-xs">Follow the steps and cook with confidence</Text>
 </View>
 </View>

 <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
 {/* Recipe Hero Card */}
 <View className="bg-white rounded-3xl overflow-hidden mb-6 border border-orange-100 pb-5">
 <View className="relative h-48 w-full">
 <Image 
 source={RecipeImages[recipe.id] || { uri: recipe.image_url || 'https://placehold.co/600x400/ea580c/ffffff.png' }} 
 style={{ width: '100%', height: '100%', opacity: 0.8 }} 
 contentFit="cover" 
 />
 <View className="absolute top-4 left-4 bg-orange-100 rounded-full px-3 py-1.5 flex-row items-center border border-orange-200">
 <ChefHat size={12} color="#ea580c" className="mr-1.5" />
 <Text className="text-[#ea580c] text-xs font-bold">Filipino Recipe</Text>
 </View>
 
 {/* Gradient overlay at bottom of image */}
 <View className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-white to-transparent" />
 </View>
 
 <View className="px-5 pt-2">
 <Text className="text-stone-900 text-2xl font-bold mb-2 shadow-sm">{recipe.name}</Text>
 <Text className="text-stone-600 text-sm leading-relaxed mb-5">
 {recipe.description || 'A classic Filipino dish with tender ingredients in a savory, tangy sauce.'}
 </Text>
 
 <View className="flex-row items-center justify-between border-t border-orange-200 pt-4">
 <View className="flex-row items-center">
 <Text className="text-stone-600 text-xs font-medium">Prep: 15 mins</Text>
 </View>
 <View className="w-[1px] h-4 bg-white/10" />
 <View className="flex-row items-center">
 <Text className="text-stone-600 text-xs font-medium">Cook: {recipe.cooking_time_minutes || 30} mins</Text>
 </View>
 <View className="w-[1px] h-4 bg-white/10" />
 <View className="flex-row items-center">
 <Text className="text-stone-600 text-xs font-medium">Serves: {recipe.servings || 4}</Text>
 </View>
 </View>

 {/* Nutrition Row */}
 {recipe.calories_per_serving && (
 <View className="flex-row justify-between mt-4 bg-orange-50 rounded-xl p-3 border border-orange-100">
 <View className="items-center">
 <Text className="text-stone-500 text-[10px] uppercase mb-1">Calories</Text>
 <Text className="text-[#ea580c] text-sm font-bold">{recipe.calories_per_serving}</Text>
 </View>
 <View className="items-center">
 <Text className="text-stone-500 text-[10px] uppercase mb-1">Protein</Text>
 <Text className="text-stone-700 text-sm font-bold">{recipe.protein_per_serving}g</Text>
 </View>
 <View className="items-center">
 <Text className="text-stone-500 text-[10px] uppercase mb-1">Carbs</Text>
 <Text className="text-stone-700 text-sm font-bold">{recipe.carbs_per_serving}g</Text>
 </View>
 <View className="items-center">
 <Text className="text-stone-500 text-[10px] uppercase mb-1">Fats</Text>
 <Text className="text-stone-700 text-sm font-bold">{recipe.fats_per_serving}g</Text>
 </View>
 </View>
 )}
 </View>
 </View>

 {/* Ingredients List */}
 {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
 <View className="mb-8 px-2">
 <View className="flex-row justify-between items-center mb-4">
 <Text className="text-stone-900 text-xl font-bold">Ingredients</Text>
 <TouchableOpacity onPress={toggleAll} className="flex-row items-center bg-[#ea580c]/10 px-3 py-1.5 rounded-full border border-[#ea580c]/30">
 <Check size={14} color="#ea580c" className="mr-1.5" />
 <Text className="text-[#ea580c] text-xs font-bold">Check All</Text>
 </TouchableOpacity>
 </View>
 <View className="bg-white rounded-xl overflow-hidden border border-orange-100">
 {uniqueIngredients.map((ri: any, idx: number) => {
 const ingId = ri.ingredient?.id;
 const isChecked = checkedIngredients.has(ingId);
 const isLast = idx === uniqueIngredients.length - 1;
 
 return (
 <TouchableOpacity 
 key={idx} 
 onPress={() => toggleIngredient(ingId)}
 className={`flex-row items-center py-4 px-4 ${!isLast ? 'border-b border-orange-100' : ''}`}
 activeOpacity={0.7}
 >
 <View className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${isChecked ? 'bg-[#ea580c] border-[#ea580c]' : 'border-gray-500'}`}>
 {isChecked && <Check size={12} color="white" />}
 </View>
 <Text className={`flex-1 text-base ${isChecked ? 'text-gray-500 line-through' : 'text-stone-800'}`}>
 {ri.ingredient?.name}
 </Text>
 <Text className="text-gray-500 text-sm ml-2">to taste</Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
 )}



 </ScrollView>
 </SafeAreaView>
 );
}


