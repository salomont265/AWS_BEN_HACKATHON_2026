/**
 * Profile Screen - Tab 5
 * Shows user profile and settings
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Switch } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchProfile, UserProfile } from '../../services/usersService';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // In fake data mode, this returns fake user
      const data = await fetchProfile('user_001');
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Conditions</Text>
        <Card style={styles.healthCard}>
          <View style={styles.chipContainer}>
            {healthConditions.length > 0 ? (
              healthConditions.map((condition) => (
                <View key={condition} style={styles.chip}>
                  <Text style={styles.chipText}>{condition}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No conditions listed</Text>
            )}
          </View>
          <View style={styles.ageGroupRow}>
            <Text style={styles.ageGroupLabel}>Age Group:</Text>
            <Text style={styles.ageGroupValue}>{profile.health.age_group}</Text>
          </View>
        </Card>
      </View>

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Neighborhoods</Text>
        {profile.neighborhoods.map((neighborhood) => (
          <View key={neighborhood.id} style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>{neighborhood.label}</Text>
              <Text style={styles.locationAddress}>
                {neighborhood.lat.toFixed(4)}, {neighborhood.lng.toFixed(4)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>🔊 Noise Alerts</Text>
          <Text style={styles.prefValue}>{profile.notification_prefs.noise ? 'ON' : 'OFF'}</Text>
        </View>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>💨 Air Quality Alerts</Text>
          <Text style={styles.prefValue}>{profile.notification_prefs.air ? 'ON' : 'OFF'}</Text>
        </View>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>🗑️ Litter Alerts</Text>
          <Text style={styles.prefValue}>{profile.notification_prefs.litter ? 'ON' : 'OFF'}</Text>
        </View>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>🌸 Pollen Alerts</Text>
          <Text style={styles.prefValue}>{profile.notification_prefs.pollen ? 'ON' : 'OFF'}</Text>
        </View>
        <Text style={styles.metaText}>
          Quiet Hours: {profile.notification_prefs.quiet_hours.start} - {profile.notification_prefs.quiet_hours.end}
        </Text>
      </View>

      <View style={styles.section}>
        <Button
          title="Sign Out"
          variant="danger"
          fullWidth
          icon="👋"
          onPress={() => console.log('Sign out')}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Connected to User Service</Text>
        <Text style={styles.infoText}>• Loaded profile from fake data</Text>
        <Text style={styles.infoText}>• User ID: {profile.user_id}</Text>
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
    marginBottom: Spacing.unit(2),
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
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.unit(1.5),
    paddingHorizontal: Spacing.unit(3),
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.surface,
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
  healthCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.unit(2),
    marginHorizontal: -Spacing.unit(0.5),
  },
  chip: {
    backgroundColor: Colors.surface,
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
  },
  ageGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageGroupLabel: {
    ...Typography.body,
    marginRight: Spacing.unit(1),
  },
  ageGroupValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.unit(2),
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: Spacing.unit(1),
  },
  locationIcon: {
    fontSize: 32,
    marginRight: Spacing.unit(2),
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(0.5),
  },
  locationAddress: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.unit(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prefLabel: {
    ...Typography.body,
  },
  prefValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  infoBox: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.unit(4),
  },
  infoTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
    color: Colors.primary,
  },
  infoText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
});
