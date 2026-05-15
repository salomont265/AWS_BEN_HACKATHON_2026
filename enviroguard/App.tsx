/**
 * EnviroGuard App Entry Point
 *
 * SCAFFOLD: Functional app with 5 tabs and placeholder UI
 * See README.md for setup and migration instructions
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation';

export default function App() {
  return (
    <>
      <RootNavigator />
      <StatusBar style="auto" />
    </>
  );
}
