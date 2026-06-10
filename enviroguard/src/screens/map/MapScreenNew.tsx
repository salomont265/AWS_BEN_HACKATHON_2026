/**
 * Map Screen - EnviroGuard v2 Beautiful Redesign
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import FloatingLeaves from '../../components/FloatingLeaves';

// Reusable Theme Components
import {
  ModeToggle,
  SeverityBadge,
  CategoryBadge,
  CommunityDataBadge,
} from '../../components/ThemeComponents';
import { getZoneSummary } from '../../services/claudeService';

// Dynamic import for mobile maps
let MapView: any, Marker: any, PROVIDER_GOOGLE: any, Circle: any;
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Circle = maps.Circle;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, ComponentSizes } from '@/theme/tokens';
import { apiGet } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import HeatMapWeb from '../../components/HeatMapWeb';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = height * 0.65;

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

// Animated Zone Circle for Map
function AnimatedZoneCircle({
  score,
  index,
  mode,
}: {
  score: number;
  index: number;
  mode: 'api' | 'community';
}) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const modeVal = useSharedValue(mode === 'api' ? 0 : 1);

  useEffect(() => {
    // Staggered load on mount
    opacity.value = withDelay(index * 80, withTiming(0.4, { duration: 400 }));
    scale.value = withDelay(index * 80, withSpring(1.0, { damping: 12, stiffness: 100 }));
  }, []);

  useEffect(() => {
    modeVal.value = withTiming(mode === 'api' ? 0 : 1, { duration: 300 });
  }, [mode]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      modeVal.value,
      [0, 1],
      ['rgba(15, 110, 86, 0.4)', 'rgba(83, 74, 183, 0.4)']
    );
    const borderColor = interpolateColor(
      modeVal.value,
      [0, 1],
      ['#0F6E56', '#534AB7']
    );

    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  return (
    <Animated.View style={[styles.zoneCircle, animatedStyle]} />
  );
}

export default function MapScreenNew() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [mapZones, setMapZones] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'api' | 'community'>('api');
  const [selectedLayer, setSelectedLayer] = useState<LayerType>('combined');
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Claude Summary State
  const [claudeSummary, setClaudeSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Bottom Sheet Reanimated Values
  const sheetY = useSharedValue(height);
  const summaryOpacity = useSharedValue(0);

  const [region, setRegion] = useState<Region>({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [webMapCenter, setWebMapCenter] = useState({ lat: 40.7128, lng: -74.006 });

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (location) {
      loadMapData(location.coords.latitude, location.coords.longitude);
    }
  }, [location, mode]);

  // Handle bottom sheet opening / closing animations
  useEffect(() => {
    if (showBottomSheet && mapData) {
      sheetY.value = withSpring(height - SHEET_HEIGHT, {
        damping: 18,
        stiffness: 200,
      });
      // Stagger Claude summary text fade-in
      summaryOpacity.value = 0;
      summaryOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
      loadSummary(mapData);
    } else {
      sheetY.value = withSpring(height, { damping: 18, stiffness: 200 });
      summaryOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [showBottomSheet, mapData]);

  const loadSummary = async (zone: MapData) => {
    setLoadingSummary(true);
    try {
      const summary = await getZoneSummary({
        name: zone.name,
        noise_index: zone.layers.noise.index,
        aqi: zone.layers.air.aqi,
        health_category: zone.layers.air.health_category,
        pollen_index: zone.layers.pollen.total_index,
        litter_count: zone.layers.litter.complaint_count_24h,
        mode,
      });
      setClaudeSummary(summary);
    } catch (error) {
      console.log('Claude service error, generating styled fallback:', error);
      const riskLevel = zone.composite_score >= 60 ? 'high' : zone.composite_score >= 30 ? 'moderate' : 'low';
      setClaudeSummary(
        `In ${zone.name}, the environmental risk is currently ${riskLevel} (score: ${Math.round(zone.composite_score)}/100). ` +
        `Air Quality index is ${zone.layers.air.aqi} (${zone.layers.air.health_category.toLowerCase()}), and noise is running at ${zone.layers.noise.index}/100. ` +
        `Residents should plan activities accordingly.`
      );
    } finally {
      setLoadingSummary(false);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
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

      const neighborhoods = [
        { name: 'Downtown', lat: 40.7128, lng: -74.006 },
        { name: 'Williamsburg', lat: 40.7081, lng: -73.9571 },
        { name: 'Brooklyn Heights', lat: 40.6958, lng: -73.9936 },
        { name: 'East Village', lat: 40.7264, lng: -73.9819 },
        { name: 'Chelsea', lat: 40.7465, lng: -74.0014 },
        { name: 'Upper West Side', lat: 40.7870, lng: -73.9754 },
      ];

      const results = await Promise.all(
        neighborhoods.map(async (loc) => {
          const data = await apiGet<MapData>('/map-data', {
            lat: loc.lat.toString(),
            lng: loc.lng.toString(),
            mode,
          });
          return { ...data, name: loc.name };
        })
      );

      setMapZones(results);
      if (results.length > 0 && !mapData) {
        setMapData(results[0]);
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 30) return Colors.safe;
    if (score <= 60) return Colors.warning;
    return Colors.danger;
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

  const extractHeatPoints = (zones: MapData[], layer: LayerType) => {
    return zones.map((zone) => {
      let intensity = 0;
      switch (layer) {
        case 'combined':
          intensity = zone.composite_score;
          break;
        case 'air':
          intensity = zone.layers.air.aqi / 5;
          break;
        case 'noise':
          intensity = zone.layers.noise.index;
          break;
        case 'pollen':
          intensity = zone.layers.pollen.total_index;
          break;
        case 'litter':
          intensity = zone.layers.litter.complaint_count_24h * 2;
          break;
        case 'reports':
          intensity = zone.layers.general.report_count_24h * 3;
          break;
      }
      return {
        lat: zone.lat,
        lng: zone.lng,
        intensity: Math.min(intensity, 100),
      };
    });
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: sheetY.value }],
    };
  });

  const summaryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: summaryOpacity.value,
    };
  });

  return (
    <View style={styles.container}>
      <FloatingLeaves />

      {/* Map */}
      {Platform.OS === 'web' ? (
        <View style={styles.webMapContainer}>
          {!loading && mapZones.length > 0 ? (
            <HeatMapWeb
              center={webMapCenter}
              zoom={13}
              heatPoints={extractHeatPoints(mapZones, selectedLayer)}
              maxIntensity={100}
            />
          ) : null}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading map data...</Text>
            </View>
          )}

          {/* Web controls */}
          <View style={styles.webMapControls}>
            <View style={styles.webModeToggle}>
              <ModeToggle activeOption={mode} onChange={setMode} />
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

          {/* Web Neighborhood selector */}
          <ScrollView
            horizontal
            style={styles.webNeighborhoodScroll}
            showsHorizontalScrollIndicator={false}
          >
            {mapZones.map((zone) => {
              const score = Math.round(zone.composite_score);
              return (
                <TouchableOpacity
                  key={zone.neighborhood_id}
                  style={[
                    styles.webNeighborhoodChip,
                    mapData?.neighborhood_id === zone.neighborhood_id && styles.webNeighborhoodChipActive
                  ]}
                  onPress={() => {
                    setMapData(zone);
                    setWebMapCenter({ lat: zone.lat, lng: zone.lng });
                    setShowBottomSheet(true);
                  }}
                >
                  <Text style={styles.webNeighborhoodChipName}>{zone.name}</Text>
                  <View style={[
                    styles.webNeighborhoodChipBadge,
                    { backgroundColor: getScoreColor(score) }
                  ]}>
                    <Text style={styles.webNeighborhoodChipScore}>{score}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
            setShowBottomSheet(false);
          }}
        >
          {/* Custom Markers representing heatmap zones */}
          {mapZones.map((zone, idx) => (
            <Marker
              key={zone.neighborhood_id}
              coordinate={{
                latitude: zone.lat,
                longitude: zone.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={(e: any) => {
                e.stopPropagation();
                setMapData(zone);
                setShowBottomSheet(true);
              }}
            >
              <AnimatedZoneCircle
                score={zone.composite_score}
                index={idx}
                mode={mode}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Floating Controls (Mobile Only) */}
      {Platform.OS !== 'web' && (
        <>
          {/* Mode Toggle */}
          <View style={styles.floatingModeToggle}>
            <ModeToggle activeOption={mode} onChange={setMode} />
          </View>

          {/* Location button */}
          <TouchableOpacity style={styles.locationButton} onPress={centerOnLocation}>
            <Text style={styles.locationIcon}>📍</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Loading overlay */}
      {loading && Platform.OS !== 'web' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      )}

      {/* Bottom Sheet */}
      {mapData && (
        <Animated.View style={[styles.bottomSheet, sheetAnimatedStyle]}>
          <View style={styles.sheetHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>{mapData.name}</Text>
                <View style={styles.badgeRow}>
                  {mode === 'community' && <CommunityDataBadge />}
                  <Text style={styles.sheetSubtitle}>
                    {mode === 'api' ? 'Real-time Readings' : 'Community Activity'}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.scoreCircle,
                  { backgroundColor: getScoreColor(mapData.composite_score) },
                ]}
              >
                <Text style={[styles.scoreText, Typography.tabularNums]}>
                  {Math.round(mapData.composite_score)}
                </Text>
              </View>
            </View>

            {/* Claude Briefing Section */}
            <Animated.View style={[styles.claudeBriefingCard, summaryAnimatedStyle]}>
              <View style={styles.briefingHeader}>
                <Text style={styles.briefingIcon}>✨</Text>
                <Text style={styles.briefingTitle}>Claude Environmental Briefing</Text>
              </View>
              {loadingSummary ? (
                <View style={styles.briefingLoader}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.briefingLoadingText}>Consulting advisor...</Text>
                </View>
              ) : (
                <Text style={styles.briefingText}>{claudeSummary}</Text>
              )}
            </Animated.View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>💨</Text>
                <Text style={styles.metricLabel}>Air Quality</Text>
                <Text style={[styles.metricValue, Typography.tabularNums]}>{mapData.layers.air.aqi}</Text>
                <Text style={styles.metricUnit}>AQI</Text>
                <Text style={styles.metricStatus}>{mapData.layers.air.health_category}</Text>
              </Card>

              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🔊</Text>
                <Text style={styles.metricLabel}>Noise Level</Text>
                <Text style={[styles.metricValue, Typography.tabularNums]}>{mapData.layers.noise.index}</Text>
                <Text style={styles.metricUnit}>Index</Text>
                <Text style={styles.metricStatus}>{mapData.layers.noise.complaint_count_24h} reports</Text>
              </Card>

              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🌸</Text>
                <Text style={styles.metricLabel}>Pollen</Text>
                <Text style={[styles.metricValue, Typography.tabularNums]}>{mapData.layers.pollen.total_index}</Text>
                <Text style={styles.metricUnit}>Index</Text>
                <Text style={styles.metricStatus}>Tree: {mapData.layers.pollen.tree}</Text>
              </Card>

              <Card style={styles.metricCard}>
                <Text style={styles.metricIcon}>🗑️</Text>
                <Text style={styles.metricLabel}>Litter Index</Text>
                <Text style={[styles.metricValue, Typography.tabularNums]}>{mapData.layers.litter.complaint_count_24h}</Text>
                <Text style={styles.metricUnit}>Reports</Text>
                <Text style={styles.metricStatus}>Avg: {mapData.layers.litter.avg_severity}/5</Text>
              </Card>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('Close button pressed');
                  setShowBottomSheet(false);
                }}
              >
                <Text style={styles.closeBtnText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  zoneCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  floatingModeToggle: {
    position: 'absolute',
    top: 50,
    left: (width - 224) / 2,
    zIndex: 100,
  },
  locationButton: {
    position: 'absolute',
    bottom: SHEET_HEIGHT + 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  locationIcon: {
    fontSize: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(241, 239, 232, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    ...Typography.body,
    marginTop: 10,
    color: Colors.textSecondary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px -4px 16px rgba(0,0,0,0.08)',
      },
    }),
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetContent: {
    padding: Spacing.screenPadding,
    paddingTop: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    ...Typography.title,
    fontSize: 24,
    color: Colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sheetSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  scoreCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  claudeBriefingCard: {
    backgroundColor: '#E1F5EE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1D9E75',
    padding: 12,
    marginBottom: 16,
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  briefingIcon: {
    fontSize: 16,
    color: Colors.primary,
  },
  briefingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  briefingText: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 18,
    color: Colors.textPrimary,
  },
  briefingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  briefingLoadingText: {
    ...Typography.caption,
    color: Colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - Spacing.screenPadding * 2 - 12) / 2,
    margin: 6,
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricUnit: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  metricStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    zIndex: 10,
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#E8E6DE',
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  webMapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  webMapControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  webModeToggle: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  layerFilterContainer: {
    marginTop: 8,
    maxHeight: 50,
  },
  layerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  layerChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  layerChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  layerChipTextActive: {
    color: '#FFFFFF',
  },
  webNeighborhoodScroll: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
  },
  webNeighborhoodChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webNeighborhoodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  webNeighborhoodChipName: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 8,
    color: Colors.textPrimary,
  },
  webNeighborhoodChipBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webNeighborhoodChipScore: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
