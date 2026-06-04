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
import HeatMapWeb from '../../components/HeatMapWeb';

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

type LayerType = 'combined' | 'air' | 'noise' | 'pollen' | 'litter' | 'reports';

export default function MapScreenNew() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapZones, setMapZones] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'api' | 'community'>('api');
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('combined');
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

      // Fetch data for multiple NYC neighborhoods in parallel
      const neighborhoods = [
        { name: 'Downtown', lat: 40.7128, lng: -74.006 },
        { name: 'Williamsburg', lat: 40.7081, lng: -73.9571 },
        { name: 'Brooklyn Heights', lat: 40.6958, lng: -73.9936 },
        { name: 'East Village', lat: 40.7264, lng: -73.9819 },
        { name: 'Chelsea', lat: 40.7465, lng: -74.0014 },
        { name: 'Upper West Side', lat: 40.7870, lng: -73.9754 },
      ];

      const results = await Promise.all(
        neighborhoods.map((loc) =>
          apiGet<MapData>('/map-data', {
            lat: loc.lat.toString(),
            lng: loc.lng.toString(),
            mode,
          })
        )
      );

      setMapZones(results);
      if (results.length > 0) {
        setMapData(results[0]);
      }
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

  const extractHeatPoints = (zones: MapData[], layer: LayerType) => {
    return zones.map((zone) => {
      let intensity = 0;

      switch (layer) {
        case 'combined':
          intensity = zone.composite_score;
          break;
        case 'air':
          intensity = zone.layers.air.aqi / 5; // Scale 0-500 to 0-100
          break;
        case 'noise':
          intensity = zone.layers.noise.index;
          break;
        case 'pollen':
          intensity = zone.layers.pollen.total_index;
          break;
        case 'litter':
          intensity = zone.layers.litter.complaint_count_24h * 2; // Scale complaints
          break;
        case 'reports':
          intensity = zone.layers.general.report_count_24h * 3; // Scale reports
          break;
      }

      return {
        lat: zone.lat,
        lng: zone.lng,
        intensity: Math.min(intensity, 100), // Cap at 100
      };
    });
  };

  // Mock neighborhood data for web display
  const mockNeighborhoods = [
    { name: 'Downtown', severity: 'low', score: 32, lat: 40.7589, lng: -73.9851 },
    { name: 'Williamsburg', severity: 'moderate', score: 58, lat: 40.7081, lng: -73.9571 },
    { name: 'Brooklyn Heights', severity: 'low', score: 28, lat: 40.6962, lng: -73.9954 },
    { name: 'East Village', severity: 'high', score: 72, lat: 40.7265, lng: -73.9815 },
  ];

  const [selectedNeighborhood, setSelectedNeighborhood] = React.useState(mockNeighborhoods[0]);

  // Generate Google Maps static image URL with markers
  const getMapImageUrl = () => {
    const center = `${selectedNeighborhood.lat},${selectedNeighborhood.lng}`;
    const markers = mockNeighborhoods.map(n => {
      const color = n.severity === 'high' ? 'red' : n.severity === 'moderate' ? 'orange' : 'green';
      return `markers=color:${color}|label:${n.name[0]}|${n.lat},${n.lng}`;
    }).join('&');

    return `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=12&size=800x600&maptype=roadmap&${markers}&key=AIzaSyDummy`;
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      {Platform.OS === 'web' ? (
        <View style={styles.map}>
          {/* Heat Map */}
          {mapZones.length > 0 && (
            <HeatMapWeb
              center={{ lat: 40.7128, lng: -74.006 }}
              zoom={12}
              heatPoints={extractHeatPoints(mapZones, selectedLayer)}
              maxIntensity={100}
            />
          )}

          {/* Controls overlay */}
          <View style={styles.webMapControls}>
            <View style={styles.webModeToggle}>
              <TouchableOpacity
                style={[styles.webModeButton, mode === 'api' && styles.webModeButtonActive]}
                onPress={() => setMode('api')}
              >
                <Text style={[styles.webModeText, mode === 'api' && styles.webModeTextActive]}>
                  📡 API Data
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.webModeButton, mode === 'community' && styles.webModeButtonActive]}
                onPress={() => setMode('community')}
              >
                <Text style={[styles.webModeText, mode === 'community' && styles.webModeTextActive]}>
                  👥 Community
                </Text>
              </TouchableOpacity>
            </View>

            {/* Layer Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.layerFilterContainer}
            >
              {(['combined', 'air', 'noise', 'pollen', 'litter', 'reports'] as LayerType[]).map((layer) => (
                <TouchableOpacity
                  key={layer}
                  style={[styles.layerChip, selectedLayer === layer && styles.layerChipActive]}
                  onPress={() => setSelectedLayer(layer)}
                >
                  <Text style={[styles.layerChipText, selectedLayer === layer && styles.layerChipTextActive]}>
                    {layer === 'combined' ? '🔀 Combined' :
                     layer === 'air' ? '💨 Air Quality' :
                     layer === 'noise' ? '🔊 Noise' :
                     layer === 'pollen' ? '🌸 Pollen' :
                     layer === 'litter' ? '🗑️ Litter' : '📝 Reports'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Risk Level</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#00ff00' }]} />
              <Text style={styles.legendText}>Low (0-25)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#ffff00' }]} />
              <Text style={styles.legendText}>Moderate (26-50)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#ffa500' }]} />
              <Text style={styles.legendText}>High (51-75)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#ff0000' }]} />
              <Text style={styles.legendText}>Very High (76-100)</Text>
            </View>
          </View>

          {/* Neighborhood selector */}
          <ScrollView
            horizontal
            style={styles.webNeighborhoodScroll}
            showsHorizontalScrollIndicator={false}
          >
            {mockNeighborhoods.map((hood, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.webNeighborhoodChip,
                  selectedNeighborhood.name === hood.name && styles.webNeighborhoodChipActive
                ]}
                onPress={() => setSelectedNeighborhood(hood)}
              >
                <Text style={styles.webNeighborhoodChipName}>{hood.name}</Text>
                <View style={[
                  styles.webNeighborhoodChipBadge,
                  { backgroundColor: getSeverityColor(hood.severity) }
                ]}>
                  <Text style={styles.webNeighborhoodChipScore}>{hood.score}</Text>
                </View>
              </TouchableOpacity>
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
  webMapControls: {
    position: 'absolute',
    top: Spacing.unit(2),
    left: Spacing.screenPadding,
    right: Spacing.screenPadding,
    zIndex: 10,
  },
  webModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.unit(0.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webModeButton: {
    flex: 1,
    paddingVertical: Spacing.unit(1),
    paddingHorizontal: Spacing.unit(2),
    borderRadius: 10,
    alignItems: 'center',
  },
  webModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  webModeText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 13,
  },
  webModeTextActive: {
    color: Colors.surface,
  },
  webNeighborhoodScroll: {
    position: 'absolute',
    bottom: Spacing.unit(2),
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: Spacing.screenPadding,
  },
  webNeighborhoodChip: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.unit(1.5),
    marginRight: Spacing.unit(1),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  webNeighborhoodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  webNeighborhoodChipName: {
    ...Typography.body,
    fontWeight: '600',
    marginRight: Spacing.unit(1),
  },
  webNeighborhoodChipBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webNeighborhoodChipScore: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  layerFilterContainer: {
    marginTop: Spacing.unit(1),
    maxHeight: 50,
  },
  layerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  layerChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  layerChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  layerChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
