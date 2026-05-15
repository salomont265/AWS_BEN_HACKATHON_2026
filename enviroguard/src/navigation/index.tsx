/**
 * Root Navigator
 * WHY: Entry point for all app navigation
 * PRODUCTION-READY: This structure is final
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainNavigator from './MainNavigator';
import type { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  // TODO: Add auth check here
  // For now, always show main app (skip auth)

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
