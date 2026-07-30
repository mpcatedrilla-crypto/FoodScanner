import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  NativeModules,
} from 'react-native';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import type { Camera } from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  ScanLine,
  RotateCcw,
  ChefHat,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { RecipeResultsDrawer } from '../components/scanner/recipe-results-drawer';
import { getIngredients, findMatchingRecipes } from '../lib/actions';
import { detectIngredients } from '../services/roboflow';
import { logIngredientScan } from '../services/scan-logger';
import type { Ingredient, RecipeMatch } from '../lib/types';
import type { RoboflowPrediction } from '../services/roboflow';

// ─── Types ────────────────────────────────────────────────────────────────────
type ScanPhase = 'preview' | 'scanning' | 'results';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Bounding-box colors per detection index ──────────────────────────────────
const BOX_COLORS = [
  '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<Camera>(null);

  // Screen focus tracking (fixes black screen on navigation)
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, [])
  );

  // Torch
  const [torch, setTorch] = useState(false);
  const toggleTorch = () => {
    if (device?.hasTorch) {
      setTorch(prev => !prev);
    }
  };

  // Ingredient / recipe data
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  useEffect(() => { getIngredients().then(setIngredients); }, []);

  // Scan state
  const [phase, setPhase]                     = useState<ScanPhase>('preview');
  const [capturedUri, setCapturedUri]         = useState<string | null>(null);
  const [rawImageSize, setRawImageSize]       = useState({ w: 640, h: 480 });
  const [displayH, setDisplayH]              = useState(SCREEN_W * 0.75);
  const [predictions, setPredictions]         = useState<RoboflowPrediction[]>([]);
  const [matchedIngredients, setMatchedIngredients] = useState<Ingredient[]>([]);
  const [scanError, setScanError]             = useState<string | null>(null);

  // Recipe state
  const [recipes, setRecipes]           = useState<RecipeMatch[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Capture + detect ───────────────────────────────────────────────────────
  const handleCapture = useCallback(async () => {
    if (!cameraRef.current) return;
    setScanError(null);

    try {
      if (!cameraRef.current) throw new Error('Camera ref is null');
      
      let photo;
      if (typeof cameraRef.current.takePhoto === 'function') {
        // 1a. Normal high-res photo capture
        photo = await cameraRef.current.takePhoto({
          flash: torch ? 'on' : 'off',
        });
      } else if (typeof cameraRef.current.takeSnapshot === 'function') {
        // 1b. Fast snapshot fallback (often works when takePhoto is stripped)
        photo = await cameraRef.current.takeSnapshot({ quality: 85 });
      } else {
        const keys = Object.keys(cameraRef.current || {}).join(', ');
        throw new Error(`No capture methods available! Keys: ${keys}`);
      }

      let fileUri: string;
      if (typeof photo === 'string') {
        fileUri = photo.startsWith('file://') ? photo : `file://${photo}`;
        setRawImageSize({ w: SCREEN_W, h: SCREEN_W * 1.33 }); 
      } else if (photo && typeof photo === 'object') {
        // takePhoto or takeSnapshot returned a PhotoFile/JSI object
        let rawPath = photo.path || photo.uri || photo.url;
        
        // If it's an in-memory snapshot buffer, we need to save it to disk first
        if (!rawPath && typeof photo.saveToTemporaryFileAsync === 'function') {
          let tempFile;
          try {
            // Signature 1: Options object
            tempFile = await photo.saveToTemporaryFileAsync({ format: 'jpg', quality: 85 });
          } catch (e) {
            try {
              // Signature 2: Positional arguments (format, quality)
              tempFile = await photo.saveToTemporaryFileAsync('jpg', 85);
            } catch (e2: any) {
              // Signature 3: Just format
              try {
                tempFile = await photo.saveToTemporaryFileAsync('jpg');
              } catch (e3: any) {
                throw new Error(`Failed all signatures: ${e3.message}`);
              }
            }
          }
          rawPath = typeof tempFile === 'string' ? tempFile : (tempFile.path || tempFile.uri);
        }

        if (!rawPath) {
          const keys = []; for (const k in photo) keys.push(k);
          throw new Error(`Photo object missing path even after save! Keys: ${keys.join(', ')}`);
        }
        fileUri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;
        setRawImageSize({ w: photo.width || SCREEN_W, h: photo.height || (SCREEN_W * 1.33) });
        const aspectRatio = (photo.height && photo.width) ? (photo.height / photo.width) : 1.33;
        setDisplayH(SCREEN_W * aspectRatio);
      } else {
        throw new Error(`Capture returned unexpected type: ${typeof photo}`);
      }

      setCapturedUri(fileUri);
      
      // Now that we have the photo safely, change phase so UI updates
      setPhase('scanning');

      // 2. Encode to base64 and resize!
      // We MUST resize the image because physical phone cameras take 12MP+ photos (3000x4000px).
      // Sending a 5MB base64 string crashes the React Native Android fetch API (UnknownHostException).
      // Roboflow downscales to 640x640 anyway, so sending 800px is perfect and makes uploads instant.
      const manipResult = await manipulateAsync(fileUri, [{ resize: { width: 800 } }], {
        base64: true,
        format: SaveFormat.JPEG,
        compress: 0.7, 
      });
      
      const base64 = manipResult.base64;
      if (!base64) throw new Error('Image manipulation failed to return base64 data');

      if (typeof detectIngredients !== 'function') throw new Error('detectIngredients is not a function');

      // 3. Roboflow Cloud Inference
      const result = await detectIngredients(base64);
      const preds  = result.predictions ?? [];
      setPredictions(preds);

      // Use Roboflow's reported image size for accurate scaling
      const rfW = result.image?.width  ?? photo.width;
      const rfH = result.image?.height ?? photo.height;
      setRawImageSize({ w: rfW, h: rfH });
      setDisplayH(SCREEN_W * (rfH / rfW));

      // 4. Match class names → ingredients from DB
      const matched: Ingredient[] = [];
      for (const pred of preds) {
        const hit = ingredients.find(ing =>
          ing.name.toLowerCase() === pred.class.toLowerCase() ||
          (ing.name_tagalog &&
           ing.name_tagalog.toLowerCase() === pred.class.toLowerCase()) ||
          ing.coco_class?.toLowerCase() === pred.class.toLowerCase()
        );
        if (hit && !matched.find(m => m.id === hit.id)) matched.push(hit);
      }
      setMatchedIngredients(matched);

      // 5. Log to Supabase (non-blocking)
      logIngredientScan(preds, rfW, rfH).catch(() => {});
      
      // Auto-fetch top recipe
      if (matched.length > 0) {
        setLoadingRecipes(true);
        const ids = matched.map(i => i.id);
        const topRecipes = await findMatchingRecipes(ids);
        setRecipes(topRecipes);
        setLoadingRecipes(false);
        setIsDrawerOpen(true);
      }

      setPhase('results');
    } catch (err: any) {
      console.error('[Scan] Error:', err);
      setScanError(err.message ?? 'Scan failed. Please try again.');
      setPhase('preview');
    }
  }, [torch, ingredients]);

  // ── Find matching recipes ─────────────────────────────────────────────────
  const handleFindRecipes = async () => {
    if (!matchedIngredients.length) return;
    setLoadingRecipes(true);
    const ids = matchedIngredients.map(i => i.id);
    const matched = await findMatchingRecipes(ids);
    setRecipes(matched);
    setLoadingRecipes(false);
    setIsDrawerOpen(true);
  };

  // ── Reset to camera preview ───────────────────────────────────────────────
  const resetScan = () => {
    setIsDrawerOpen(false);
    setPhase('preview');
    setCapturedUri(null);
    setPredictions([]);
    setMatchedIngredients([]);
    setScanError(null);
    setRecipes([]);
    if (torch) {
      setTorch(false);
      NativeModules.TorchModule?.setTorchMode(false);
    }
  };

  // ─── Permission screens ───────────────────────────────────────────────────
  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-black px-6">
        <Text className="text-white text-center mb-6 text-base">
          Camera access is required to scan ingredients.
        </Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  // ─── Results view (captured image + bounding boxes) ───────────────────────
  if (phase === 'results' && capturedUri) {
    // Calculate totals for nutrition
    const totalCals = matchedIngredients.reduce((sum, item) => sum + (item.calories_per_100g || 0), 0);
    const totalProt = matchedIngredients.reduce((sum, item) => sum + (item.protein_per_100g || 0), 0);
    const totalFat  = matchedIngredients.reduce((sum, item) => sum + (item.fats_per_100g || 0), 0);
    const bestRecipe = recipes[0];

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.imageContainer, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
              <Image
                source={{ uri: capturedUri }}
                style={{ width: SCREEN_W, height: displayH }}
                resizeMode="contain"
              />
              {/* Bounding boxes */}
              {predictions.map((pred, idx) => {
                const scaleX = SCREEN_W / rawImageSize.w;
                const scaleY = displayH / rawImageSize.h;
                const left   = (pred.x - pred.width  / 2) * scaleX;
                const top    = (pred.y - pred.height / 2) * scaleY;
                const width  = pred.width  * scaleX;
                const height = pred.height * scaleY;
                const color  = '#10b981'; // Green from mockup
                
                return (
                  <View
                    key={pred.detection_id ?? idx}
                    style={[styles.bbox, { left, top, width, height, borderColor: color }]}
                  >
                    <View style={[styles.bboxLabel, { backgroundColor: color }]}>
                      <Text style={styles.bboxText}>
                        {pred.class.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} {(pred.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
        </SafeAreaView>

        {/* Recipe Drawer (Bottom Sheet) */}
        <RecipeResultsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          recipes={recipes}
          detectedIngredients={matchedIngredients}
        />

        {/* Floating Header on top of everything */}
        <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, width: '100%', zIndex: 50 }} pointerEvents="box-none">
          <View style={[styles.header, { paddingTop: 20 }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.iconBtn} onPress={resetScan}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Food Scanner</Text>
            <TouchableOpacity style={styles.iconBtn} onPress={resetScan}>
              <RotateCcw size={22} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Camera preview ───────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Live camera feed */}
      <VisionCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && phase === 'preview'}
        photo={true}
        torch={torch ? 'on' : 'off'}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {cameraPosition === 'back' && device?.hasTorch && (
              <TouchableOpacity
                style={[styles.iconBtn, torch && styles.torchActive]}
                onPress={toggleTorch}
                activeOpacity={0.7}
              >
                {torch
                  ? <Flashlight size={24} color="black" />
                  : <FlashlightOff size={24} color="white" />}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setCameraPosition(p => p === 'back' ? 'front' : 'back')}
            >
              <SwitchCamera size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan frame guide */}
        <View style={styles.scanGuide}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.guideText}>
            Point at an ingredient and press Scan
          </Text>
          {scanError && (
            <Text style={styles.errorText}>{scanError}</Text>
          )}
        </View>

        {/* Scan button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.scanBtn, phase === 'scanning' && styles.disabledBtn]}
            onPress={handleCapture}
            disabled={phase === 'scanning'}
            activeOpacity={0.85}
          >
            {phase === 'scanning'
              ? <ActivityIndicator color="white" />
              : <ScanLine size={24} color="white" />}
            <Text style={styles.scanBtnText}>
              {phase === 'scanning' ? 'Detecting...' : 'Scan Ingredient'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#000' },
  safeArea:       { flex: 1, justifyContent: 'space-between' },

  // Header
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  headerTitle:    { color: 'white', fontSize: 18, fontWeight: '700' },
  headerRight:    { flexDirection: 'row', gap: 12 },
  iconBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  torchActive:    { backgroundColor: '#10b981' },

  // Scan guide
  scanGuide:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame:      { width: 280, height: 280, borderRadius: 24, position: 'relative' },
  corner:         { position: 'absolute', width: 32, height: 32, borderColor: '#10b981', borderWidth: 4 },
  cornerTL:       { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 20 },
  cornerTR:       { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 20 },
  cornerBL:       { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 20 },
  cornerBR:       { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 20 },
  guideText:      { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '500', marginTop: 32, textAlign: 'center', paddingHorizontal: 32 },
  errorText:      { color: '#ef4444', fontSize: 14, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },

  // Bottom bar
  bottomBar:      { paddingBottom: 40, paddingHorizontal: 24 },
  scanBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 18 },
  scanBtnText:    { color: 'white', fontSize: 18, fontWeight: '700' },
  primaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10b981', paddingVertical: 16, borderRadius: 18 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
  disabledBtn:    { opacity: 0.5 },

  // Results
  resultsScroll:  { paddingBottom: 40 },
  imageContainer: { position: 'relative', backgroundColor: '#111' },
  bbox:           { position: 'absolute', borderWidth: 2, borderRadius: 6 },
  bboxLabel:      { position: 'absolute', top: -24, left: -2, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  bboxText:       { color: 'white', fontSize: 12, fontWeight: '700' },
  
  // New Overlay UI
  overlayContainer: { marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 20, zIndex: 10 },
  infoCard:       { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 20 },
  cardTitle:      { color: 'white', fontSize: 16, fontWeight: '600' },
  cardSubtitle:   { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4, marginBottom: 16 },
  
  nutritionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 },
  nutritionItem:  { alignItems: 'center', flex: 1 },
  nutritionLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  nutritionValue: { color: 'white', fontSize: 24, fontWeight: '700' },
  nutritionUnit:  { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' },
  nutritionDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  recipeWrapper:  { gap: 12 },
  recipeCard:     { backgroundColor: '#1c1c1e', borderRadius: 16, flexDirection: 'row', overflow: 'hidden' },
  recipeContent:  { flex: 1, padding: 20, justifyContent: 'center' },
  recipeSuggested:{ color: '#10b981', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  recipeName:     { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  recipeDesc:     { color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 18 },
  recipeImage:    { width: 120, height: '100%' },
  recipeImagePlaceholder: { width: 120, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
});
