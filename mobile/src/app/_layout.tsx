import '../../global.css';
import { Tabs } from 'expo-router';
import { useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, Bookmark, Clock, User, ScanText } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { BookmarkProvider } from '../lib/bookmark-context';
import { AuthProvider } from '../lib/auth-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <AuthProvider>
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
          name="scan"
          options={{
            title: 'Scan',
            tabBarIcon: ({ color, focused }) => (
              <View className="bg-[#0fa958] w-14 h-14 rounded-full items-center justify-center -mt-6 border-4 border-[#09090b]">
                <ScanText color="white" size={28} />
              </View>
            ),
            tabBarLabel: 'Scan',
            tabBarStyle: { display: 'none' }, // Hide tab bar when inside scan screen
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
        <Tabs.Screen name="recipes" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="recipe/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="help" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="about" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="terms" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
      </GestureHandlerRootView>
      </BookmarkProvider>
    </AuthProvider>
  );
}
