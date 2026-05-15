/**
 * Profile Screen - Tab 5
 * SCAFFOLD: Placeholder UI
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>user@example.com</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Conditions</Text>
        <View style={styles.chipContainer}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Asthma</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Sleep Disorder</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert Thresholds</Text>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Noise Level</Text>
          <Text style={styles.thresholdValue}>85 dB</Text>
        </View>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Bin Fill Level</Text>
          <Text style={styles.thresholdValue}>80%</Text>
        </View>
        <View style={styles.thresholdRow}>
          <Text style={styles.thresholdLabel}>Hazard Proximity</Text>
          <Text style={styles.thresholdValue}>500m</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Saved Locations</Text>
        <View style={styles.locationCard}>
          <Text style={styles.locationIcon}>🏠</Text>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Home</Text>
            <Text style={styles.locationAddress}>123 Main St, City, State</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Coming Soon:</Text>
        <Text style={styles.infoText}>• Edit health conditions</Text>
        <Text style={styles.infoText}>• Customize alert thresholds</Text>
        <Text style={styles.infoText}>• Manage saved locations</Text>
        <Text style={styles.infoText}>• Sync across devices</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.unit(4),
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.unit(2),
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    ...Typography.title,
    marginBottom: Spacing.unit(0.5),
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.screenPadding,
    marginTop: Spacing.unit(2),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(2),
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.unit(1),
  },
  chip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.unit(2),
    paddingVertical: Spacing.unit(1),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipText: {
    ...Typography.body,
    color: Colors.primary,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.unit(1.5),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  thresholdLabel: {
    ...Typography.body,
  },
  thresholdValue: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.unit(2),
    backgroundColor: Colors.background,
    borderRadius: 12,
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
  infoBox: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  infoText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
});
