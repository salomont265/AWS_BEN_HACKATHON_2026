/**
 * Report Screen - Tab 3
 * SCAFFOLD: Placeholder UI
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';

export default function ReportScreen() {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📝 Hazard Reports</Text>
          <Text style={styles.headerSubtitle}>Submit and view environmental reports</Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.cardTitle}>Sample Report #1</Text>
          <Text style={styles.cardText}>Water contamination - High severity</Text>
          <Text style={styles.cardMeta}>0.3 mi • Reported 2h ago</Text>
        </View>

        <View style={styles.reportCard}>
          <Text style={styles.cardTitle}>Sample Report #2</Text>
          <Text style={styles.cardText}>Noise pollution - Medium severity</Text>
          <Text style={styles.cardMeta}>0.5 mi • Reported 4h ago</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Coming Soon:</Text>
          <Text style={styles.infoText}>• Take photo of hazard</Text>
          <Text style={styles.infoText}>• Claude Vision AI analysis</Text>
          <Text style={styles.infoText}>• Submit to community feed</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.unit(3),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.title,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  reportCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  cardText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
  cardMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoBox: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
  },
  infoTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  infoText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
  fab: {
    position: 'absolute',
    right: Spacing.unit(2),
    bottom: Spacing.unit(2),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: Colors.surface,
    fontWeight: '300',
  },
});
