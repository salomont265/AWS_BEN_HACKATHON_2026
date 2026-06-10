import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreenNew from '../screens/profile/ProfileScreenNew';

const Stack = createStackNavigator();

export default function ProfileStack({ onLogout }: { onLogout?: () => void }) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        options={{ headerShown: false }}
      >
        {() => <ProfileScreenNew onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
