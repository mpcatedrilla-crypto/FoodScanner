import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, TextInput } from 'react-native';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import type { Camera } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flashlight, FlashlightOff, SwitchCamera, ChefHat, RefreshCcw, Save, Plus } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';

import { RecipeResultsDrawer } from '../components/scanner/recipe-results-drawer';
import { getIngredients, findMatchingRecipes } from '../lib/actions';
import { detectIngredients } from '../services/roboflow';
import type { Ingredient, RecipeMatch } from '../lib/types';
import type { RoboflowPrediction } from '../services/roboflow';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<Camera>(null);

  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        setIsLiveScanning(false);
      };
    }, [])
  );

  const [torch, setTorch] = useState(false);
  const toggleTorch = () => { if (device?.hasTorch) setTorch(prev => !prev); };

  const [ingredientsDB, setIngredientsDB] = useState<Ingredient[]>([]);
  useEffect(() => { getIngredients().then(setIngredientsDB); }, []);

  const [isLiveScanning, setIsLiveScanning] = useState(true);
  const [predictions, setPredictions] = useState<RoboflowPrediction[]>([]);
  const [matchedIngredients, setMatchedIngredients] = useState<Ingredient[]>([]);
  const [rawImageSize, setRawImageSize] = useState({ w: 640, h: 480 });
  
  // To show in the Results UI
  const [frozenImageUri, setFrozenImageUri] = useState<string | null>(null);
  const [showResultsUi, setShowResultsUi] = useState(false);

  // Recipe Drawer
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Manual Add
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');

  const processLiveFrame = async () => {
    if (!isLiveScanning || !cameraRef.current || !isFocused) return;
    try {
      const photo = await cameraRef.current.takeSnapshot({ quality: 80 });
      let rawPath = photo.path || photo.uri || photo.url;
      if (!rawPath && typeof photo.saveToTemporaryFileAsync === 'function') {
         let tempFile = await photo.saveToTemporaryFileAsync('jpg', 80).catch(() => null);
         if (tempFile) rawPath = tempFile.path || tempFile.uri || tempFile;
      }
      if (!rawPath) return;
      const fileUri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;

      const manipResult = await manipulateAsync(fileUri, [{ resize: { width: 640 } }], {
        base64: true, format: SaveFormat.JPEG, compress: 0.6,
      });

      if (!manipResult.base64) return;
      const result = await detectIngredients(manipResult.base64);
      const preds = result.predictions ?? [];
      
      setPredictions(preds);
      setRawImageSize({ w: result.image?.width ?? photo.width, h: result.image?.height ?? photo.height });
      setFrozenImageUri(fileUri); // Save the latest snapshot just in case they click Review

      const currentMatched: Ingredient[] = [];
      for (const pred of preds) {
        const hit = ingredientsDB.find(ing =>
          ing.name.toLowerCase() === pred.class.toLowerCase() ||
          (ing.name_tagalog && ing.name_tagalog.toLowerCase() === pred.class.toLowerCase()) ||
          ing.coco_class?.toLowerCase() === pred.class.toLowerCase()
        );
        if (hit && !currentMatched.find(m => m.id === hit.id)) currentMatched.push(hit);
      }
      setMatchedIngredients(currentMatched);
    } catch (err) {
      console.log('Live frame drop:', err);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const loop = async () => {
      await processLiveFrame();
      timeoutId = setTimeout(loop, 400); 
    };
    if (isLiveScanning && isFocused && ingredientsDB.length > 0) loop();
    return () => clearTimeout(timeoutId);
  }, [isLiveScanning, isFocused, ingredientsDB]);

  const handleReviewIngredients = () => {
    setIsLiveScanning(false);
    setShowResultsUi(true);
  };

  const handleShowRecipes = async () => {
    setLoadingRecipes(true);
    const ids = matchedIngredients.map(i => i.id);
    const topRecipes = await findMatchingRecipes(ids);
    setRecipes(topRecipes);
    setLoadingRecipes(false);
    setIsDrawerOpen(true);
  };

  const resetScan = () => {
    setIsDrawerOpen(false);
    setShowResultsUi(false);
    setMatchedIngredients([]);
    setPredictions([]);
    setIsLiveScanning(true);
  };

  // Nutrition calculations for the UI
  let totalProtein = 0, totalCarbs = 0, totalFat = 0;
  matchedIngredients.forEach(i => {
    totalProtein += (i.protein_per_100g || 0);
    totalCarbs += (i.carbs_per_100g || 0);
    totalFat += (i.fats_per_100g || 0);
  });
  const totalMacros = totalProtein + totalCarbs + totalFat || 1;
  const pPct = ((totalProtein / totalMacros) * 100).toFixed(1);
  const cPct = ((totalCarbs / totalMacros) * 100).toFixed(1);
  const fPct = ((totalFat / totalMacros) * 100).toFixed(1);

  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Text className="text-white text-center mb-6 text-base">Camera access is required.</Text>
        <TouchableOpacity className="bg-[#0fa958] px-6 py-3 rounded-full" onPress={requestPermission}>
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) return <View className="flex-1 justify-center items-center bg-black"><ActivityIndicator size="large" color="#0fa958" /></View>;

  if (showResultsUi) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/10">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={resetScan} className="mr-3"><ArrowLeft size={24} color="white" /></TouchableOpacity>
            <Text className="text-white text-lg font-bold">RECOGNIZED INGREDIENTS</Text>
          </View>
          <View className="flex-row gap-4">
            <TouchableOpacity onPress={resetScan} className="items-center"><RefreshCcw size={20} color="white" /><Text className="text-[10px] text-white mt-1">rescan</Text></TouchableOpacity>
            <TouchableOpacity className="items-center"><Save size={20} color="white" /><Text className="text-[10px] text-white mt-1">save scan</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1">
          {/* Frozen Image with Bounding Boxes */}
          <View className="w-full h-64 bg-gray-900 overflow-hidden relative">
            {frozenImageUri && (
              <Image source={{ uri: frozenImageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            )}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {predictions.map((pred, idx) => {
                const scale = Math.max(SCREEN_W / rawImageSize.w, 256 / rawImageSize.h);
                const offsetX = (SCREEN_W - rawImageSize.w * scale) / 2;
                const offsetY = (256 - rawImageSize.h * scale) / 2;
                const left = (pred.x - pred.width / 2) * scale + offsetX;
                const top = (pred.y - pred.height / 2) * scale + offsetY;
                const width = pred.width * scale;
                const height = pred.height * scale;
                return (
                  <React.Fragment key={idx}>
                    <View style={[styles.bbox, { left, top, width, height, borderColor: 'white', borderWidth: 2 }]} />
                    <View style={{ position: 'absolute', backgroundColor: 'white', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, left: left, top: top - 24 }}>
                      <Text style={{ color: 'black', fontSize: 12, fontWeight: 'bold' }}>{pred.class}: {(pred.confidence * 100).toFixed(0)}%</Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          <View className="px-6 py-6">
            <Text className="text-white text-xl font-bold mb-4">Detected Ingredients</Text>
            {matchedIngredients.map(ing => (
              <View key={ing.id} className="bg-[#1c1c1e] rounded-xl p-3 flex-row items-center mb-3 border border-white/5">
                <Image source={{ uri: ing.image_url || 'https://placehold.co/100x100/0fa958/ffffff.png' }} className="w-16 h-16 rounded-lg mr-4 bg-gray-800" />
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">{ing.name}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">Confidence: 94%</Text>
                  <View className="mt-2 flex-row gap-3">
                    <Text className="text-gray-400 text-xs">Cal: {ing.calories_per_100g || 0}</Text>
                    <Text className="text-gray-400 text-xs">Fat: {ing.fats_per_100g || 0}g</Text>
                    <Text className="text-gray-400 text-xs">Carbs: {ing.carbs_per_100g || 0}g</Text>
                  </View>
                </View>
              </View>
            ))}

            <Text className="text-white text-xl font-bold mb-4 mt-4">Nutritional Summary</Text>
            <View className="bg-[#1c1c1e] rounded-xl p-4 flex-row items-center mb-6 border border-white/5">
               <View className="w-16 h-16 rounded-full border-[6px] border-[#0fa958] mr-6 items-center justify-center">
                  <View className="w-full h-full rounded-full border-[6px] border-[#3b82f6] absolute top-[-6px] left-[-6px] border-t-transparent border-r-transparent" style={{ transform: [{ rotate: '45deg' }] }} />
               </View>
               <View className="flex-1">
                  <View className="flex-row items-center mb-1"><View className="w-3 h-3 rounded-full bg-[#0fa958] mr-2"/><Text className="text-gray-300 text-sm">Protein: {pPct}%</Text></View>
                  <View className="flex-row items-center mb-1"><View className="w-3 h-3 rounded-full bg-[#3b82f6] mr-2"/><Text className="text-gray-300 text-sm">Carbs: {cPct}%</Text></View>
                  <View className="flex-row items-center mb-1"><View className="w-3 h-3 rounded-full bg-[#a855f7] mr-2"/><Text className="text-gray-300 text-sm">Fat: {fPct}%</Text></View>
               </View>
               <View className="flex-1"><Text className="text-gray-500 text-[10px]">Macronutrient breakdown for detected ingredients.</Text></View>
            </View>

            <TouchableOpacity 
              className="bg-[#0fa958] rounded-full py-4 items-center justify-center mb-4"
              onPress={handleShowRecipes}
              disabled={loadingRecipes}
            >
              {loadingRecipes ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-base">FIND MATCHING RECIPES</Text>}
            </TouchableOpacity>

            {showManualAdd ? (
              <View className="mb-8">
                <TextInput 
                  className="bg-[#2c2c2e] text-white px-4 py-3 rounded-xl mb-2" 
                  placeholder="Type ingredient (e.g., pork, onion)..." 
                  placeholderTextColor="#6b7280"
                  value={manualSearchQuery}
                  onChangeText={setManualSearchQuery}
                  autoFocus
                />
                {manualSearchQuery.length > 0 && ingredientsDB
                  .filter(ing => ing.name.toLowerCase().includes(manualSearchQuery.toLowerCase()))
                  .filter(ing => !matchedIngredients.find(m => m.id === ing.id))
                  .slice(0, 3)
                  .map(ing => (
                    <TouchableOpacity 
                      key={ing.id} 
                      className="bg-[#1c1c1e] p-4 border-b border-white/5 rounded-xl mb-2 flex-row justify-between items-center"
                      onPress={() => {
                        setMatchedIngredients([...matchedIngredients, ing]);
                        setManualSearchQuery('');
                        setShowManualAdd(false);
                      }}
                    >
                      <Text className="text-white text-base">{ing.name}</Text>
                      <Plus size={20} color="#0fa958" />
                    </TouchableOpacity>
                  ))
                }
                <TouchableOpacity className="mt-2 items-center p-2" onPress={() => { setShowManualAdd(false); setManualSearchQuery(''); }}>
                  <Text className="text-gray-400 font-medium">Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                className="border border-[#0fa958] rounded-full py-4 items-center justify-center flex-row mb-8"
                onPress={() => setShowManualAdd(true)}
              >
                <Plus size={20} color="#0fa958" className="mr-2" />
                <Text className="text-[#0fa958] font-bold text-base">Add Scanned Ingredient Manually</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <RecipeResultsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          recipes={recipes}
          detectedIngredients={matchedIngredients}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <VisionCamera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={isFocused} torchMode={torch ? 'on' : 'off'} photo={true} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {predictions.map((pred, idx) => {
          const scale = Math.max(SCREEN_W / rawImageSize.w, SCREEN_H / rawImageSize.h);
          const offsetX = (SCREEN_W - rawImageSize.w * scale) / 2;
          const offsetY = (SCREEN_H - rawImageSize.h * scale) / 2;
          const left = (pred.x - pred.width / 2) * scale + offsetX;
          const top = (pred.y - pred.height / 2) * scale + offsetY;
          const width = pred.width * scale;
          const height = pred.height * scale;
          return (
            <React.Fragment key={idx}>
              <View style={[styles.bbox, { left, top, width, height, borderColor: '#10b981' }]} />
              <View style={[styles.bboxLabel, { backgroundColor: '#10b981', left, top: top - 26 }]}>
                <Text style={styles.bboxText}>{pred.class.toUpperCase()}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}><ArrowLeft size={24} color="white" /></TouchableOpacity>
          <View style={styles.headerRight}>
            {cameraPosition === 'back' && device?.hasTorch && (
              <TouchableOpacity style={[styles.iconBtn, torch && styles.torchActive]} onPress={toggleTorch}>
                {torch ? <Flashlight size={24} color="black" /> : <FlashlightOff size={24} color="white" />}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconBtn} onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}>
              <SwitchCamera size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.scanBtn, !matchedIngredients.length && styles.disabledBtn]}
            onPress={handleReviewIngredients}
            disabled={!matchedIngredients.length}
            activeOpacity={0.85}
          >
            <ChefHat size={24} color="white" />
            <Text style={styles.scanBtnText}>Review Ingredients ({matchedIngredients.length})</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  torchActive: { backgroundColor: '#10b981' },
  bbox: { position: 'absolute', borderWidth: 3, borderRadius: 8 },
  bboxLabel: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bboxText: { color: 'white', fontSize: 13, fontWeight: '800' },
  bottomBar: { paddingBottom: 40, paddingHorizontal: 24 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0fa958', paddingVertical: 18, borderRadius: 24 },
  scanBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  disabledBtn: { backgroundColor: 'rgba(15, 169, 88, 0.4)' },
});
