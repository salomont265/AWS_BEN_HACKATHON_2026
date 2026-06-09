/**
 * Health & Alerts Screen - Tab 2 (EnviroGuard v2)
 * Shows 24h environmental forecasts with animated timeline scrubbing and overall risk score tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  useAnimatedReaction,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchAllForecasts, ForecastData } from '../../services/forecastService';
import { fetchWeather, WeatherResponse, getWindDirection, getUVLevel, convertWeatherToHourlyPredictions } from '../../services/weatherService';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';
import FloatingLeaves from '../../components/FloatingLeaves';

// Reusable Theme Components
import { ModeToggle, RiskPill, CommunityDataBadge } from '../../components/ThemeComponents';

const { width } = Dimensions.get('window');

// Custom Animated Hour Chip for Scrubber
function HourChip({
  hour,
  isSelected,
  onPress,
}: {
  hour: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const colorProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(isSelected ? 1.1 : 1.0, { duration: 150 });
    colorProgress.value = withTiming(isSelected ? 1 : 0, { duration: 150 });
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      ['#FFFFFF', Colors.primary]
    );
    const borderColor = interpolateColor(
      colorProgress.value,
      [0, 1],
      [Colors.border, Colors.primary]
    );
    return {
      transform: [{ scale: scale.value }],
      backgroundColor,
      borderColor,
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorProgress.value,
      [0, 1],
      [Colors.textSecondary, '#FFFFFF']
    );
    return { color };
  });

  return (
    <Pressable onPress={onPress} style={styles.chipPressable}>
      <Animated.View style={[styles.hourChip, animatedStyle]}>
        <Animated.Text style={[styles.hourChipText, animatedTextStyle]}>
          {hour}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

// Custom Slot-Machine Count-Up Risk Pill
function AnimatedRiskPill({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(score);
  const animatedScore = useSharedValue(score);

  useEffect(() => {
    animatedScore.value = withTiming(score, { duration: 400 });
  }, [score]);

  useAnimatedReaction(
    () => Math.round(animatedScore.value),
    (nextVal) => {
      if (nextVal !== displayScore) {
        runOnJS(setDisplayScore)(nextVal);
      }
    },
    [displayScore]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animatedScore.value,
      [20, 50, 80],
      [Colors.safe, Colors.warning, Colors.danger]
    );
    return {
      backgroundColor,
    };
  });

  return (
    <Animated.View style={[styles.riskPill, animatedStyle]}>
      <Text style={styles.riskPillText}>{displayScore}</Text>
    </Animated.View>
  );
}

export default function HealthScreen() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [mode, setMode] = useState<'api' | 'community'>('api');

  // Hour Scrubber State
  const [selectedHourIndex, setSelectedHourIndex] = useState(0);
  const [activeHourIndex, setActiveHourIndex] = useState(0);

  // Reanimated fade-through opacity for metric cards
  const metricsOpacity = useSharedValue(1);

  // MUST BE BEFORE ANY RETURNS
  const metricsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: metricsOpacity.value,
    };
  });

  useEffect(() => {
    loadForecast();
    loadWeather();
  }, [mode]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const modelType = mode === 'api' ? 'ml' : 'ml'; // Both use ML for now
      const data = await fetchAllForecasts('downtown', modelType);
      setForecast(data);
      // Reset hourly index
      setSelectedHourIndex(0);
      setActiveHourIndex(0);
    } catch (error) {
      console.error('Failed to load forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async () => {
    try {
      const data = await fetchWeather(40.7128, -74.006);
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to load weather:', error);
    }
  };

  const handleHourSelect = (index: number) => {
    setSelectedHourIndex(index);
    // Fade-through transition
    metricsOpacity.value = withTiming(0, { duration: 100 }, (finished) => {
      if (finished) {
        runOnJS(setActiveHourIndex)(index);
        metricsOpacity.value = withTiming(1, { duration: 100 });
      }
    });
  };

  const getHourLabel = (hourStr: string) => {
    const val = parseInt(hourStr.split(':')[0], 10);
    const ampm = val >= 12 ? 'PM' : 'AM';
    const hourNum = val % 12 === 0 ? 12 : val % 12;
    return `${hourNum} ${ampm}`;
  };

  if (loading || !forecast) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading forecasts...</Text>
      </View>
    );
  }

  // Active readings based on timeline scrubber selection
  const activeNoise = forecast.noise[activeHourIndex]?.value || 0;
  const activeAQI = forecast.aqi[activeHourIndex]?.value || 0;
  const activePollen = forecast.pollen[activeHourIndex]?.value || 0;
  const activeLitter = forecast.litter[activeHourIndex]?.value || 0;

  // Calculate composite risk score for selected hour
  const activeScore = Math.round((activeNoise + activeAQI + activePollen + activeLitter) / 4);

  return (
    <View style={styles.container}>
      <FloatingLeaves />

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Environmental Forecast</Text>
        <Text style={styles.headerSubtitle}>Williamsburg operations center</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Toggle Mode */}
        <View style={styles.toggleSection}>
          <ModeToggle activeOption={mode} onChange={setMode} />
          {mode === 'community' && <CommunityDataBadge />}
        </View>

        {/* Selected Hour Score & Overview */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>
                Forecast for {forecast.noise[activeHourIndex]?.hour.slice(0, 5)}
              </Text>
              <Text style={styles.summarySubtitle}>
                Estimated Civic Safety Index
              </Text>
            </View>
            <AnimatedRiskPill score={activeScore} />
          </View>
        </Card>

        {/* 24-Hour Timeline Scrubber */}
        <View style={styles.scrubberSection}>
          <Text style={styles.sectionTitle}>Timeline Scrubber</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrubberScroll}
          >
            {forecast.noise.slice(0, 24).map((item, idx) => (
              <HourChip
                key={item.hour}
                hour={getHourLabel(item.hour)}
                isSelected={selectedHourIndex === idx}
                onPress={() => handleHourSelect(idx)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Metric Cards - Fade-Through Transition */}
        <Animated.View style={[styles.metricsGrid, metricsAnimatedStyle]}>
          {/* Noise */}
          <Card style={styles.metricCard}>
            <Text style={styles.metricIcon}>🔊</Text>
            <Text style={styles.metricLabel}>Noise Level</Text>
            <Text style={[styles.metricValue, Typography.tabularNums]}>
              {Math.round(activeNoise)}
            </Text>
            <Text style={styles.metricUnit}>dB</Text>
            <Text style={styles.metricStatus}>
              {activeNoise >= 75 ? 'Excessive Warning' : 'Normal Exposure'}
            </Text>
          </Card>

          {/* AQI */}
          <Card style={styles.metricCard}>
            <Text style={styles.metricIcon}>💨</Text>
            <Text style={styles.metricLabel}>Air Quality</Text>
            <Text style={[styles.metricValue, Typography.tabularNums]}>
              {Math.round(activeAQI)}
            </Text>
            <Text style={styles.metricUnit}>AQI</Text>
            <Text style={styles.metricStatus}>
              {activeAQI > 100 ? 'Unhealthy sensitive' : activeAQI > 50 ? 'Moderate Readings' : 'Good Clean Air'}
            </Text>
          </Card>

          {/* Pollen */}
          <Card style={styles.metricCard}>
            <Text style={styles.metricIcon}>🌸</Text>
            <Text style={styles.metricLabel}>Pollen Count</Text>
            <Text style={[styles.metricValue, Typography.tabularNums]}>
              {Math.round(activePollen)}
            </Text>
            <Text style={styles.metricUnit}>PPM</Text>
            <Text style={styles.metricStatus}>
              {activePollen > 60 ? 'Severe Allergen' : 'Low Irritants'}
            </Text>
          </Card>

          {/* Litter */}
          <Card style={styles.metricCard}>
            <Text style={styles.metricIcon}>🗑️</Text>
            <Text style={styles.metricLabel}>Litter Index</Text>
            <Text style={[styles.metricValue, Typography.tabularNums]}>
              {Math.round(activeLitter)}
            </Text>
            <Text style={styles.metricUnit}>Reports</Text>
            <Text style={styles.metricStatus}>
              {activeLitter > 50 ? 'Sanitation Required' : 'Clean Streets'}
            </Text>
          </Card>
        </Animated.View>

        {/* Weather Conditions Card */}
        {weatherData && (
          <Card style={styles.weatherCard}>
            <Text style={styles.sectionTitle}>🌤️ Current Weather Info</Text>
            <View style={styles.currentWeather}>
              <Text style={styles.tempLarge}>{Math.round(weatherData.current.temp)}°F</Text>
              <Text style={styles.description}>{weatherData.current.description}</Text>
              <View style={styles.weatherDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💧</Text>
                  <Text style={styles.detailText}>{weatherData.current.humidity}%</Text>
                  <Text style={styles.detailLabel}>Humidity</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💨</Text>
                  <Text style={styles.detailText}>
                    {Math.round(weatherData.current.wind_speed)} mph {getWindDirection(weatherData.current.wind_deg)}
                  </Text>
                  <Text style={styles.detailLabel}>Wind</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>☀️</Text>
                  <Text style={[styles.detailText, { color: getUVLevel(weatherData.current.uv).color }]}>
                    {weatherData.current.uv.toFixed(1)}
                  </Text>
                  <Text style={styles.detailLabel}>UV {getUVLevel(weatherData.current.uv).level}</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ Forecast Active</Text>
          <Text style={styles.infoText}>• Model Confidence: {forecast.confidence}</Text>
          <Text style={styles.infoText}>• Update Mode: {forecast.mode.toUpperCase()}</Text>
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
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.unit(2),
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: 16,
    paddingHorizontal: Spacing.screenPadding,
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...Typography.caption,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  toggleSection: {
    padding: Spacing.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryCard: {
    margin: Spacing.screenPadding,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    ...Typography.title,
    fontSize: 18,
  },
  summarySubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  riskPill: {
    width: 48,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riskPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scrubberSection: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: 8,
  },
  sectionTitle: {
    ...Typography.subtitle,
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  scrubberScroll: {
    paddingVertical: 6,
    gap: 10,
  },
  chipPressable: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.screenPadding - 6,
    marginBottom: 8,
  },
  metricCard: {
    width: (width - Spacing.screenPadding * 2 - 12) / 2,
    margin: 6,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
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
  weatherCard: {
    margin: Spacing.screenPadding,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currentWeather: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  tempLarge: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  description: {
    fontSize: 15,
    color: Colors.textPrimary,
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  infoCard: {
    margin: Spacing.screenPadding,
    padding: 12,
    backgroundColor: 'rgba(15, 110, 86, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
});
