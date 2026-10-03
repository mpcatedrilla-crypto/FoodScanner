import { Image } from 'expo-image';
import '../../global.css';
import React from 'react';
import { Tabs } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, ScanText, HelpCircle } from 'lucide-react-native';

const barHeight = 70;
const PRIMARY_COLOR = '#ea580c';
const BG_COLOR = '#FFF9F2';

export default function TabLayout() {
  return (
    <>
      <NavigationBar hidden={true} />
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Tabs
        
        screenOptions={{ sceneStyle: { backgroundColor: '#FFF9F2' },
          headerShown: false,
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: '#a1a1aa',
          tabBarStyle: {
            backgroundColor: BG_COLOR,
            borderTopColor: 'rgba(234, 88, 12, 0.15)',
            height: barHeight,
            paddingBottom: 10,
            paddingTop: 8,
          },
        }}
      >
        {/* Visible Tab 0: Home */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />

        {/* Visible Tab 1: Scan (50% Center & Prominent 52x52) */}
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            tabBarStyle: { display: 'none' },
            tabBarShowLabel: false,
            tabBarIconStyle: {
              width: 56, height: 56, borderRadius: 28,
                justifyContent: 'center',
              alignItems: 'center',
            },
            tabBarButton: (props) => {
              const { delayLongPress, ...rest } = props as any;
              return (
                <TouchableOpacity
                  {...rest}
                  delayLongPress={delayLongPress ?? undefined}
                  activeOpacity={0.85}
                  style={[
                    props.style,
                    {
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: '#ea580c',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#ea580c',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 6,
                    }}
                  >
                    <ScanText color="#ffffff" size={28} />
                  </View>
              </TouchableOpacity>
            );
          },
        }}
      />

        {/* Visible Tab 2: Help / Tutorial */}
        <Tabs.Screen
          name="help"
          options={{
            title: 'Help',
            tabBarIcon: ({ color }) => <HelpCircle color={color} size={24} />,
          }}
        />

        {/* Hidden routes */}
        <Tabs.Screen name="history" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="recipes" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="recipe/[id]" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="about" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="terms" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="tutorial" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="saved" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      </Tabs>
    </GestureHandlerRootView>
    </>
  );
}




