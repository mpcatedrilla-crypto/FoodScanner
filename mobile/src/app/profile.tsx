import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center">
      <Text className="text-2xl font-bold text-foreground">Profile</Text>
      <Text className="text-muted-foreground mt-2">Manage your account settings here.</Text>
    </SafeAreaView>
  );
}
