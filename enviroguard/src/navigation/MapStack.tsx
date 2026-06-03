import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreenNew from '@/screens/map/MapScreenNew';
import type { MapStackParamList } from './types';

const Stack = createStackNavigator<MapStackParamList>();

export default function MapStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MapScreen"
        component={MapScreenNew}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
