/**
 * Map Screen - Phase 2 Implementation
 * Per FRONTEND_IMPLEMENTATION_PLAN.md - Map Screen section
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Platform } from 'react-native';
// Only import MapView on mobile platforms
let MapView: any, Marker: any, PROVIDER_GOOGLE: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}
import * as Location from 'expo-location';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { apiGet } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

const { width, height } = Dimensions.get('window');

interface MapData {
  neighborhood_id: string;
  name: string;
  lat: number;
  lng: number;
  composite_score: number;
  severity: string;
  mode: string;
  confidence: string;
  last_updated: string;
  layers: {
    noise: { index: number; complaint_count_24h: number };
    air: { aqi: number; pm25: number; health_category: string };
    litter: { complaint_count_24h: number; avg_severity: number };
    pollen: { grass: number; tree: number; weed: number; total_index: number };
    general: { report_count_24h: number };
  };
}

export default function MapScreenNew() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'api' | 'community'>('api');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadMapData(location.coords.latitude, location.coords.longitude);
    }
  }, [location, mode]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        // Load default NYC location
        loadMapData(40.7128, -74.006);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      loadMapData(40.7128, -74.006);
    }
  };

  const loadMapData = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const data = await apiGet<MapData>('/map-data', {
        lat: lat.toString(),
        lng: lng.toString(),
        mode,
      });
      setMapData(data);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return '#22c55e'; // green
    if (score <= 60) return '#eab308'; // yellow
    return '#ef4444'; // red
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return Colors.safe;
      case 'medium':
      case 'moderate':
        return Colors.warning;
      case 'high':
      case 'very_high':
        return Colors.danger;
      default:
        return Colors.textSecondary;
    }
  };

  const centerOnLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const toggleMode = () => {
    setMode(mode === 'api' ? 'community' : 'api');
  };

  // Mock neighborhood data for web display
  const mockNeighborhoods = [
    { name: 'Downtown', severity: 'low', score: 32, lat: 40.7589, lng: -73.9851 },
    { name: 'Williamsburg', severity: 'moderate', score: 58, lat: 40.7081, lng: -73.9571 },
    { name: 'Brooklyn Heights', severity: 'low', score: 28, lat: 40.6962, lng: -73.9954 },
    { name: 'East Village', severity: 'high', score: 72, lat: 40.7265, lng: -73.9815 },
  ];

  return (
    <View style={styles.container}>
      {/* Map */}
      {Platform.OS === 'web' ? (
        <View style={[styles.map, styles.webMapPlaceholder]}>
          <View style={styles.webMapHeader}>
            <Text style={styles.webMapTitle}>🗺️ Neighborhood Risk Map</Text>
            <Text style={styles.webMapSubtext}>
              Interactive map available on mobile • Open in Expo Go app
            </Text>
          </View>

          <ScrollView style={styles.webNeighborhoodList} showsVerticalScrollIndicator={false}>
            {mockNeighborhoods.map((hood, idx) => (
              <Card key={idx} style={styles.webNeighborhoodCard}>
                <View style={styles.webNeighborhoodHeader}>
                  <Text style={styles.webNeighborhoodName}>{hood.name}</Text>
                  <View style={[
                    styles.webSeverityBadge,
                    { backgroundColor: getSeverityColor(hood.severity) }
                  ]}>
                    <Text style={styles.webSeverityText}>{hood.severity.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.webScoreRow}>
                  <Text style={styles.webScoreLabel}>Risk Score:</Text>
                  <Text style={[styles.webScoreValue, { color: getScoreColor(hood.score) }]}>
                    {hood.score}/100
                  </Text>
                </View>
                <Text style={styles.webLocationText}>
                  📍 {hood.lat.toFixed(4)}, {hood.lng.toFixed(4)}
                </Text>
              </Card>
            ))}
          </ScrollView>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={() => {
            if (mapData) {
              setShowBottomSheet(!showBottomSheet);
            }
          }}
        >
          {mapData && (
            <Marker
              coordinate={{
                latitude: mapData.lat,
                longitude: mapData.lng,
              }}
              title={mapData.name}
              description={`Score: ${mapData.composite_score}`}
              pinColor={getScoreColor(mapData.composite_score)}
            />
          )}
        </MapView>
      )}

      {/* Mode Toggle Button */}
      <TouchableOpacity style={styles.modeButton} onPress={toggleMode}>
        <Text style={styles.modeButtonText}>
          {mode === 'api' ? '📊 API Mode' : '👥 Community'}
        </Text>
      </TouchableOpacity>

      {/* My Location Button */}
      <TouchableOpacity style={styles.locationButton} onPress={centerOnLocation}>
        <Text style={styles.locationIcon}>📍</Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Bottom Sheet */}
      {showBottomSheet && mapData && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{mapData.name}</Text>
                <Text style={styles.sheetSubtitle}>
                  {mode === 'api' ? 'Real-time Data' : 'Community Reports'}
                </Text>
              </View>
              <View
                style={[
                  styles.scoreCircle,
                  { backgroundColor: getScoreColor(mapData.composite_score) },
                ]}
              >
                <Text style={styles.scoreText}>{mapData.composite_score}</Text>
              </View>
            </View>

            {/* Severity Badge */}
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: getSeverityColor(mapData.severity) },
              ]}
            >
              <Text style={styles.severityText}>
                {mapData.severity.toUpperCase()}
              </Text>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {/* Air Quality */}
              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>💨</Text>
                <Text style={styles.metricLabel}>Air Quality</Text>
                <Text style={styles.metricValue}>{mapData.layers.air.aqi}</Text>
                <Text style={styles.metricUnit}>AQI</Text>
                <Text style={styles.metricStatus}>
                  {mapData.layers.air.health_category}
                </Text>
              </Card>

              {/* Noise */}
              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🔊</Text>
                <Text style={styles.metricLabel}>Noise</Text>
                <Text style={styles.metricValue}>
                  {mapData.layers.noise.index}
                </Text>
                <Text style={styles.metricUnit}>Index</Text>
                <Text style={styles.metricStatus}>
                  {mapData.layers.noise.complaint_count_24h} reports
                </Text>
              </Card>

              {/* Pollen */}
              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🌸</Text>
                <Text style={styles.metricLabel}>Pollen</Text>
                <Text style={styles.metricValue}>
                  {mapData.layers.pollen.total_index}
                </Text>
                <Text style={styles.metricUnit}>Index</Text>
                <Text style={styles.metricStatus}>
                  Tree: {mapData.layers.pollen.tree}
                </Text>
              </Card>

              {/* Litter */}
              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🗑️</Text>
                <Text style={styles.metricLabel}>Litter</Text>
                <Text style={styles.metricValue}>
                  {mapData.layers.litter.complaint_count_24h}
                </Text>
                <Text style={styles.metricUnit}>Reports</Text>
                <Text style={styles.metricStatus}>
                  Avg: {mapData.layers.litter.avg_severity}/5
                </Text>
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                title="View Posts"
                icon="👥"
                variant="outline"
                onPress={() => console.log('Navigate to community')}
              />
              <Button
                title="Report Issue"
                icon="📝"
                onPress={() => console.log('Navigate to report')}
              />
            </View>

            {/* Meta Info */}
            <View style={styles.metaInfo}>
              <Text style={styles.metaText}>
                Confidence: {mapData.confidence}
              </Text>
              <Text style={styles.metaText}>
                Updated: {new Date(mapData.last_updated).toLocaleTimeString()}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  modeButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modeButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  locationButton: {
    position: 'absolute',
    bottom: 400,
    right: 16,
    backgroundColor: Colors.surface,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  locationIcon: {
    fontSize: 24,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.screenPadding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.unit(2),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(2),
  },
  sheetTitle: {
    ...Typography.title,
    fontSize: 24,
    marginBottom: Spacing.unit(0.5),
  },
  sheetSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.surface,
  },
  severityBadge: {
    paddingHorizontal: Spacing.unit(2),
    paddingVertical: Spacing.unit(1),
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: Spacing.unit(2),
  },
  severityText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.surface,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.unit(1),
    marginBottom: Spacing.unit(2),
  },
  metricCard: {
    width: (width - Spacing.screenPadding * 2 - Spacing.unit(2)) / 2,
    margin: Spacing.unit(1),
    alignItems: 'center',
    padding: Spacing.unit(2),
  },
  metricIcon: {
    fontSize: 32,
    marginBottom: Spacing.unit(1),
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(0.5),
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(0.5),
  },
  metricStatus: {
    ...Typography.caption,
    color: Colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.unit(2),
    marginBottom: Spacing.unit(2),
  },
  metaInfo: {
    alignItems: 'center',
    paddingTop: Spacing.unit(2),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  webMapPlaceholder: {
    backgroundColor: Colors.background,
    padding: Spacing.screenPadding,
  },
  webMapHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.unit(3),
    backgroundColor: Colors.primary,
    borderRadius: 16,
    marginBottom: Spacing.unit(2),
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: Spacing.unit(1),
  },
  webMapSubtext: {
    ...Typography.body,
    color: Colors.primaryLight,
    textAlign: 'center',
  },
  webNeighborhoodList: {
    flex: 1,
  },
  webNeighborhoodCard: {
    marginBottom: Spacing.unit(2),
  },
  webNeighborhoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1.5),
  },
  webNeighborhoodName: {
    ...Typography.title,
    fontSize: 20,
  },
  webSeverityBadge: {
    paddingHorizontal: Spacing.unit(2),
    paddingVertical: Spacing.unit(0.5),
    borderRadius: 12,
  },
  webSeverityText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '700',
  },
  webScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1),
  },
  webScoreLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  webScoreValue: {
    ...Typography.title,
    fontSize: 28,
    fontWeight: '700',
  },
  webLocationText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
