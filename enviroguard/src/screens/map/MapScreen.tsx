/**
 * Map Screen - Tab 1
 * SCAFFOLD: Placeholder UI, will add map view and layers
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️</Text>
        <Text style={styles.title}>Map View</Text>
        <Text style={styles.description}>
          Placeholder for MapBox GL with risk heatmap overlay
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Coming Soon:</Text>
        <Text style={styles.infoText}>• Interactive map with station markers</Text>
        <Text style={styles.infoText}>• Toggle layers: Noise, Trash, Hazards</Text>
        <Text style={styles.infoText}>• Tap zones for Claude risk analysis</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.unit(4),
  },
  placeholderText: {
    fontSize: 64,
    marginBottom: Spacing.unit(2),
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.unit(1),
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.unit(3),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
