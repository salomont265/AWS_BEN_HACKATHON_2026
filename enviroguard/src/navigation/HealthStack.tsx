import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HealthScreen from '@/screens/health/HealthScreen';
import type { HealthStackParamList } from './types';

const Stack = createStackNavigator<HealthStackParamList>();

export default function HealthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HealthDashboard"
        component={HealthScreen}
        options={{ title: 'Health & Alerts' }}
      />
    </Stack.Navigator>
  );
}
