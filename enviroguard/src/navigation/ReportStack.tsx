import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ReportScreenNew from '@/screens/report/ReportScreenNew';
import type { ReportStackParamList } from './types';

const Stack = createStackNavigator<ReportStackParamList>();

export default function ReportStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ReportFeed"
        component={ReportScreenNew}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
