import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, TextInput } from 'react-native';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission, type CameraRef } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Flashlight, FlashlightOff, SwitchCamera, ChefHat, RefreshCcw, Plus } from 'lucide-react-native';
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

  // Continuous background detection loop state
  const [isLiveScanning, setIsLiveScanning] = useState(true);
  const [predictions, setPredictions] = useState<RoboflowPrediction[]>([]);
  const [matchedIngredients, setMatchedIngredients] = useState<Ingredient[]>([]);
  
  // Debug UI
  const [debugLog, setDebugLog] = useState<string>('Ready to scan...');

  // Freezing frame on Review
  const [frozenImageUri, setFrozenImageUri] = useState<string | null>(null);
  const [showResultsUi, setShowResultsUi] = useState(false);

  // Results drawer state
  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(false);

  // Active snapshot processing
  const isProcessingRef = useRef(false);
  const isLiveScanningRef = useRef(true);

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
      const currentMatched = [];
        for (const pred of detected) {
          const hit = ingredientsDB.find(i => {
            const sanitize = (str) => str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
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
    if (isLiveScanning && isFocused) {
      loop();
    }
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isLiveScanning, isFocused, ingredientsDB]);

  const handleReviewIngredients = () => { isLiveScanningRef.current = false; setIsLiveScanning(false); handleShowRecipes(); };

    useEffect(() => {
      if (isDrawerOpen) {
        handleShowRecipes();
      }
    }, [matchedIngredients.length, isDrawerOpen]);

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

  

  return (
    <View style={styles.container}>
      <VisionCamera ref={cameraRef} style={StyleSheet.absoluteFill} device={device} isActive={isFocused} torchMode={torch ? 'on' : 'off'} />

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
  <View style={{ flexDirection: 'row', gap: 12 }}>
    {!isLiveScanning && (
      <TouchableOpacity
        style={[styles.scanBtn, { flex: 1, backgroundColor: '#fb923c' }]}
        onPress={resetScan}
        activeOpacity={0.85}
      >
        <Text style={styles.scanBtnText}>Rescan</Text>
      </TouchableOpacity>
    )}
    <TouchableOpacity
      style={[styles.scanBtn, !matchedIngredients.length && styles.disabledBtn, { flex: isLiveScanning ? 1 : 2 }]}
      onPress={handleReviewIngredients}
      disabled={!matchedIngredients.length}
      activeOpacity={0.85}
    >
      <ChefHat size={24} color="white" />
      <Text style={styles.scanBtnText}>Review Ingredients ({matchedIngredients.length})</Text>
    </TouchableOpacity>
  </View>
</View>
              <RecipeResultsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          recipes={recipes}
          detectedIngredients={matchedIngredients}
        />
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
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ea580c', paddingVertical: 18, borderRadius: 24 },
  scanBtnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  disabledBtn: { backgroundColor: 'rgba(234, 88, 12, 0.4)' },
});



