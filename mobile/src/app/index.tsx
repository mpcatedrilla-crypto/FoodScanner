/**
 * Home Screen
 * Purpose: Main dashboard with search bar, meal categories, featured dishes, and quick camera launch button.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';
import { RecipeImage } from '../components/RecipeImage';
import { Onboarding } from '../components/onboarding';

const CATEGORIES = [
  { label: 'All', query: '' },
  { label: 'Chicken', query: 'chicken|manok|tinola|afritada' },
  { label: 'Pork', query: 'pork|baboy|lechon|menudo|sinigang' },
  { label: 'Beef', query: 'beef|baka|caldereta|nilaga' },
  { label: 'Seafood', query: 'fish|shrimp|squid|bangus|tilapia|pusit|isda|seafood|escabeche|sinanglay' },
  { label: 'Vegetables', query: 'vegetable|gourd|eggplant|squash|gulay|pinakbet|talong|tortang|sarciado|itlog' },
];

export default function HomeScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@has_seen_onboarding').then((val) => {
      if (val !== 'true') setShowOnboarding(true);
      setIsReady(true);
    });
  }, []);

  useEffect(() => {
    getRecipes(selectedCategory.query || undefined).then((data) => setRecipes(data));
  }, [selectedCategory]);

  const completeOnboarding = async (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      await AsyncStorage.setItem('@has_seen_onboarding', 'true');
    }
    setShowOnboarding(false);
  };

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes.slice(0, 12);
    return recipes.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.name_tagalog || '').toLowerCase().includes(q)
    );
  }, [recipes, searchQuery]);

  if (!isReady) return null;

  return (
    <>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.page}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Compact Brand Top Header */}
          <View style={styles.homeHeader}>
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                <Image
                  source={require('../../assets/images/home-logo.png')}
                  style={{ width: 42, height: 42 }}
                  contentFit="contain"
                />
              </View>
              <View>
                <Text style={styles.brandTitle}>Palayok</Text>
                <Text style={styles.brandSubtitle}>Food ingredient detection</Text>
              </View>
            </View>
          </View>

          {/* Hero Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/scan')}
            style={styles.heroCard}
          >
            <Image
              source={require('../assets/images/home_bg.jpg')}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
            <LinearGradient
              colors={['rgba(36, 22, 14, 0.80)', 'rgba(36, 22, 14, 0.48)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Start with what's in your kitchen.</Text>
              <Text style={styles.heroSubtitle}>
                Scan a food photo to identify ingredients, see nutrition, and find recipe ideas.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Available Recipes Section */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Available recipes</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  selectedCategory.query
                    ? `/recipes?category=${encodeURIComponent(selectedCategory.query)}&title=${encodeURIComponent(selectedCategory.label)}`
                    : '/recipes'
                )
              }
            >
              <Text style={styles.textLink}>View all ›</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            A few Filipino dishes to inspire your next meal
          </Text>

          {/* Search Input */}
          <View style={styles.searchBox}>
            <Search size={17} color="#8c8e98" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes"
              placeholderTextColor="#9a9ca6"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter Chips (Preserving Category Filtering) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const active = selectedCategory.label === cat.label;
              return (
                <TouchableOpacity
                  key={cat.label}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.categoryChip, active && styles.categoryChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Home Recipe Cards List */}
          <View style={styles.recipeGrid}>
            {filteredRecipes.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recipeCard}
                activeOpacity={0.82}
                onPress={() => router.push(`/recipe/${item.id}?from=index` as any)}
              >
                <RecipeImage recipe={item} style={styles.recipeThumb} />
                <View style={styles.recipeCardBody}>
                  <Text style={styles.recipeCardTitle} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
                <ChevronRight size={20} color="#ed5108" style={{ marginRight: 14 }} />
              </TouchableOpacity>
            ))}

            {filteredRecipes.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No matching recipes found.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 32,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#303440',
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#858791',
    marginTop: 1,
  },
  heroCard: {
    minHeight: 168,
    borderRadius: 19,
    padding: 18,
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#482208',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  heroCopy: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  heroTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '700',
    color: '#fff7ef',
    marginBottom: 5,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: 'rgba(255, 247, 239, 0.88)',
    textAlign: 'center',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#303440',
  },
  textLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ed5108',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#858791',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd5',
    borderRadius: 14,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 13.5,
    color: '#303440',
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd5',
  },
  categoryChipActive: {
    backgroundColor: '#ed5108',
    borderColor: '#ed5108',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#696c77',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  recipeGrid: {
    gap: 10,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0e5dc',
    minHeight: 68,
    overflow: 'hidden',
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recipeThumb: {
    width: 68,
    height: 68,
  },
  recipeCardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  recipeCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#303440',
    lineHeight: 18,
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ead9cb',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#858791',
  },
});
