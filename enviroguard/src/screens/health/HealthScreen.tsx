/**
 * Health & Alerts Screen - Tab 2
 * SCAFFOLD: Placeholder UI
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';

export default function HealthScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Health Dashboard</Text>
        <Text style={styles.headerSubtitle}>24-hour forecasts & personalized alerts</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Forecast Timeline</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Horizontal scroll with 24 hourly bars
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Risk Briefing</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Claude-generated personalized insights
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alert History</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Recent alerts list</Text>
        </View>
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
    backgroundColor: Colors.primary,
    padding: Spacing.unit(3),
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.surface,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.primaryLight,
  },
  section: {
    padding: Spacing.screenPadding,
    marginBottom: Spacing.unit(2),
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(2),
  },
  placeholder: {
    backgroundColor: Colors.surface,
    padding: Spacing.unit(4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  placeholderText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
});
