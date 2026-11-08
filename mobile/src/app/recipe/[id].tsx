/**
 * Recipe Detail Screen
 * Purpose: Displays recipe hero image, title, nutrition facts cards, and interactive ingredients checklist.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Home, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getRecipeById } from '../../lib/actions';
import type { RecipeWithIngredients } from '../../lib/types';
import { RecipeImage } from '../../components/RecipeImage';
import { scanSession } from '../../lib/scan-session';
import { getIngredientNutrition, getRecipeNutrition } from '../../lib/nutrition';
import { getPanlasangPinoyNutrition } from '../../lib/recipe-nutrition-data';

export default function CookModeScreen() {
  const { id, from, scanned, category, title } = useLocalSearchParams<{
    id: string;
    from?: string;
    scanned?: string;
    category?: string;
    title?: string;
  }>();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initStorage = async () => {
      try {
        let initialSet = new Set<string>();

        if (from === 'scan') {
          // When coming directly from a scan, checked items reflect only the currently detected ingredients.
          if (scanned) {
            const scannedIds = scanned.split(',').filter(Boolean);
            scannedIds.forEach((scannedId) => initialSet.add(scannedId));
          }
          await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...initialSet]));
        } else {
          // Normal recipe browsing: load user's previously saved checklist state.
          const stored = await AsyncStorage.getItem(`recipe_checks_${id}`);
          if (stored) {
            initialSet = new Set(JSON.parse(stored));
          }
        }

        setCheckedIngredients(initialSet);
      } catch (e) {}
    };
    initStorage();
  }, [id, scanned, from]);

  const uniqueIngredients = useMemo(() => {
    if (!recipe?.recipe_ingredients) return [];
    const seen = new Set<string>();
    return recipe.recipe_ingredients.filter((ri) => {
      const ingId = ri.ingredient?.id;
      if (!ingId || seen.has(ingId)) return false;
      seen.add(ingId);
      return true;
    });
  }, [recipe?.recipe_ingredients]);

  const recipeNutrition = useMemo(() => {
    if (!recipe) return null;
    return getRecipeNutrition(recipe);
  }, [recipe]);

  const displayNutrition = useMemo(() => {
    if (!recipe) {
      return { calories: '0', protein: '0', carbs: '0', fats: '0' };
    }
    const pp = getPanlasangPinoyNutrition(recipe.name);
    const cal = recipe.calories_per_serving ?? (recipeNutrition && recipeNutrition.perServing.calories > 0 ? recipeNutrition.perServing.calories : null) ?? pp?.calories ?? 0;
    const protein = recipe.protein_per_serving ?? (recipeNutrition && recipeNutrition.perServing.protein > 0 ? recipeNutrition.perServing.protein : null) ?? pp?.protein ?? 0;
    const carbs = recipe.carbs_per_serving ?? (recipeNutrition && recipeNutrition.perServing.carbs > 0 ? recipeNutrition.perServing.carbs : null) ?? pp?.carbs ?? 0;
    const fats = recipe.fats_per_serving ?? (recipeNutrition && recipeNutrition.perServing.fats > 0 ? recipeNutrition.perServing.fats : null) ?? pp?.fats ?? 0;

    return {
      calories: String(cal),
      protein: String(protein),
      carbs: String(carbs),
      fats: String(fats),
    };
  }, [recipe, recipeNutrition]);

  const toggleIngredient = async (ingId: string) => {
    const next = new Set(checkedIngredients);
    if (next.has(ingId)) next.delete(ingId);
    else next.add(ingId);
    setCheckedIngredients(next);
    await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...next]));
  };

  const allChecked =
    uniqueIngredients.length > 0 && checkedIngredients.size === uniqueIngredients.length;

  const toggleAll = async () => {
    if (!recipe) return;
    if (allChecked) {
      setCheckedIngredients(new Set());
      await AsyncStorage.removeItem(`recipe_checks_${id}`);
    } else {
      const allIds = uniqueIngredients.map((r) => r.ingredient?.id).filter(Boolean) as string[];
      const next = new Set(allIds);
      setCheckedIngredients(next);
      await AsyncStorage.setItem(`recipe_checks_${id}`, JSON.stringify([...next]));
    }
  };

  const handleBack = () => {
    if (from === 'scan') {
      // Return to the preserved Scan Results + Suggested Recipes state.
      scanSession.resumeResults = true;
      router.navigate('/scan');
    } else if (from === 'recipes') {
      router.navigate({
        pathname: '/recipes',
        params: {
          ...(category ? { category } : {}),
          ...(title ? { title } : {}),
        },
      });
    } else if (from && from !== 'index') {
      router.navigate(`/${from}` as any);
    } else {
      router.navigate('/');
    }
    return true;
  };

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => sub.remove();
    }, [from, category, title])
  );

  useEffect(() => {
    if (id) {
      setLoading(true);
      getRecipeById(id)
        .then((data) => {
          setRecipe(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load recipe details:', err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerPage}>
        <ActivityIndicator size="large" color="#ed5108" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.centerPage}>
        <Text style={styles.notFoundText}>Recipe not found</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleBack}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      {/* Topbar matching chicken-adobo.html */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={handleBack} style={styles.iconAction} activeOpacity={0.75}>
          <ChevronLeft size={20} color="#303440" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.screenTitle}>Recipe Details</Text>
          <Text style={styles.screenSubtitle}>Ingredients and nutrition at a glance</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.navigate('/')}
          style={styles.iconAction}
          activeOpacity={0.75}
        >
          <Home size={18} color="#303440" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dish Hero Image */}
        <View style={styles.dishHero}>
          <RecipeImage recipe={recipe} style={StyleSheet.absoluteFill} />
          <View style={styles.dishTag}>
            <Text style={styles.dishTagText}>Filipino Recipe</Text>
          </View>
        </View>

        {/* Dish Title */}
        <Text style={styles.dishTitle}>{recipe.name}</Text>

        {/* Estimated Nutrition Card */}
        <View style={styles.nutritionCard}>
          <View style={styles.nutritionCardHead}>
            <Text style={styles.nutritionCardTitle}>Nutrition information</Text>
            <View style={styles.perServingBadge}>
              <Text style={styles.perServingBadgeText}>Per serving</Text>
            </View>
          </View>

          <View style={styles.nutritionGrid}>
            <View style={[styles.nutritionMetric, { backgroundColor: '#fff8f1' }]}>
              <Text style={styles.metricLabel}>CALORIES</Text>
              <Text style={[styles.metricValue, { color: '#ed5108' }]}>
                {displayNutrition.calories} kcal
              </Text>
            </View>
            <View style={[styles.nutritionMetric, { backgroundColor: '#e8f7ee' }]}>
              <Text style={styles.metricLabel}>PROTEIN</Text>
              <Text style={styles.metricValue}>
                {displayNutrition.protein} g
              </Text>
            </View>
            <View style={[styles.nutritionMetric, { backgroundColor: '#edf4ff' }]}>
              <Text style={styles.metricLabel}>CARBS</Text>
              <Text style={styles.metricValue}>
                {displayNutrition.carbs} g
              </Text>
            </View>
            <View style={[styles.nutritionMetric, { backgroundColor: '#f6edff' }]}>
              <Text style={styles.metricLabel}>FAT</Text>
              <Text style={styles.metricValue}>
                {displayNutrition.fats} g
              </Text>
            </View>
          </View>
          {recipe.reference_url && (
            <TouchableOpacity
              style={styles.nutritionSource}
              onPress={() => void Linking.openURL(recipe.reference_url!)}
              activeOpacity={0.75}
            >
              <Text style={styles.nutritionSourceText}>Recipe source: Panlasang Pinoy ↗</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Ingredients Checklist Section */}
        {uniqueIngredients.length > 0 && (
          <View style={styles.cookSection}>
            <View style={styles.cookHead}>
              <Text style={styles.cookTitle}>Ingredients</Text>
              <TouchableOpacity
                onPress={toggleAll}
                style={styles.checkAllBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.checkAllBtnText}>
                  {allChecked ? '✓ Uncheck all' : '✓ Check all'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ingredientChecklist}>
              {uniqueIngredients.map((ri, idx) => {
                const ingId = ri.ingredient?.id || String(idx);
                const isChecked = checkedIngredients.has(ingId);
                const isLast = idx === uniqueIngredients.length - 1;

                return (
                  <TouchableOpacity
                    key={ingId}
                    onPress={() => toggleIngredient(ingId)}
                    style={[styles.ingredientRow, !isLast && styles.ingredientRowBorder]}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Check size={12} color="#ffffff" strokeWidth={3} />}
                    </View>
                    <Text
                      style={[
                        styles.ingredientLabel,
                        isChecked && styles.ingredientLabelChecked,
                      ]}
                    >
                      {ri.ingredient?.name}
                    </Text>
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

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },
  centerPage: {
    flex: 1,
    backgroundColor: '#fffaf4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 14,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
  },
  screenSubtitle: {
    fontSize: 11,
    color: '#858791',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 38,
  },
  dishHero: {
    height: 196,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  dishTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 244, 233, 0.94)',
  },
  dishTagText: {
    color: '#b8480c',
    fontSize: 11,
    fontWeight: '800',
  },
  dishTitle: {
    marginTop: 14,
    marginBottom: 12,
    fontSize: 21,
    fontWeight: '900',
    color: '#303440',
    lineHeight: 26,
  },
  nutritionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    marginBottom: 18,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  nutritionCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  nutritionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#303440',
  },
  perServingBadge: {
    backgroundColor: '#fff0e6',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  perServingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a54416',
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  nutritionSource: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  nutritionSourceText: {
    color: '#a54416',
    fontSize: 11,
    fontWeight: '700',
  },
  nutritionMetric: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3e6da',
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#858791',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#303440',
  },
  per100gRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3e8de',
  },
  per100gText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6e707a',
  },
  cookSection: {
    marginTop: 4,
    marginBottom: 16,
  },
  cookHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cookTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#303440',
  },
  cookSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#858791',
    marginTop: 1,
  },
  checkAllBtn: {
    borderWidth: 1,
    borderColor: '#f2c4a8',
    backgroundColor: '#fff1e7',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  checkAllBtnText: {
    color: '#c64c0a',
    fontSize: 12,
    fontWeight: '800',
  },
  ingredientChecklist: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee1d6',
    paddingVertical: 4,
    paddingHorizontal: 14,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  ingredientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3e8de',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#c5b8ac',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ed5108',
    borderColor: '#ed5108',
  },
  ingredientLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#303440',
  },
  ingredientLabelChecked: {
    color: '#90919a',
    textDecorationLine: 'line-through',
  },
  ingredientRefSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#858791',
    marginTop: 2,
  },
  ingredientWeightBadge: {
    backgroundColor: '#fff5ec',
    borderWidth: 1,
    borderColor: '#f3decb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ingredientWeightText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a54416',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ed5108',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '800',
  },
});
