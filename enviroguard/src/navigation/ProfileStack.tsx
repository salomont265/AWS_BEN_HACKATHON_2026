import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import type { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
}
