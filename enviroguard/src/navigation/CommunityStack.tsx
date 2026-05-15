import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CommunityScreen from '@/screens/community/CommunityScreen';
import type { CommunityStackParamList } from './types';

const Stack = createStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CommunityFeed"
        component={CommunityScreen}
        options={{ title: 'Community' }}
      />
    </Stack.Navigator>
  );
}
