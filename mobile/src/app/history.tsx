import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useFocusEffect } from 'expo-router';

export default function HistoryScreen() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      async function loadHistory() {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('ingredient_scans')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(30);

          if (isActive && data) setHistory(data);
        } catch (e) {
          console.warn('Error loading history:', e);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      loadHistory();

      return () => {
        isActive = false;
      };
    }, [])
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <View className="px-6 py-4 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Scan History</Text>
      </View>
      {loading && history.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, idx) => item.id?.toString() ?? idx.toString()}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 opacity-50">
              <Clock size={48} color="white" className="mb-4" />
              <Text className="text-white text-lg font-semibold">No history yet</Text>
              <Text className="text-white/60 text-center mt-2">Your scanned ingredients will automatically be saved here.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const date = item.created_at ? new Date(item.created_at) : new Date();
            return (
              <View className="bg-card p-5 rounded-2xl mb-4 border border-border shadow-sm">
                <Text className="text-muted-foreground text-xs font-semibold mb-3">
                  {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(item.detected_classes || []).map((c: string, i: number) => (
                    <View key={i} className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                      <Text className="text-primary text-sm font-medium capitalize">{c}</Text>
                    </View>
                  ))}
                  {(!item.detected_classes || item.detected_classes.length === 0) && (
                    <Text className="text-muted-foreground italic">Unknown scan</Text>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
