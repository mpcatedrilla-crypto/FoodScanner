import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, TextInput } from 'react-native';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission, type CameraRef } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flashlight, FlashlightOff, SwitchCamera, ChefHat, RefreshCcw, Plus, Circle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';

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
  const cameraRef = useRef<CameraRef>(null);

  const [isFocused, setIsFocused] = useState(true);
  const isLiveScanningRef = useRef(true);
  const [isLiveScanning, setIsLiveScanning] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      isLiveScanningRef.current = true;
      setIsLiveScanning(true);
      return () => {
        setIsFocused(false);
        isLiveScanningRef.current = false;
        setIsLiveScanning(false);
      };
    }, [])
  );

  const [torch, setTorch] = useState(false);
  const toggleTorch = () => { if (device?.hasTorch) setTorch(prev => !prev); };

  const [ingredientsDB, setIngredientsDB] = useState<Ingredient[]>([]);
  useEffect(() => { getIngredients().then(setIngredientsDB); }, []);

  const [predictions, setPredictions] = useState<RoboflowPrediction[]>([]);
  const [matchedIngredients, setMatchedIngredients] = useState<Ingredient[]>([]);
  const [showResultsUi, setShowResultsUi] = useState(false);
  
  // Freezing frame on Review
  const [frozenImageUri, setFrozenImageUri] = useState<string | null>(null);

  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  const isProcessingRef = useRef(false);
  const setDebugLog = (m: string) => console.log(m);

  const processLiveFrame = async () => {
    if (isProcessingRef.current || !cameraRef.current || !isLiveScanning) return;
    try {
      isProcessingRef.current = true;
      
      const snap = await cameraRef.current.takeSnapshot();
      if (!snap) {
          setDebugLog("No snapshot captured");
          return;
      }
      
      let rawPath = FileSystem.documentDirectory + 'snap.jpg';
      if (rawPath.startsWith('file://')) rawPath = rawPath.replace('file://', '');
      
      await snap.saveToFileAsync(rawPath, 'jpg', 50);
      
      const fileUri = 'file://' + rawPath;

      const manipResult = await manipulateAsync(
        fileUri,
        [{ resize: { width: 640, height: 640 } }],
        { compress: 0.5, format: SaveFormat.JPEG, base64: true }
      );

      setFrozenImageUri(manipResult.uri);
      if (!manipResult.base64) return;
      
      let base64 = manipResult.base64;
      if (base64.startsWith('data:')) {
        base64 = base64.split(',')[1];
      }
      
      const response = await detectIngredients(base64);
      if (!isLiveScanningRef.current) return;
      const detected = response?.predictions || [];
      setPredictions(detected);
      
      setDebugLog(`ONNX ok: ${detected.length} items`);

      // Match against local DB
      const currentMatched: Ingredient[] = [];
        for (const pred of detected) {
          const hit = ingredientsDB.find(i => {
            const sanitize = (str: string) => str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
            const pClass = sanitize(pred.class);
            const iName = sanitize(i.name);
            const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
            return iClasses.includes(pClass) || iName === pClass;
          });
          if (hit && !currentMatched.find(m => m.id === hit.id)) currentMatched.push(hit);
        }
        setMatchedIngredients(currentMatched);
    } catch (err) {
      setDebugLog(`UI Error: ${err}`);
    } finally {
      isProcessingRef.current = false;
    }
  };

    useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isCancelled = false;
    const loop = async () => {
      if (isCancelled) return;
      await processLiveFrame();
      if (!isCancelled) {
        timeoutId = setTimeout(loop, 400);
      }
    };
    if (isLiveScanning && isFocused) loop();
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isLiveScanning, isFocused, ingredientsDB, matchedIngredients.length, isDrawerOpen]);

  const handleReviewIngredients = async () => {
    isLiveScanningRef.current = false;
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
    setFrozenImageUri(null);
    isLiveScanningRef.current = true;
    setIsLiveScanning(true);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 100 }}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 20, alignSelf: 'center' }}><Text>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }
  if (!device) return <View style={styles.container} />;

  // Calculate Nutrition
  let totalCal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
  matchedIngredients.forEach(i => {
    totalCal += i.calories_per_100g || 0;
    totalProtein += i.protein_per_100g || 0;
    totalCarbs += i.carbs_per_100g || 0;
    totalFat += i.fats_per_100g || 0;
  });
  const totalMacros = totalProtein + totalCarbs + totalFat || 1;
  const pPct = Math.round((totalProtein / totalMacros) * 100);
  const cPct = Math.round((totalCarbs / totalMacros) * 100);
  const fPct = Math.round((totalFat / totalMacros) * 100);

  const getBestConfidence = (ing: Ingredient) => {
    const sanitize = (str: string) => str ? String(str).replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
    const aliases = ing.coco_class ? String(ing.coco_class).split(',').map(sanitize) : [];
    aliases.push(sanitize(ing.name));
    
    let best = 0;
    for (const pred of predictions) {
      if (aliases.includes(sanitize(pred.class)) && pred.confidence > best) {
        best = pred.confidence;
      }
    }
    return Math.round(best * 100);
  };

  if (showResultsUi) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultsHeader}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ArrowLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.resultsHeaderText}>RECOGNIZED INGREDIENTS</Text>
          <TouchableOpacity onPress={resetScan} style={{ padding: 8, alignItems: 'center' }}>
            <RefreshCcw size={20} color="#ea580c" />
            <Text style={{ fontSize: 10, color: '#ea580c', fontWeight: 'bold' }}>rescan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.frozenCameraContainer}>
          {frozenImageUri ? (
            <Image source={{ uri: frozenImageUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <VisionCamera 
              style={StyleSheet.absoluteFill} 
              device={device} 
              isActive={false}
            />
          )}
          {predictions.map((pred, idx) => {
            if (pred.x == null || pred.y == null || pred.width == null || pred.height == null) return null;
            const scaleX = SCREEN_W / 640;
            const scaleY = SCREEN_H / 640;
            const left = (pred.x - pred.width / 2) * scaleX;
            const top = (pred.y - pred.height / 2) * scaleY;
            const width = pred.width * scaleX;
            const height = pred.height * scaleY;
            return (
              <View key={pred.id || idx} style={[styles.bbox, { left, top, width, height, borderColor: '#ea580c' }]}>
                <View style={[styles.bboxLabel, { backgroundColor: '#ea580c', top: -20, left: -3 }]}>
                  <Text style={styles.bboxText} numberOfLines={1}>{pred.class} {Math.round(pred.confidence * 100)}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.sectionTitle}>Detected Ingredients</Text>
          {matchedIngredients.map(ing => (
            <View key={ing.id} style={styles.ingredientCard}>
              <Text style={styles.ingredientTitle}>{ing.name}</Text>
              <Text style={styles.confidenceText}>Confidence: {getBestConfidence(ing)}%</Text>
              <Text style={styles.macroText}>
                Cal: {ing.calories_per_100g || 0}   Fat: {ing.fats_per_100g || 0}g   Carbs: {ing.carbs_per_100g || 0}g
              </Text>
            </View>
          ))}

          {matchedIngredients.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Nutritional Summary</Text>
              <View style={styles.summaryCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Circle size={40} color="#ea580c" style={{ marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.macroRow}><View style={[styles.dot, {backgroundColor: '#22c55e'}]} /><Text style={styles.macroStatText}>Protein: {pPct}%</Text></View>
                    <View style={styles.macroRow}><View style={[styles.dot, {backgroundColor: '#3b82f6'}]} /><Text style={styles.macroStatText}>Carbs: {cPct}%</Text></View>
                    <View style={styles.macroRow}><View style={[styles.dot, {backgroundColor: '#a855f7'}]} /><Text style={styles.macroStatText}>Fat: {fPct}%</Text></View>
                  </View>
                  <Text style={styles.summaryDescText}>Macronutrient breakdown for detected ingredients.</Text>
                </View>
                
                <View style={styles.horizontalBar}>
                  <View style={{ flex: pPct, backgroundColor: '#22c55e' }} />
                  <View style={{ flex: cPct, backgroundColor: '#3b82f6' }} />
                  <View style={{ flex: fPct, backgroundColor: '#a855f7' }} />
                </View>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleShowRecipes}>
                <Text style={styles.primaryBtnText}>FIND MATCHING RECIPES</Text>
              </TouchableOpacity>
            </>
          )}
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
      <VisionCamera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={isFocused} torchMode={torch ? 'on' : 'off'}  />

      {isFocused && !showResultsUi && predictions.map((pred, idx) => {
        if (pred.x == null || pred.y == null || pred.width == null || pred.height == null) return null;
        const scaleX = SCREEN_W / 640;
        const scaleY = SCREEN_H / 640;
        const left = (pred.x - pred.width / 2) * scaleX;
        const top = (pred.y - pred.height / 2) * scaleY;
        const width = pred.width * scaleX;
        const height = pred.height * scaleY;
        return (
          <View key={pred.id || idx} style={[styles.bbox, { left, top, width, height, borderColor: '#ea580c' }]}>
            <View style={[styles.bboxLabel, { backgroundColor: '#ea580c', top: -24, left: -3, minWidth: 80 }]}>
              <Text style={styles.bboxText} numberOfLines={1}>{pred.class} {Math.round(pred.confidence * 100)}%</Text>
            </View>
          </View>
        );
      })}

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
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
            style={[styles.primaryBtn, !matchedIngredients.length && styles.disabledBtn]}
            onPress={handleReviewIngredients}
            disabled={!matchedIngredients.length}
            activeOpacity={0.85}
          >
            <ChefHat size={24} color="white" />
            <Text style={styles.primaryBtnText}>Review Ingredients ({matchedIngredients.length})</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9F2' },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  torchActive: { backgroundColor: '#ea580c' },
  bbox: { position: 'absolute', borderWidth: 3, borderRadius: 8 },
  bboxLabel: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bboxText: { color: 'white', fontSize: 13, fontWeight: '800' },
  bottomBar: { paddingBottom: 40, paddingHorizontal: 24 },
  
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF9F2' },
  resultsHeaderText: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  frozenCameraContainer: { height: 250, width: '100%', overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 10, marginBottom: 16 },
  ingredientCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  ingredientTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  confidenceText: { fontSize: 12, color: '#6b7280', marginBottom: 12 },
  macroText: { fontSize: 13, color: '#4b5563', fontWeight: '500' },
  
  summaryCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#f3f4f6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  macroStatText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  summaryDescText: { flex: 1, fontSize: 11, color: '#9ca3af', marginLeft: 16 },
  horizontalBar: { height: 12, borderRadius: 6, flexDirection: 'row', overflow: 'hidden', marginTop: 8 },

  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ea580c', paddingVertical: 18, borderRadius: 24 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
  disabledBtn: { backgroundColor: 'rgba(234, 88, 12, 0.4)' },
});







