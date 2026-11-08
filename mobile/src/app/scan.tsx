/**
 * Live Camera Scanner Screen
 * Purpose: Handles camera feed, continuous YOLO inference, bounding box visualization, and ingredient accumulation.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  AppState,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  BackHandler,
  Modal,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Camera as VisionCamera,
  useCameraDevice,
  useCameraPermission,
  type CameraRef,
} from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Flashlight,
  FlashlightOff,
  SwitchCamera,
  ChefHat,
  RefreshCcw,
  Maximize2,
  X,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';

import { RecipeResultsDrawer } from '../components/scanner/recipe-results-drawer';
import { getIngredients, findMatchingRecipes } from '../lib/actions';
import { scanSession } from '../lib/scan-session';
import {
  getIngredientNutrition,
  getScannedIngredientsNutritionSummary,
  SCANNED_SERVING_GRAMS,
} from '../lib/nutrition';
import { detectIngredients, SUPPORTED_CLASSES } from '../services/roboflow';
import type { Ingredient, RecipeMatch } from '../lib/types';
import type { RoboflowPrediction } from '../services/roboflow';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const ACCENT_COLORS = ['#ed5108', '#f29d38', '#e7b93d', '#20b968', '#4285f4'];

type ImageSize = { width: number; height: number };
type ImageFit = 'contain' | 'cover';

function getImageFit(container: ImageSize, image: ImageSize, fit: ImageFit) {
  if (!container.width || !container.height || !image.width || !image.height) return null;
  const scale = fit === 'contain'
    ? Math.min(container.width / image.width, container.height / image.height)
    : Math.max(container.width / image.width, container.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { scale, left: (container.width - width) / 2, top: (container.height - height) / 2, width, height };
}

function DetectionBoxes({
  predictions,
  imageSize,
  containerSize,
  fit,
}: {
  predictions: RoboflowPrediction[];
  imageSize: ImageSize | null;
  containerSize: ImageSize;
  fit: ImageFit;
}) {
  if (!imageSize) return null;
  const frame = getImageFit(containerSize, imageSize, fit);
  if (!frame) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {predictions.map((pred, idx) => {
        if (pred.x == null || pred.y == null || pred.width == null || pred.height == null) return null;
        const left = Math.max(0, frame.left + (pred.x - pred.width / 2) * frame.scale);
        const top = Math.max(0, frame.top + (pred.y - pred.height / 2) * frame.scale);
        const right = Math.min(containerSize.width, frame.left + (pred.x + pred.width / 2) * frame.scale);
        const bottom = Math.min(containerSize.height, frame.top + (pred.y + pred.height / 2) * frame.scale);
        const width = right - left;
        const height = bottom - top;
        if (width <= 4 || height <= 4) return null;

        return (
          <View key={pred.id || idx} style={[styles.bbox, { left, top, width, height, borderColor: '#ed5108' }]}>
            <View style={[styles.bboxLabel, { backgroundColor: '#ed5108', top: -24, left: -3, minWidth: 80 }]}>
              <Text style={styles.bboxText} numberOfLines={1}>
                {pred.class} {Math.round(pred.confidence * 100)}%
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ScannedImage({
  uri,
  predictions,
  imageSize,
  style,
  fit,
}: {
  uri: string;
  predictions: RoboflowPrediction[];
  imageSize: ImageSize | null;
  style: StyleProp<ViewStyle>;
  fit: ImageFit;
}) {
  const [containerSize, setContainerSize] = useState<ImageSize>({ width: 0, height: 0 });
  return (
    <View style={style} onLayout={({ nativeEvent }) => setContainerSize(nativeEvent.layout)}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit={fit} />
      <DetectionBoxes predictions={predictions} imageSize={imageSize} containerSize={containerSize} fit={fit} />
    </View>
  );
}

function DonutArcSegment({
  startAngle,
  sweepAngle,
  color,
  size,
  strokeWidth,
}: {
  startAngle: number;
  sweepAngle: number;
  color: string;
  size: number;
  strokeWidth: number;
}) {
  if (sweepAngle <= 0) return null;
  const clampedSweep = Math.min(360, sweepAngle);

  const renderHalf = (angle: number, key: string) => {
    const clamped = Math.min(180, Math.max(0, angle));
    if (clamped <= 0) return null;
    return (
      <View
        key={key}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          transform: [{ rotate: `${startAngle + (key === 'second' ? 180 : 0)}deg` }],
        }}
      >
        {/* Clip right half */}
        <View
          style={{
            position: 'absolute',
            left: size / 2,
            top: 0,
            width: size / 2,
            height: size,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              left: -size / 2,
              top: 0,
              width: size,
              height: size,
              overflow: 'hidden',
              transform: [{ rotate: `${clamped - 180}deg` }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: size / 2,
                top: 0,
                width: size / 2,
                height: size,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: -size / 2,
                  top: 0,
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: strokeWidth,
                  borderColor: color,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      {renderHalf(Math.min(180, clampedSweep), 'first')}
      {clampedSweep > 180 && renderHalf(clampedSweep - 180, 'second')}
    </>
  );
}

function MacroDonutChart({
  proteinPct,
  carbsPct,
  fatPct,
  totalCalories,
}: {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  totalCalories: number;
}) {
  const size = 88;
  const strokeWidth = 11;

  const pSweep = (proteinPct / 100) * 360;
  const cSweep = (carbsPct / 100) * 360;
  const fSweep = Math.max(0, 360 - pSweep - cSweep);

  return (
    <View
      style={{
        width: size,
        height: size,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background track ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: '#f3ece5',
        }}
      />

      {/* Arc segments */}
      <DonutArcSegment
        startAngle={0}
        sweepAngle={pSweep}
        color="#20b968"
        size={size}
        strokeWidth={strokeWidth}
      />
      <DonutArcSegment
        startAngle={pSweep}
        sweepAngle={cSweep}
        color="#4285f4"
        size={size}
        strokeWidth={strokeWidth}
      />
      <DonutArcSegment
        startAngle={pSweep + cSweep}
        sweepAngle={fSweep}
        color="#a253dc"
        size={size}
      strokeWidth={strokeWidth}
      />

      {/* Center cutout & label */}
      <View
        style={{
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '900', color: '#303440', lineHeight: 15 }}>
          {Math.round(totalCalories)}
        </Text>
        <Text style={{ fontSize: 9, fontWeight: '700', color: '#858791', lineHeight: 11 }}>
          kcal
        </Text>
      </View>
    </View>
  );
}

export default function ScanScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(cameraPosition);
  const cameraRef = useRef<CameraRef>(null);

  const [isFocused, setIsFocused] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);
  const isLiveScanningRef = useRef(true);
  const [isLiveScanning, setIsLiveScanning] = useState(true);
  const openingRecipeRef = useRef(false);

  const [torch, setTorch] = useState(false);
  const toggleTorch = () => {
    if (device?.hasTorch) setTorch((prev) => !prev);
  };

  const [ingredientsDB, setIngredientsDB] = useState<Ingredient[]>([]);
  useEffect(() => {
    getIngredients().then(setIngredientsDB);
  }, []);

  const [predictions, setPredictions] = useState<RoboflowPrediction[]>([]);
  const [matchedIngredients, setMatchedIngredients] = useState<Ingredient[]>([]);
  const [showResultsUi, setShowResultsUi] = useState(false);
  const [frozenImageUri, setFrozenImageUri] = useState<string | null>(null);
  const [sourceImageSize, setSourceImageSize] = useState<ImageSize | null>(null);
  const [isFullscreenModalOpen, setIsFullscreenModalOpen] = useState(false);
  const [showInitialGuidance, setShowInitialGuidance] = useState(false);
  const [showNoDetectionReminder, setShowNoDetectionReminder] = useState(false);
  const [cameraLayout, setCameraLayout] = useState<ImageSize>({ width: SCREEN_W, height: SCREEN_H });

  const [recipes, setRecipes] = useState<RecipeMatch[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const scanSessionIdRef = useRef(0);
  const lastSnapUriRef = useRef<string | null>(null);
  const hasLiveDetection = predictions.length > 0;
  const cameraIsActive = Boolean(hasPermission && device && isFocused && !showResultsUi && appState === 'active');
  const cameraIsActiveRef = useRef(cameraIsActive);
  cameraIsActiveRef.current = cameraIsActive;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!cameraIsActive) {
      setShowInitialGuidance(false);
      setShowNoDetectionReminder(false);
      return;
    }
    setShowInitialGuidance(true);
    setShowNoDetectionReminder(false);
    const timer = setTimeout(() => setShowInitialGuidance(false), 3000);
    return () => clearTimeout(timer);
  }, [cameraIsActive, cameraPosition]);

  useEffect(() => {
    if (!cameraIsActive || showInitialGuidance || hasLiveDetection) {
      setShowNoDetectionReminder(false);
      return;
    }
    const timer = setTimeout(() => setShowNoDetectionReminder(true), 8000);
    return () => clearTimeout(timer);
  }, [cameraIsActive, cameraPosition, showInitialGuidance, hasLiveDetection]);

  const cleanupLastSnap = useCallback(() => {
    const prevUri = lastSnapUriRef.current;
    lastSnapUriRef.current = null;
    if (prevUri) {
      FileSystem.deleteAsync(prevUri, { idempotent: true }).catch(() => {});
    }
  }, []);

  const resetScan = useCallback(() => {
    scanSessionIdRef.current += 1;
    cleanupLastSnap();
    setIsDrawerOpen(false);
    setShowResultsUi(false);
    setMatchedIngredients([]);
    setPredictions([]);
    setFrozenImageUri(null);
    setSourceImageSize(null);
    isLiveScanningRef.current = true;
    setIsLiveScanning(true);
  }, [cleanupLastSnap]);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      if (scanSession.resumeResults) {
        // Returning from a recipe opened via Suggested Recipes: keep results + drawer.
        scanSession.resumeResults = false;
        openingRecipeRef.current = false;
        isLiveScanningRef.current = false;
        setIsLiveScanning(false);
      } else {
        openingRecipeRef.current = false;
        resetScan();
      }
      return () => {
        setIsFocused(false);
        isLiveScanningRef.current = false;
        setIsLiveScanning(false);
        if (!openingRecipeRef.current) {
          scanSessionIdRef.current += 1;
          cleanupLastSnap();
          setIsDrawerOpen(false);
          setShowResultsUi(false);
          setMatchedIngredients([]);
          setPredictions([]);
          setFrozenImageUri(null);
          setSourceImageSize(null);
        }
      };
    }, [resetScan, cleanupLastSnap])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isDrawerOpen) {
          setIsDrawerOpen(false);
          return true;
        }
        if (showResultsUi) {
          resetScan();
          router.navigate('/');
          return true;
        }
        router.navigate('/');
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [isDrawerOpen, showResultsUi, resetScan])
  );

  const isProcessingRef = useRef(false);

  const matchDetectedToDb = useCallback(
    (detected: RoboflowPrediction[]) => {
      const sanitize = (str: string) =>
        str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
      const currentMatched: Ingredient[] = [];
      for (const pred of detected) {
        const pClass = sanitize(pred.class);
        const hit = ingredientsDB.find((i) => {
          const iName = sanitize(i.name);
          const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
          return iClasses.includes(pClass) || iName === pClass;
        });
        if (hit && !currentMatched.find((m) => m.id === hit.id)) {
          currentMatched.push(hit);
        }
      }
      return currentMatched;
    },
    [ingredientsDB]
  );

  const filterSupported = useCallback(
    (detected: RoboflowPrediction[]) => {
      const sanitize = (str: string) =>
        str ? str.replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
      return detected.filter((p) => {
        const cls = sanitize(p.class);
        if (!SUPPORTED_CLASSES.has(cls)) return false;
        if (ingredientsDB.length === 0) return true;
        return ingredientsDB.some((i) => {
          const iName = sanitize(i.name);
          const iClasses = i.coco_class ? i.coco_class.split(',').map(sanitize) : [];
          return iClasses.includes(cls) || iName === cls;
        });
      });
    },
    [ingredientsDB]
  );

  const processLiveFrame = async () => {
    if (isProcessingRef.current || !cameraRef.current || !isLiveScanningRef.current || !cameraIsActiveRef.current) return;
    const sessionAtStart = scanSessionIdRef.current;
    try {
      isProcessingRef.current = true;

      const snap = await cameraRef.current.takeSnapshot();
      if (!snap) return;

      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
      const uniqueFile = `snap_${sessionAtStart}_${Date.now()}.jpg`;
      let rawPath = baseDir + uniqueFile;
      if (rawPath.startsWith('file://')) rawPath = rawPath.replace('file://', '');

      await snap.saveToFileAsync(rawPath, 'jpg', 100);
      const fileUri = 'file://' + rawPath;

      if (!isLiveScanningRef.current || scanSessionIdRef.current !== sessionAtStart || !cameraIsActiveRef.current) {
        FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const response = await detectIngredients(base64);
      if (!isLiveScanningRef.current || scanSessionIdRef.current !== sessionAtStart || !cameraIsActiveRef.current) {
        FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
        return;
      }

      // Clean up the previous snapshot file so only the latest capture remains on disk
      const prevUri = lastSnapUriRef.current;
      if (prevUri && prevUri !== fileUri) {
        FileSystem.deleteAsync(prevUri, { idempotent: true }).catch(() => {});
      }
      lastSnapUriRef.current = fileUri;

      // Keep only detections that map to one of the supported DB ingredients.
      const detected = filterSupported(response?.predictions || []);
      setFrozenImageUri(fileUri);
      if (response?.imageWidth && response.imageHeight) {
        setSourceImageSize({ width: response.imageWidth, height: response.imageHeight });
      }
      setPredictions(detected);
      setMatchedIngredients(matchDetectedToDb(detected));
    } catch (err) {
      console.log(`UI Error: ${err}`);
    } finally {
      isProcessingRef.current = false;
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;
    const loop = async () => {
      if (cancelled) return;
      await processLiveFrame();
      if (!cancelled) timeoutId = setTimeout(loop, 400);
    };
    if (isLiveScanning && cameraIsActive) void loop();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isLiveScanning, cameraIsActive, ingredientsDB, matchedIngredients.length]);

  const handleReviewIngredients = async () => {
    isLiveScanningRef.current = false;
    setShowResultsUi(true);
  };

  const handleShowRecipes = async () => {
    try {
      const ids = matchedIngredients.map((i) => i.id);
      const topRecipes = await findMatchingRecipes(ids);
      setRecipes(topRecipes);
      setIsDrawerOpen(true);
    } catch (e) {
      console.error('Error finding matching recipes:', e);
    }
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.permissionPage}>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionDesc}>
          Palayok needs camera access to scan and identify food ingredients.
        </Text>
        <TouchableOpacity onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  if (!device) return <View style={styles.container} />;

  // Calculate Nutrition using standardized serving weights & DOST per-100g reference values
  const nutritionSummary = getScannedIngredientsNutritionSummary(matchedIngredients);
  const totalCal = nutritionSummary.perServing.calories;
  const pPct = nutritionSummary.proteinPct;
  const cPct = nutritionSummary.carbsPct;
  const fPct = nutritionSummary.fatPct;

  const getBestConfidence = (ing: Ingredient) => {
    const sanitize = (str: string) =>
      str ? String(str).replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim() : '';
    const aliases = ing.coco_class ? String(ing.coco_class).split(',').map(sanitize) : [];
    aliases.push(sanitize(ing.name));

    let best = 0;
    for (const pred of predictions) {
      if (aliases.includes(sanitize(pred.class)) && pred.confidence > best) {
        best = pred.confidence;
      }
    }
    return best > 0 ? Math.round(best * 100) : 100;
  };

  if (showResultsUi) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.resultsPage}>
        {/* Topbar matching scan-results.html */}
        <View style={styles.topbar}>
          <TouchableOpacity
            onPress={() => {
              resetScan();
              router.navigate('/');
            }}
            style={styles.iconAction}
            activeOpacity={0.75}
          >
            <ChevronLeft size={20} color="#303440" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>SCAN RESULTS</Text>
          <TouchableOpacity onPress={resetScan} style={styles.rescanLink} activeOpacity={0.75}>
            <RefreshCcw size={14} color="#ed5108" />
            <Text style={styles.rescanText}>rescan</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.resultsScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Scanned Photo Preview Frame */}
          <View style={styles.scanPhoto}>
            {frozenImageUri ? (
              <ScannedImage
                key={frozenImageUri}
                uri={frozenImageUri}
                predictions={predictions}
                imageSize={sourceImageSize}
                style={StyleSheet.absoluteFill}
                fit="cover"
              />
            ) : (
              <VisionCamera style={StyleSheet.absoluteFill} device={device} isActive={false} />
            )}
            {/* Fullscreen Button on lower right */}
            {frozenImageUri && (
              <TouchableOpacity
                style={styles.fullscreenBtn}
                activeOpacity={0.8}
                onPress={() => setIsFullscreenModalOpen(true)}
              >
                <Maximize2 size={16} color="#ffffff" />
                <Text style={styles.fullscreenBtnText}>Full Screen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Detected Ingredients Section */}
          <View style={styles.sectionHeadRow}>
            <View>
              <Text style={styles.accentHeading}>Detected Ingredients</Text>
              <Text style={styles.sectionSubnote}>
                Estimated nutritional information · per 100 g
              </Text>
            </View>
          </View>

          <View style={styles.ingredientStack}>
            {matchedIngredients.map((ing, idx) => {
              const accentColor = ACCENT_COLORS[idx % ACCENT_COLORS.length];
              const conf = getBestConfidence(ing);
              const ingNutr = getIngredientNutrition(ing, SCANNED_SERVING_GRAMS);
              return (
                <View
                  key={ing.id}
                  style={[styles.ingredientCard, { borderLeftColor: accentColor }]}
                >
                  <View style={styles.ingredientTop}>
                    <Text style={styles.ingredientName}>{ing.name}</Text>
                    <View style={styles.confidencePill}>
                      <Text style={styles.confidencePillText}>{conf}% match</Text>
                    </View>
                  </View>

                  <View style={styles.nutritionFactsGrid}>
                    <View style={[styles.factBox, { backgroundColor: '#fff0e6' }]}>
                      <Text style={styles.factLabel}>Calories</Text>
                      <Text style={styles.factValue}>{ingNutr.perServing.calories} kcal</Text>
                    </View>
                    <View style={[styles.factBox, { backgroundColor: '#e8f7ee' }]}>
                      <Text style={styles.factLabel}>Protein</Text>
                      <Text style={styles.factValue}>{ingNutr.perServing.protein} g</Text>
                    </View>
                    <View style={[styles.factBox, { backgroundColor: '#edf4ff' }]}>
                      <Text style={styles.factLabel}>Carbs</Text>
                      <Text style={styles.factValue}>{ingNutr.perServing.carbs} g</Text>
                    </View>
                    <View style={[styles.factBox, { backgroundColor: '#f6edff' }]}>
                      <Text style={styles.factLabel}>Fat</Text>
                      <Text style={styles.factValue}>{ingNutr.perServing.fats} g</Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {matchedIngredients.length === 0 && (
              <View style={styles.emptyIngredientsCard}>
                <Text style={styles.emptyIngredientsText}>
                  No ingredient detected. Kindly move the ingredient closer to the camera and ensure it is clearly visible. Please try scanning again.
                </Text>
              </View>
            )}
          </View>

          {/* Nutritional Summary with Calories + Doughnut Visualization + Macro Balance */}
          {matchedIngredients.length > 0 && (
            <>
              <View style={styles.summaryHead}>
                <Text style={styles.summaryHeading}>Nutritional Summary</Text>
                <Text style={styles.summaryHeadNote}>Estimated total</Text>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.summaryTotalRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.summaryLabel}>Calories for detected ingredients</Text>
                    <Text style={styles.summaryCalories}>{Math.round(totalCal)} kcal</Text>
                  </View>
                  <View style={styles.estimateBadge}>
                    <Text style={styles.estimateBadgeText}>Per Serving (100 g)</Text>
                  </View>
                </View>

                <View style={styles.donutAndBarsRow}>
                  <MacroDonutChart
                    proteinPct={pPct}
                    carbsPct={cPct}
                    fatPct={fPct}
                    totalCalories={totalCal}
                  />

                  <View style={styles.macroBalanceCol}>
                    {/* Protein Row */}
                    <View style={styles.macroRow}>
                      <View style={styles.macroNameWrap}>
                        <View style={[styles.dot, { backgroundColor: '#20b968' }]} />
                        <Text style={styles.macroName}>Protein</Text>
                      </View>
                      <View style={styles.macroBarTrack}>
                        <View
                          style={[
                            styles.macroBarFill,
                            { width: `${pPct}%`, backgroundColor: '#20b968' },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroPctText}>
                        {nutritionSummary.perServing.protein}g ({pPct}%)
                      </Text>
                    </View>

                    {/* Carbs Row */}
                    <View style={styles.macroRow}>
                      <View style={styles.macroNameWrap}>
                        <View style={[styles.dot, { backgroundColor: '#4285f4' }]} />
                        <Text style={styles.macroName}>Carbs</Text>
                      </View>
                      <View style={styles.macroBarTrack}>
                        <View
                          style={[
                            styles.macroBarFill,
                            { width: `${cPct}%`, backgroundColor: '#4285f4' },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroPctText}>
                        {nutritionSummary.perServing.carbs}g ({cPct}%)
                      </Text>
                    </View>

                    {/* Fat Row */}
                    <View style={[styles.macroRow, { marginBottom: 0 }]}>
                      <View style={styles.macroNameWrap}>
                        <View style={[styles.dot, { backgroundColor: '#a253dc' }]} />
                        <Text style={styles.macroName}>Fat</Text>
                      </View>
                      <View style={styles.macroBarTrack}>
                        <View
                          style={[
                            styles.macroBarFill,
                            { width: `${fPct}%`, backgroundColor: '#a253dc' },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroPctText}>
                        {nutritionSummary.perServing.fats}g ({fPct}%)
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.summaryNote}>
                  Illustrative estimate using sample portions (100g per detected ingredient). Actual
                  totals depend on ingredient amounts.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom CTA Button */}
        {matchedIngredients.length > 0 && (
          <View style={styles.resultsBottomBar}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleShowRecipes}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>Suggested Recipes</Text>
            </TouchableOpacity>
          </View>
        )}

        <RecipeResultsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectRecipe={() => {
            openingRecipeRef.current = true;
          }}
          recipes={recipes}
          detectedIngredients={matchedIngredients}
        />

        {/* Fullscreen Photo Modal */}
        <Modal
          visible={isFullscreenModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsFullscreenModalOpen(false)}
        >
          <View style={styles.fullscreenModalBackdrop}>
            <SafeAreaView style={styles.fullscreenModalSafeArea}>
              <View style={styles.fullscreenModalHeader}>
                <Text style={styles.fullscreenModalTitle}>Scanned Capture</Text>
                <TouchableOpacity
                  style={styles.fullscreenCloseBtn}
                  onPress={() => setIsFullscreenModalOpen(false)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.fullscreenImageContainer}>
                {frozenImageUri && (
                  <ScannedImage
                    uri={frozenImageUri}
                    predictions={predictions}
                    imageSize={sourceImageSize}
                    style={StyleSheet.absoluteFill}
                    fit="contain"
                  />
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <View
      style={styles.container}
      onLayout={({ nativeEvent }) => setCameraLayout(nativeEvent.layout)}
    >
      <VisionCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={cameraIsActive}
        torchMode={torch ? 'on' : 'off'}
      />

      <DetectionBoxes
        predictions={predictions}
        imageSize={sourceImageSize}
        containerSize={cameraLayout}
        fit="cover"
      />

      {cameraIsActive && showInitialGuidance && (
        <View pointerEvents="none" style={styles.guidanceCard}>
          <Text style={styles.guidanceText}>
            Kindly position the ingredients close to the camera and ensure they are clearly visible.
          </Text>
        </View>
      )}
      {cameraIsActive && showNoDetectionReminder && (
        <View pointerEvents="none" style={styles.guidanceCard}>
          <Text style={styles.guidanceTitle}>Having trouble recognizing the ingredient?</Text>
          <Text style={styles.guidanceText}>
            Kindly move the ingredient closer to the camera and ensure it is clearly visible.
          </Text>
        </View>
      )}

      <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              resetScan();
              router.navigate('/');
            }}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            {cameraPosition === 'back' && device?.hasTorch && (
              <TouchableOpacity
                style={[styles.iconBtn, torch && styles.torchActive]}
                onPress={toggleTorch}
              >
                {torch ? (
                  <Flashlight size={21} color="white" />
                ) : (
                  <FlashlightOff size={21} color="white" />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setCameraPosition((p) => (p === 'back' ? 'front' : 'back'))}
            >
              <SwitchCamera size={21} color="white" />
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
            <ChefHat size={20} color="white" />
            <Text style={styles.primaryBtnText}>
              Review Ingredients ({matchedIngredients.length})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf4' },
  permissionPage: {
    flex: 1,
    backgroundColor: '#fffaf4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 8,
  },
  permissionDesc: {
    fontSize: 13.5,
    color: '#858791',
    textAlign: 'center',
    marginBottom: 20,
  },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  guidanceCard: {
    position: 'absolute',
    top: '24%',
    left: 24,
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(24, 20, 18, 0.72)',
    alignItems: 'center',
  },
  guidanceTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  guidanceText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(24, 20, 18, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchActive: { backgroundColor: '#ed5108' },
  bbox: { position: 'absolute', borderWidth: 3, borderRadius: 8 },
  bboxLabel: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bboxText: { color: 'white', fontSize: 12, fontWeight: '800' },
  bottomBar: { paddingBottom: 36, paddingHorizontal: 20 },

  // Scan Results Screen (matching scan-results.html)
  resultsPage: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  iconAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecdfd4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#241910',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  screenTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#303440',
  },
  rescanLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rescanText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ed5108',
  },
  resultsScroll: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 110,
  },
  scanPhoto: {
    height: 260,
    width: '100%',
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8cec3',
    marginBottom: 18,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  accentHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ed5108',
  },
  sectionSubnote: {
    fontSize: 12,
    color: '#858791',
    marginTop: 2,
  },
  addManualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff0e6',
    borderWidth: 1,
    borderColor: '#f2c4a8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  addManualBtnText: {
    color: '#c64c0a',
    fontSize: 11.5,
    fontWeight: '800',
  },
  ingredientStack: {
    gap: 11,
    marginBottom: 18,
  },
  ingredientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    borderLeftWidth: 4,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  ingredientTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
  },
  servingSubLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#a54416',
    marginTop: 2,
  },
  per100gRefRow: {
    marginTop: 8,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#f3e8de',
  },
  per100gRefText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#737682',
  },
  confidencePill: {
    backgroundColor: '#fff0e6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  confidencePillText: {
    color: '#d94a07',
    fontSize: 11,
    fontWeight: '800',
  },
  nutritionFactsGrid: {
    flexDirection: 'row',
    gap: 7,
  },
  factBox: {
    flex: 1,
    borderRadius: 11,
    paddingVertical: 7,
    paddingHorizontal: 6,
  },
  factLabel: {
    fontSize: 10,
    color: '#858791',
    marginBottom: 3,
  },
  factValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#303440',
  },
  emptyIngredientsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    alignItems: 'center',
  },
  emptyIngredientsText: {
    fontSize: 12.5,
    color: '#858791',
    textAlign: 'center',
  },

  // Nutritional Summary Card
  summaryHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#303440',
  },
  summaryHeadNote: {
    fontSize: 12,
    color: '#858791',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e6dd',
  },
  summaryLabel: {
    fontSize: 11.5,
    color: '#858791',
    fontWeight: '600',
  },
  summaryCalories: {
    fontSize: 23,
    fontWeight: '900',
    color: '#ed5108',
    marginTop: 2,
  },
  estimateBadge: {
    backgroundColor: '#fff0e6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  estimateBadgeText: {
    color: '#a54416',
    fontSize: 11,
    fontWeight: '800',
  },
  donutAndBarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  macroBalanceCol: {
    flex: 1,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  macroNameWrap: {
    width: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#303440',
  },
  macroBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#f3ece5',
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  macroPctText: {
    minWidth: 68,
    textAlign: 'right',
    fontSize: 11.5,
    fontWeight: '800',
    color: '#303440',
  },
  summaryPer100Row: {
    marginTop: 12,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#f3e8de',
  },
  summaryPer100Text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5f626e',
  },
  summaryNote: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: '#858791',
  },
  resultsBottomBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ed5108',
    paddingVertical: 15,
    borderRadius: 15,
    shadowColor: '#ed5108',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
  disabledBtn: {
    backgroundColor: 'rgba(237, 81, 8, 0.45)',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(29, 25, 22, 0.52)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#fffaf4',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#303440',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13.5,
    color: '#303440',
    paddingVertical: 0,
  },
  modalIngRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e6dd',
  },
  modalIngName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#303440',
  },

  // Fullscreen button on photo preview
  fullscreenBtn: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(30, 25, 22, 0.76)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fullscreenBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Fullscreen Modal
  fullscreenModalBackdrop: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  fullscreenModalSafeArea: {
    flex: 1,
  },
  fullscreenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  fullscreenModalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  fullscreenCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImageContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
});
