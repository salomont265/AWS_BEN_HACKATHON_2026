import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from '@/screens/map/MapScreen';
import type { MapStackParamList } from './types';

const Stack = createStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapScreen"
        component={MapScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
