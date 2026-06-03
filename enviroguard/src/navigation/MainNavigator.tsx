/**
 * Main Tab Navigator
 * WHY: Bottom tabs are the primary navigation pattern
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '@/theme/tokens';
import type { MainTabParamList } from './types';

// Import tab stacks
import HomeScreen from '../screens/home/HomeScreen';
import MapStack from './MapStack';
import HealthStack from './HealthStack';
import ReportStack from './ReportStack';
import CommunityStack from './CommunityStack';
import ProfileStack from './ProfileStack';
import APITestScreen from '../screens/APITestScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: '🏠 Home',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{
          tabBarLabel: '🗺️ Map',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthStack}
        options={{
          tabBarLabel: '📊 Health',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportStack}
        options={{
          tabBarLabel: '📝 Report',
          tabBarIcon: () => null,
        }}
      />
      <Tab.Screen
        name="CommunityTab"
        component={CommunityStack}
        options={{
          tabBarLabel: '👥 Community',
          tabBarIcon: () => null,
        }}
      />
    </Tab.Navigator>
  );
}
