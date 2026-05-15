/**
 * Navigation Types for EnviroGuard
 *
 * WHY: Type-safe navigation prevents runtime errors when navigating between screens
 * AI-FRIENDLY: Each screen's expected params are clearly defined
 *
 * PRODUCTION-READY: These types are final, navigation structure is solid
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { StackScreenProps } from '@react-navigation/stack';

// ===== AUTH STACK =====

export type AuthStackParamList = {
  Login: undefined;
  Onboarding: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  StackScreenProps<AuthStackParamList, T>;

// ===== MAP STACK (Tab 1) =====

export type MapStackParamList = {
  MapScreen: undefined;
  ZoneDetail: {
    zoneId: string;
  };
};

export type MapScreenProps<T extends keyof MapStackParamList> =
  CompositeScreenProps<
    StackScreenProps<MapStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ===== HEALTH STACK (Tab 2) =====

export type HealthStackParamList = {
  HealthDashboard: undefined;
  AlertDetail: {
    alertId: string;
  };
};

export type HealthScreenProps<T extends keyof HealthStackParamList> =
  CompositeScreenProps<
    StackScreenProps<HealthStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ===== REPORT STACK (Tab 3) =====

export type ReportStackParamList = {
  ReportFeed: undefined;
  ReportDetail: {
    reportId: string;
  };
  SubmitReport: undefined;
};

export type ReportScreenProps<T extends keyof ReportStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ReportStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ===== COMMUNITY STACK (Tab 4) =====

export type CommunityStackParamList = {
  CommunityFeed: undefined;
  PostDetail: {
    postId: string;
  };
  EventDetail: {
    eventId: string;
  };
  LetterGenerator: undefined;
};

export type CommunityScreenProps<T extends keyof CommunityStackParamList> =
  CompositeScreenProps<
    StackScreenProps<CommunityStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ===== PROFILE STACK (Tab 5) =====

export type ProfileStackParamList = {
  Profile: undefined;
  EditHealth: undefined;
  Thresholds: undefined;
};

export type ProfileScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    StackScreenProps<ProfileStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

// ===== MAIN TAB NAVIGATOR =====

export type MainTabParamList = {
  MapTab: NavigatorScreenParams<MapStackParamList>;
  HealthTab: NavigatorScreenParams<HealthStackParamList>;
  ReportTab: NavigatorScreenParams<ReportStackParamList>;
  CommunityTab: NavigatorScreenParams<CommunityStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;

// ===== ROOT NAVIGATOR =====

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type RootScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

// ===== GLOBAL NAVIGATION PROP =====
// Use this when you need navigation from context without screen props
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
