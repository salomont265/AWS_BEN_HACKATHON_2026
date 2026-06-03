/**
 * Health & Alerts Screen - Tab 2
 * Shows 24h environmental forecasts with enhanced visualizations
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchAllForecasts, ForecastData } from '../../services/forecastService';
import Card from '../../components/Card';
import MetricCard from '../../components/MetricCard';

type MetricType = 'noise' | 'aqi' | 'pollen' | 'litter';

export default function HealthScreen() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('noise');

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
        <Text style={styles.loadingText}>Loading forecasts...</Text>
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
    const pollenPeak = forecast.pollen.reduce((max, p) => p.value > max.value ? p : max);
    const litterPeak = forecast.litter.reduce((max, p) => p.value > max.value ? p : max);
    return { noisePeak, aqiPeak, pollenPeak, litterPeak };
  };

  const { noisePeak, aqiPeak, pollenPeak, litterPeak } = getNextPeakHours();

  const getMetricData = () => {
    switch (selectedMetric) {
      case 'noise':
        return { data: forecast.noise, color: Colors.primary, unit: 'dB', icon: '🔊' };
      case 'aqi':
        return { data: forecast.aqi, color: Colors.warning, unit: '', icon: '💨' };
      case 'pollen':
        return { data: forecast.pollen, color: '#9C27B0', unit: '', icon: '🌸' };
      case 'litter':
        return { data: forecast.litter, color: Colors.danger, unit: '', icon: '🗑️' };
    }
  };

  const metricInfo = getMetricData();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 24-Hour Forecast</Text>
        <Text style={styles.headerSubtitle}>{forecast.neighborhood_id.toUpperCase()}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Peak Predictions Summary */}
        <View style={styles.peaksSection}>
          <Text style={styles.sectionTitle}>Peak Predictions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <MetricCard
              icon="🔊"
              title="Noise Peak"
              value={Math.round(noisePeak.value)}
              unit="dB"
              subtitle={`at ${noisePeak.hour}`}
              severity={noisePeak.value > 80 ? 'high' : noisePeak.value > 60 ? 'moderate' : 'low'}
            />
            <MetricCard
              icon="💨"
              title="AQI Peak"
              value={Math.round(aqiPeak.value)}
              subtitle={`at ${aqiPeak.hour}`}
              severity={aqiPeak.value > 100 ? 'high' : aqiPeak.value > 50 ? 'moderate' : 'low'}
            />
            <MetricCard
              icon="🌸"
              title="Pollen Peak"
              value={Math.round(pollenPeak.value)}
              subtitle={`at ${pollenPeak.hour}`}
              severity={pollenPeak.value > 70 ? 'high' : pollenPeak.value > 40 ? 'moderate' : 'low'}
            />
            <MetricCard
              icon="🗑️"
              title="Litter Peak"
              value={Math.round(litterPeak.value)}
              subtitle={`at ${litterPeak.hour}`}
              severity={litterPeak.value > 60 ? 'high' : litterPeak.value > 30 ? 'moderate' : 'low'}
            />
          </ScrollView>
        </View>

        {/* Metric Selector */}
        <View style={styles.selectorSection}>
          <Text style={styles.sectionTitle}>Detailed Forecast</Text>
          <View style={styles.metricSelector}>
            <TouchableOpacity
              style={[styles.metricButton, selectedMetric === 'noise' && styles.metricButtonActive]}
              onPress={() => setSelectedMetric('noise')}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'noise' && styles.metricButtonTextActive]}>
                🔊 Noise
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricButton, selectedMetric === 'aqi' && styles.metricButtonActive]}
              onPress={() => setSelectedMetric('aqi')}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'aqi' && styles.metricButtonTextActive]}>
                💨 AQI
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricButton, selectedMetric === 'pollen' && styles.metricButtonActive]}
              onPress={() => setSelectedMetric('pollen')}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'pollen' && styles.metricButtonTextActive]}>
                🌸 Pollen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.metricButton, selectedMetric === 'litter' && styles.metricButtonActive]}
              onPress={() => setSelectedMetric('litter')}
            >
              <Text style={[styles.metricButtonText, selectedMetric === 'litter' && styles.metricButtonTextActive]}>
                🗑️ Litter
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>
              {metricInfo.icon} {selectedMetric.toUpperCase()} Levels
            </Text>
            <Text style={styles.chartSubtitle}>Next 24 hours</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
            <View style={styles.chartContainer}>
              {metricInfo.data.slice(0, 24).map((hour, index) => {
                const maxValue = Math.max(...metricInfo.data.slice(0, 24).map(h => h.value));
                const heightPercent = (hour.value / maxValue) * 100;

                return (
                  <View key={hour.hour} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: `${heightPercent}%`,
                            backgroundColor: metricInfo.color,
                            opacity: index === 0 ? 1 : 0.7,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.barLabel, index === 0 && styles.barLabelCurrent]}>
                      {hour.hour.slice(0, 5)}
                    </Text>
                    <Text style={[styles.barValue, index === 0 && styles.barValueCurrent]}>
                      {Math.round(hour.value)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Card>

        {/* Health Recommendations */}
        <Card style={styles.recommendationsCard}>
          <Text style={styles.recommendationsTitle}>💡 Health Recommendations</Text>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>✓</Text>
            <Text style={styles.recommendationText}>
              Best outdoor times: 6-8 AM and after 8 PM
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>⚠️</Text>
            <Text style={styles.recommendationText}>
              Avoid strenuous activity during peak hours
            </Text>
          </View>
          <View style={styles.recommendation}>
            <Text style={styles.recommendationIcon}>✓</Text>
            <Text style={styles.recommendationText}>
              Keep windows closed between 12-6 PM
            </Text>
          </View>
        </Card>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>✅ Forecast Active</Text>
          <Text style={styles.infoText}>• Mode: {forecast.mode}</Text>
          <Text style={styles.infoText}>• Confidence: {forecast.confidence}</Text>
          <Text style={styles.infoText}>• Updated: Just now</Text>
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
  errorText: {
    ...Typography.body,
    color: Colors.danger,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Spacing.unit(6),
    paddingBottom: Spacing.unit(3),
    paddingHorizontal: Spacing.screenPadding,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: Spacing.unit(0.5),
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.primaryLight,
  },
  content: {
    flex: 1,
  },
  peaksSection: {
    paddingTop: Spacing.unit(3),
    paddingHorizontal: Spacing.screenPadding,
  },
  selectorSection: {
    marginTop: Spacing.unit(3),
    paddingHorizontal: Spacing.screenPadding,
  },
  sectionTitle: {
    ...Typography.title,
    marginBottom: Spacing.unit(2),
  },
  metricSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.unit(0.5),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metricButton: {
    flex: 1,
    paddingVertical: Spacing.unit(1.5),
    paddingHorizontal: Spacing.unit(1),
    borderRadius: 10,
    alignItems: 'center',
  },
  metricButtonActive: {
    backgroundColor: Colors.primary,
  },
  metricButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontSize: 13,
  },
  metricButtonTextActive: {
    color: Colors.surface,
  },
  chartCard: {
    margin: Spacing.screenPadding,
    marginTop: Spacing.unit(3),
  },
  chartHeader: {
    marginBottom: Spacing.unit(2),
  },
  chartTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: Spacing.unit(0.5),
  },
  chartSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  chartScroll: {
    marginHorizontal: -Spacing.unit(1),
  },
  chartContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.unit(1),
  },
  barContainer: {
    alignItems: 'center',
    marginRight: Spacing.unit(2),
    width: 45,
  },
  barWrapper: {
    height: 120,
    width: 32,
    justifyContent: 'flex-end',
    marginBottom: Spacing.unit(1),
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
    marginBottom: Spacing.unit(0.5),
  },
  barLabelCurrent: {
    fontWeight: '700',
    color: Colors.primary,
  },
  barValue: {
    ...Typography.caption,
    fontWeight: '600',
    fontSize: 11,
  },
  barValueCurrent: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 13,
  },
  recommendationsCard: {
    margin: Spacing.screenPadding,
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  recommendationsTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: Spacing.unit(2),
    color: Colors.primary,
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.unit(1.5),
  },
  recommendationIcon: {
    fontSize: 16,
    marginRight: Spacing.unit(1),
    marginTop: 2,
  },
  recommendationText: {
    ...Typography.body,
    flex: 1,
    color: Colors.textPrimary,
  },
  infoCard: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: 'rgba(15, 110, 86, 0.1)',
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
    ...Typography.caption,
    marginBottom: Spacing.unit(0.5),
    color: Colors.textPrimary,
  },
});
