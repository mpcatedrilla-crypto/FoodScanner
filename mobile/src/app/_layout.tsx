import '../../global.css';
import React from 'react';
import { Tabs } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Home, ScanText, HelpCircle } from 'lucide-react-native';

const barHeight = 76;
const PRIMARY_COLOR = '#ed5108';
const BG_COLOR = '#fffaf4';

export default function TabLayout() {
  return (
    <>
      <NavigationBar hidden={true} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <Tabs
          backBehavior="history"
          screenOptions={{
            sceneStyle: { backgroundColor: BG_COLOR },
            headerShown: false,
            tabBarActiveTintColor: PRIMARY_COLOR,
            tabBarInactiveTintColor: '#727481',
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              marginBottom: 4,
            },
            tabBarStyle: {
              backgroundColor: BG_COLOR,
              borderTopColor: '#f1e6dd',
              borderTopWidth: 1,
              height: barHeight,
              paddingBottom: 14,
              paddingTop: 6,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }) => <Home color={color} size={22} />,
            }}
          />

          <Tabs.Screen
            name="scan"
            options={{
              title: 'Scan',
              tabBarStyle: { display: 'none' },
              tabBarShowLabel: false,
              tabBarIconStyle: {
                width: 56,
                height: 56,
                borderRadius: 28,
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
                        backgroundColor: PRIMARY_COLOR,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: -18,
                        borderWidth: 2,
                        borderColor: '#fffaf4',
                        shadowColor: PRIMARY_COLOR,
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.35,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      <ScanText color="#ffffff" size={26} />
                    </View>
                  </TouchableOpacity>
                );
              },
            }}
          />

          <Tabs.Screen
            name="help"
            options={{
              title: 'Help',
              tabBarIcon: ({ color }) => <HelpCircle color={color} size={22} />,
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
