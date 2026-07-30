import '../../global.css';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Bookmark, Clock, User, ScanText } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { BookmarkProvider } from '../lib/bookmark-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <BookmarkProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.background,
            borderTopColor: theme.backgroundElement,
          },
          tabBarActiveTintColor: '#0fa958', // primary green
          tabBarInactiveTintColor: theme.textSecondary,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            title: 'Saved',
            tabBarIcon: ({ color }) => <Bookmark color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <User color={color} size={24} />,
          }}
        />
        {/* Hidden routes */}
        <Tabs.Screen name="scan" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="recipes" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="recipe/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
      </GestureHandlerRootView>
    </BookmarkProvider>
  );
}
