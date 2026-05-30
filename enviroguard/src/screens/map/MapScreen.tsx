/**
 * Map Screen - Tab 1
 * Shows environmental risk zones
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchMapData, MapZone } from '../../services/mapService';

export default function MapScreen() {
  const [zones, setZones] = useState<MapZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'api' | 'community'>('api');

  useEffect(() => {
    loadMapData();
  }, [mode]);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const data = await fetchMapData(40.7081, -73.9571, mode);
      setZones(data);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: '#4CAF50',
      moderate: '#FFC107',
      high: '#FF9800',
      very_high: '#F44336'
    };
    return colors[severity] || Colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Environmental Risk Map</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'api' && styles.modeButtonActive]}
            onPress={() => setMode('api')}
          >
            <Text style={[styles.modeText, mode === 'api' && styles.modeTextActive]}>
              API Data
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'community' && styles.modeButtonActive]}
            onPress={() => setMode('community')}
          >
            <Text style={[styles.modeText, mode === 'community' && styles.modeTextActive]}>
              Community
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️</Text>
        <Text style={styles.title}>Interactive Map</Text>
        <Text style={styles.description}>
          Real map view coming soon with MapBox
        </Text>
      </View>

      {zones.map((zone) => (
        <View key={zone.neighborhood_id} style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <Text style={styles.zoneName}>{zone.name}</Text>
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(zone.severity) }]}>
              <Text style={styles.severityText}>{zone.severity.toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.scoreText}>Risk Score: {zone.composite_score}/100</Text>

          <View style={styles.layersGrid}>
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>🔊 Noise</Text>
              <Text style={styles.layerValue}>{zone.layers.noise.index}</Text>
            </View>
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>💨 AQI</Text>
              <Text style={styles.layerValue}>{zone.layers.air.aqi}</Text>
            </View>
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>🗑️ Litter</Text>
              <Text style={styles.layerValue}>{zone.layers.litter.complaint_count_24h}</Text>
            </View>
            <View style={styles.layerItem}>
              <Text style={styles.layerLabel}>🌸 Pollen</Text>
              <Text style={styles.layerValue}>{zone.layers.pollen.total_index}</Text>
            </View>
          </View>

          <Text style={styles.confidence}>
            Confidence: {zone.confidence} • Mode: {zone.mode}
          </Text>
        </View>
      ))}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>✅ Connected to API Services</Text>
        <Text style={styles.infoText}>• Showing {zones.length} zones from fake data</Text>
        <Text style={styles.infoText}>• Switch between API and Community mode</Text>
        <Text style={styles.infoText}>• Toggle USE_FAKE_DATA in .env for real backend</Text>
      </View>
    </ScrollView>
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
  header: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.surface,
    marginBottom: Spacing.unit(1),
  },
  modeToggle: {
    flexDirection: 'row',
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.unit(1),
    paddingHorizontal: Spacing.unit(2),
    marginHorizontal: Spacing.unit(0.5),
    borderRadius: 8,
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Colors.surface,
  },
  modeText: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  modeTextActive: {
    color: Colors.primary,
  },
  mapPlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.unit(4),
    margin: Spacing.screenPadding,
    borderRadius: 12,
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
  zoneCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    marginTop: Spacing.unit(1),
    marginBottom: Spacing.unit(1),
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1),
  },
  zoneName: {
    ...Typography.subtitle,
  },
  severityBadge: {
    paddingHorizontal: Spacing.unit(1.5),
    paddingVertical: Spacing.unit(0.5),
    borderRadius: 6,
  },
  severityText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  scoreText: {
    ...Typography.body,
    marginBottom: Spacing.unit(1),
    fontWeight: '600',
  },
  layersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.unit(1),
  },
  layerItem: {
    flex: 1,
    minWidth: 100,
    maxWidth: 200,
    padding: Spacing.unit(1),
    marginRight: Spacing.unit(1),
    marginBottom: Spacing.unit(1),
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  layerLabel: {
    ...Typography.caption,
    marginBottom: Spacing.unit(0.5),
  },
  layerValue: {
    ...Typography.body,
    fontWeight: '600',
  },
  confidence: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoCard: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
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
