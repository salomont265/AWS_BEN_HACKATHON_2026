import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CommunityScreenNew from '@/screens/community/CommunityScreenNew';
import type { CommunityStackParamList } from './types';

const Stack = createStackNavigator<CommunityStackParamList>();

export default function CommunityStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CommunityFeed"
        component={CommunityScreenNew}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
