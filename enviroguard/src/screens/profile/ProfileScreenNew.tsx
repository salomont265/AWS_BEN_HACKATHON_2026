/**
 * Profile Screen - Phase 6 Implementation
 * Per FRONTEND_IMPLEMENTATION_PLAN.md - Profile Screen section
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { apiGet, getUserId, clearAuthToken } from '../../utils/api';

interface UserProfile {
  user_id: string;
  email: string;
  health: {
    asthma: boolean;
    copd: boolean;
    pollen_allergy: boolean;
    noise_sensitivity: boolean;
    age_group: string;
  };
  thresholds: {
    aqi: number;
    noise_db: number;
    pollen_index: number;
  };
  neighborhoods: string[];
  notification_prefs: {
    noise: boolean;
    air: boolean;
    litter: boolean;
    pollen: boolean;
    general: boolean;
    quiet_hours: {
      start: string;
      end: string;
    };
  };
  created_at: string;
}

export default function ProfileScreenNew() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      const data = await apiGet<UserProfile>(`/users/${userId}`);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearAuthToken();
            // App will restart and show login screen
            Alert.alert('Logged Out', 'Please restart the app');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button title="Retry" onPress={loadProfile} />
      </View>
    );
  }

  const healthConditions = [];
  if (profile.health.asthma) healthConditions.push('Asthma');
  if (profile.health.copd) healthConditions.push('COPD');
  if (profile.health.pollen_allergy) healthConditions.push('Pollen Allergy');
  if (profile.health.noise_sensitivity) healthConditions.push('Noise Sensitivity');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{profile.email.split('@')[0]}</Text>
            <Text style={styles.email}>{profile.email}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Health Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Conditions</Text>
          <Card>
            {healthConditions.length > 0 ? (
              <View style={styles.chipContainer}>
                {healthConditions.map((condition) => (
                  <View key={condition} style={styles.chip}>
                    <Text style={styles.chipText}>{condition}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No conditions listed</Text>
            )}
            <Text style={styles.metaText}>Age Group: {profile.health.age_group}</Text>
          </Card>
        </View>

        {/* Alert Thresholds */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
          <Card>
            <View style={styles.thresholdRow}>
              <View style={styles.thresholdLeft}>
                <Text style={styles.thresholdIcon}>💨</Text>
                <Text style={styles.thresholdLabel}>AQI Threshold</Text>
              </View>
              <Text style={styles.thresholdValue}>{profile.thresholds.aqi}</Text>
            </View>
            <View style={styles.thresholdRow}>
              <View style={styles.thresholdLeft}>
                <Text style={styles.thresholdIcon}>🔊</Text>
                <Text style={styles.thresholdLabel}>Noise Level</Text>
              </View>
              <Text style={styles.thresholdValue}>{profile.thresholds.noise_db} dB</Text>
            </View>
            <View style={[styles.thresholdRow, styles.thresholdRowLast]}>
              <View style={styles.thresholdLeft}>
                <Text style={styles.thresholdIcon}>🌸</Text>
                <Text style={styles.thresholdLabel}>Pollen Index</Text>
              </View>
              <Text style={styles.thresholdValue}>{profile.thresholds.pollen_index}</Text>
            </View>
          </Card>
        </View>

        {/* Neighborhoods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Neighborhoods</Text>
          {profile.neighborhoods.map((neighborhood) => (
            <Card key={neighborhood} style={styles.neighborhoodCard}>
              <Text style={styles.neighborhoodIcon}>📍</Text>
              <Text style={styles.neighborhoodText}>{neighborhood}</Text>
            </Card>
          ))}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Preferences</Text>
          <Card>
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>🔊 Noise Alerts</Text>
              <Text style={styles.prefValue}>
                {profile.notification_prefs.noise ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>💨 Air Quality Alerts</Text>
              <Text style={styles.prefValue}>
                {profile.notification_prefs.air ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={styles.prefRow}>
              <Text style={styles.prefLabel}>🗑️ Litter Alerts</Text>
              <Text style={styles.prefValue}>
                {profile.notification_prefs.litter ? 'ON' : 'OFF'}
              </Text>
            </View>
            <View style={[styles.prefRow, styles.prefRowLast]}>
              <Text style={styles.prefLabel}>🌸 Pollen Alerts</Text>
              <Text style={styles.prefValue}>
                {profile.notification_prefs.pollen ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Card>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button
            title="Logout"
            icon="👋"
            variant="danger"
            fullWidth
            onPress={handleLogout}
          />
        </View>

        <View style={{ height: Spacing.unit(4) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    ...Typography.body,
    color: Colors.danger,
    marginBottom: Spacing.unit(2),
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.unit(6),
    paddingBottom: Spacing.unit(3),
    paddingHorizontal: Spacing.screenPadding,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.unit(2),
  },
  avatarText: {
    fontSize: 36,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: Spacing.unit(0.5),
  },
  email: {
    ...Typography.body,
    color: Colors.primaryLight,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.unit(3),
  },
  sectionTitle: {
    ...Typography.title,
    marginBottom: Spacing.unit(2),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.unit(2),
    marginHorizontal: -Spacing.unit(0.5),
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.unit(2),
    paddingVertical: Spacing.unit(1),
    margin: Spacing.unit(0.5),
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.unit(2),
  },
  metaText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.unit(2),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thresholdRowLast: {
    borderBottomWidth: 0,
  },
  thresholdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdIcon: {
    fontSize: 24,
    marginRight: Spacing.unit(1.5),
  },
  thresholdLabel: {
    ...Typography.body,
  },
  thresholdValue: {
    ...Typography.subtitle,
    fontWeight: '700',
    color: Colors.primary,
  },
  neighborhoodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.unit(1.5),
  },
  neighborhoodIcon: {
    fontSize: 24,
    marginRight: Spacing.unit(1.5),
  },
  neighborhoodText: {
    ...Typography.subtitle,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.unit(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prefRowLast: {
    borderBottomWidth: 0,
  },
  prefLabel: {
    ...Typography.body,
  },
  prefValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
});
