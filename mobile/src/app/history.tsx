import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { getRecipeHistory, deleteRecipeHistory } from '../lib/actions';
import { useAuth } from '../lib/auth-context';
import { RecipeCardRow } from '../components/RecipeCardRow';
import type { Recipe } from '../lib/types';

export default function HistoryScreen() {
  const { session } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function loadHistory() {
        if (!session?.user) {
          if (isActive) {
            setHistory([]);
            setLoading(false);
          }
          return;
        }

        setLoading(true);
        const fetched = await getRecipeHistory(session.user.id);
        if (isActive) {
          setHistory(fetched || []);
          setLoading(false);
        }
      }

      loadHistory();
      return () => { isActive = false; };
    }, [session])
  );

  const removeHistoryItem = async (id: string) => {
    const success = await deleteRecipeHistory(id);
    if (success) {
      setHistory(prev => prev.filter(r => r.id !== id));
    } else {
      Alert.alert('Error', 'Failed to delete history item');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!session) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-400 text-center text-lg">Please login in Profile tab to save your history.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-[#09090b]">
      <View className="px-6 py-6 pb-4">
        <Text className="text-white text-xl font-extrabold uppercase tracking-widest">HISTORY</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0fa958" />
        </View>
      ) : history.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-gray-400 text-center text-lg">No history yet.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const recipe = item.recipes;
            if (!recipe) return null;
            return (
              <RecipeCardRow 
                recipe={recipe}
                dateText={formatDate(item.created_at)}
                showTrash={true}
                onTrashPress={() => removeHistoryItem(item.id)}
                onPress={() => router.push('/recipe/' + recipe.id)}
              />
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
