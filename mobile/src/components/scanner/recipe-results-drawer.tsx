import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ChefHat, X, ChevronRight } from 'lucide-react-native';
import { RecipeImage } from '../RecipeImage';
import { router } from 'expo-router';
import type { RecipeMatch, Ingredient } from '../../lib/types';

interface RecipeResultsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe?: () => void;
  recipes: RecipeMatch[];
  detectedIngredients: Ingredient[];
}

export function RecipeResultsDrawer({
  isOpen,
  onClose,
  onSelectRecipe,
  recipes,
  detectedIngredients,
}: RecipeResultsDrawerProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '88%'], []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
        pressBehavior="close"
      />
    ),
    []
  );

  const readyToCook = recipes.filter((r) => r.missingIngredients.length === 0);
  const missingIngredientsList = recipes.filter((r) => r.missingIngredients.length > 0);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={isOpen ? 1 : -1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={(idx) => {
        if (idx === -1) onClose();
      }}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.kicker}>SUGGESTED RECIPES</Text>
            <Text style={styles.title}>Filipino favorites</Text>
            <Text style={styles.subtitle}>
              Based on {detectedIngredients.length} detected ingredient
              {detectedIngredients.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.75}>
            <X size={18} color="#303440" />
          </TouchableOpacity>
        </View>

        {/* Detected ingredients chips */}
        {detectedIngredients.length > 0 && (
          <View style={styles.chipsWrap}>
            {detectedIngredients.map((ing) => (
              <View key={ing.id} style={styles.chip}>
                <Text style={styles.chipText}>{ing.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recipe list */}
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {recipes.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <ChefHat size={28} color="#ed5108" />
              </View>
              <Text style={styles.emptyTitle}>No matching recipes found</Text>
              <Text style={styles.emptySubtitle}>
                Try scanning or adding more ingredients to see suggested Filipino dishes.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 18 }}>
              {readyToCook.length > 0 && (
                <View>
                  <Text style={styles.groupTitle}>Ready to Cook</Text>
                  <View style={{ gap: 10 }}>
                    {readyToCook.map((match) => (
                      <RecipeMatchCard
                        key={match.recipe.id}
                        match={match}
                        type="ready"
                        onSelectRecipe={onSelectRecipe}
                      />
                    ))}
                  </View>
                </View>
              )}

              {missingIngredientsList.length > 0 && (
                <View>
                  <Text style={styles.groupTitle}>Suggested Filipino Dishes</Text>
                  <View style={{ gap: 10 }}>
                    {missingIngredientsList.slice(0, 5).map((match) => (
                      <RecipeMatchCard
                        key={match.recipe.id}
                        match={match}
                        type="missing"
                        onSelectRecipe={onSelectRecipe}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );
}

function RecipeMatchCard({
  match,
  type,
  onSelectRecipe,
}: {
  match: RecipeMatch;
  type: 'ready' | 'missing';
  onSelectRecipe?: () => void;
}) {
  const { recipe, missingIngredients, matchedIngredients } = match;
  const scannedParam = matchedIngredients.map((i) => i.id).join(',');
  const pct = Math.round(match.matchPercentage || 0);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={() => {
        onSelectRecipe?.();
        router.push({
          pathname: '/recipe/[id]',
          params: { id: recipe.id, from: 'scan', scanned: scannedParam },
        });
      }}
    >
      <RecipeImage recipe={recipe} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {recipe.name}
          </Text>
          {pct > 0 && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{pct}% match</Text>
            </View>
          )}
        </View>
        {type === 'ready' ? (
          <Text style={styles.readyText} numberOfLines={1}>
            All required ingredients detected
          </Text>
        ) : (
          <Text style={styles.missingText} numberOfLines={1}>
            Matched: {matchedIngredients.map((i) => i.name).join(', ')}
            {missingIngredients.length > 0
              ? ` · Need ${missingIngredients.length} more`
              : ''}
          </Text>
        )}
      </View>
      <ChevronRight size={18} color="#ed5108" style={{ marginRight: 12 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: '#fffaf4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#eadfd4',
  },
  handleIndicator: {
    backgroundColor: '#d8cec3',
    width: 42,
  },
  container: {
    flex: 1,
    backgroundColor: '#fffaf4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  kicker: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#ed5108',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#303440',
  },
  subtitle: {
    fontSize: 12,
    color: '#858791',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecdfd4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e6dd',
  },
  chip: {
    backgroundColor: '#fff0e6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: '#d94a07',
    fontSize: 11.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 90,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ed5108',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f0e5dc',
    overflow: 'hidden',
    minHeight: 74,
    shadowColor: '#251a12',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: 74,
    height: 74,
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#303440',
  },
  matchBadge: {
    backgroundColor: '#fff0e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  matchBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#d94a07',
  },
  readyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#20b968',
  },
  missingText: {
    fontSize: 11.5,
    color: '#858791',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1e6dd',
    padding: 24,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff0e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#303440',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#858791',
    textAlign: 'center',
    lineHeight: 18,
  },
});
