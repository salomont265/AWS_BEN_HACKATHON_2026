/**
 * Health & Alerts Screen - Tab 2
 * Shows 24h environmental forecasts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchAllForecasts, ForecastData } from '../../services/forecastService';

export default function HealthScreen() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      const data = await fetchAllForecasts('williamsburg', 'api');
      setForecast(data);
    } catch (error) {
      console.error('Failed to load forecast:', error);
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

  if (!forecast) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load forecast data</Text>
      </View>
    );
  }

  const getNextPeakHours = () => {
    const noisePeak = forecast.noise.reduce((max, p) => p.value > max.value ? p : max);
    const aqiPeak = forecast.aqi.reduce((max, p) => p.value > max.value ? p : max);
    return { noisePeak, aqiPeak };
  };

  const { noisePeak, aqiPeak } = getNextPeakHours();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 24-Hour Forecast</Text>
        <Text style={styles.headerSubtitle}>{forecast.neighborhood_id}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Peak Predictions</Text>
        <View style={styles.peakRow}>
          <View style={styles.peakItem}>
            <Text style={styles.peakLabel}>🔊 Noise Peak</Text>
            <Text style={styles.peakValue}>{Math.round(noisePeak.value)} dB</Text>
            <Text style={styles.peakTime}>at {noisePeak.hour}</Text>
          </View>
          <View style={styles.peakItem}>
            <Text style={styles.peakLabel}>💨 AQI Peak</Text>
            <Text style={styles.peakValue}>{Math.round(aqiPeak.value)}</Text>
            <Text style={styles.peakTime}>at {aqiPeak.hour}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Noise Forecast (dB)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          {forecast.noise.slice(0, 12).map((hour) => (
            <View key={hour.hour} style={styles.barContainer}>
              <View style={[styles.bar, { height: hour.value * 1.5 }]} />
              <Text style={styles.barLabel}>{hour.hour.slice(0, 2)}</Text>
              <Text style={styles.barValue}>{Math.round(hour.value)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Air Quality Index</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          {forecast.aqi.slice(0, 12).map((hour) => (
            <View key={hour.hour} style={styles.barContainer}>
              <View style={[styles.bar, { height: hour.value * 1.2, backgroundColor: Colors.warning }]} />
              <Text style={styles.barLabel}>{hour.hour.slice(0, 2)}</Text>
              <Text style={styles.barValue}>{Math.round(hour.value)}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>✅ Connected to Forecast Service</Text>
        <Text style={styles.infoText}>• Showing 24h predictions from fake data</Text>
        <Text style={styles.infoText}>• Mode: {forecast.mode}</Text>
        <Text style={styles.infoText}>• Confidence: {forecast.confidence}</Text>
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
  errorText: {
    ...Typography.body,
    color: Colors.danger,
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
  summaryCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1.5),
  },
  peakRow: {
    flexDirection: 'row',
    marginHorizontal: -Spacing.unit(1),
  },
  peakItem: {
    flex: 1,
    padding: Spacing.unit(1.5),
    marginHorizontal: Spacing.unit(1),
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  peakLabel: {
    ...Typography.caption,
    marginBottom: Spacing.unit(0.5),
  },
  peakValue: {
    ...Typography.title,
    color: Colors.primary,
    marginBottom: Spacing.unit(0.5),
  },
  peakTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  section: {
    padding: Spacing.screenPadding,
    marginBottom: Spacing.unit(2),
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(2),
  },
  chartScroll: {
    flexDirection: 'row',
  },
  barContainer: {
    alignItems: 'center',
    marginRight: Spacing.unit(1.5),
    width: 50,
  },
  bar: {
    width: 40,
    backgroundColor: Colors.primary,
    borderRadius: 4,
    marginBottom: Spacing.unit(0.5),
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(0.25),
  },
  barValue: {
    ...Typography.caption,
    fontWeight: '600',
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
