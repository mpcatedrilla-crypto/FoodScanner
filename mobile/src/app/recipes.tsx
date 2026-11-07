import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  BackHandler,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Home, Search, ChevronRight } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { RecipeImage } from '../components/RecipeImage';
import { getRecipes } from '../lib/actions';
import type { Recipe } from '../lib/types';

export default function RecipesScreen() {
  const params = useLocalSearchParams<{ category?: string | string[]; title?: string | string[] }>();
  const categoryParam = Array.isArray(params.category) ? params.category[0] : params.category;
  const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    router.navigate('/');
    return true;
  };

  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    setLoading(true);
    getRecipes(categoryParam)
      .then((data: Recipe[]) => {
        setRecipes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load recipes', err);
        setLoading(false);
      });
  }, [categoryParam]);

  const headingTitle = titleParam ? `${titleParam} recipes` : 'Filipino favorites';

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.name_tagalog || '').toLowerCase().includes(q)
    );
  }, [recipes, searchQuery]);

  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      {/* Topbar matching recipes.html */}
      <View style={styles.topbar}>
        <TouchableOpacity onPress={handleBack} style={styles.iconAction} activeOpacity={0.75}>
          <ChevronLeft size={20} color="#303440" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Recipes</Text>
        <TouchableOpacity
          onPress={() => router.navigate('/')}
          style={styles.iconAction}
          activeOpacity={0.75}
        >
          <Home size={18} color="#303440" />
        </TouchableOpacity>
      </View>

      <View style={styles.headerBlock}>
        <Text style={styles.pageHeading}>{headingTitle}</Text>
        <Text style={styles.pageSubtitle}>
          Tap a dish to view its ingredients and estimated nutrition.
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
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#ed5108" />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>No matching recipes found.</Text>
          <Text style={styles.emptySub}>Try another keyword or browse all Filipino dishes.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/recipe/[id]',
                  params: {
                    id: item.id,
                    from: 'recipes',
                    ...(categoryParam ? { category: categoryParam } : {}),
                    ...(titleParam ? { title: titleParam } : {}),
                  },
                })
              }
              style={styles.recipeCard}
              activeOpacity={0.84}
            >
              <RecipeImage recipe={item} style={styles.recipePhoto} />
              <View style={styles.recipeCardBody}>
                <Text style={styles.recipeCardTitle} numberOfLines={2}>
                  {item.name}
                </Text>
                <ChevronRight size={16} color="#ed5108" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
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
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
  },
  headerBlock: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 6,
  },
  pageHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12.5,
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
    marginBottom: 8,
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
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 36,
  },
  columnWrapper: {
    gap: 12,
    marginBottom: 12,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0e5dc',
    overflow: 'hidden',
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  recipePhoto: {
    width: '100%',
    height: 104,
  },
  recipeCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 6,
  },
  recipeCardTitle: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#303440',
    lineHeight: 17,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#858791',
    marginTop: 10,
    fontWeight: '600',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#858791',
    textAlign: 'center',
  },
});
