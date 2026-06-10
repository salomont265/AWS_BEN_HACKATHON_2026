/**
 * Main Tab Navigator with Custom Animated Tab Bar
 */

import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/theme/tokens';
import type { MainTabParamList } from './types';

// Import tab stacks
import HomeScreen from '../screens/home/HomeScreen';
import MapStack from './MapStack';
import HealthStack from './HealthStack';
import ReportStack from './ReportStack';
import CommunityStack from './CommunityStack';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator<MainTabParamList>();
const { width: screenWidth } = Dimensions.get('window');
const tabCount = 6;
const tabWidth = screenWidth / tabCount;
const dotSize = 6;

// Individual Animated Tab Button
function TabButton({
  isFocused,
  label,
  iconName,
  onPress,
  onLongPress,
}: {
  isFocused: boolean;
  label: string;
  iconName: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 200 }),
        withSpring(1.0, { damping: 12, stiffness: 150 })
      );
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={iconName as any}
          size={20}
          color={isFocused ? Colors.primary : Colors.textSecondary}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? Colors.primary : Colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// Custom Bottom Tab Bar Component
function CustomTabBar({ state, descriptors, navigation }: any) {
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    indicatorX.value = withSpring(
      state.index * tabWidth + tabWidth / 2 - dotSize / 2,
      { damping: 18, stiffness: 200 }
    );
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
    };
  });

  const getTabInfo = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'HomeTab':
        return { label: 'Home', icon: isFocused ? 'home' : 'home-outline' };
      case 'MapTab':
        return { label: 'Map', icon: isFocused ? 'map' : 'map-outline' };
      case 'HealthTab':
        return { label: 'Health', icon: isFocused ? 'stats-chart' : 'stats-chart-outline' };
      case 'ReportTab':
        return { label: 'Report', icon: isFocused ? 'document-text' : 'document-text-outline' };
      case 'CommunityTab':
        return { label: 'Community', icon: isFocused ? 'people' : 'people-outline' };
      case 'ProfileTab':
        return { label: 'Profile', icon: isFocused ? 'person' : 'person-outline' };
      default:
        return { label: 'Tab', icon: 'square-outline' };
    }
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Sliding indicator dot */}
      <Animated.View style={[styles.tabIndicator, indicatorStyle]} />

      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          const tabInfo = getTabInfo(route.name, isFocused);

          return (
            <TabButton
              key={route.key}
              isFocused={isFocused}
              label={tabInfo.label}
              iconName={tabInfo.icon}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function MainNavigator({ onLogout }: { onLogout?: () => void }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MapTab" component={MapStack} />
      <Tab.Screen name="HealthTab" component={HealthStack} />
      <Tab.Screen name="ReportTab" component={ReportStack} />
      <Tab.Screen name="CommunityTab" component={CommunityStack} />
      <Tab.Screen name="ProfileTab">
        {() => <ProfileStack onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D3D1C7',
    height: Platform.OS === 'ios' ? 76 : 64,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    position: 'relative',
  },
  tabsRow: {
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 0,
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: Colors.primary,
  },
});
