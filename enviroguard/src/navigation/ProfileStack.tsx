import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreenNew from '../screens/profile/ProfileScreenNew';

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={ProfileScreenNew}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
