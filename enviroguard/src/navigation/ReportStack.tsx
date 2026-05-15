import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ReportScreen from '@/screens/report/ReportScreen';
import type { ReportStackParamList } from './types';

const Stack = createStackNavigator<ReportStackParamList>();

export default function ReportStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportFeed"
        component={ReportScreen}
        options={{ title: 'Reports' }}
      />
    </Stack.Navigator>
  );
}
