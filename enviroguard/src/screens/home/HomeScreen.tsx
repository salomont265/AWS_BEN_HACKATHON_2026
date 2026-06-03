/**
 * Home/Dashboard Screen - Main overview
 * Shows current environmental conditions and key alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchAllForecasts, ForecastData } from '../../services/forecastService';
import MetricCard from '../../components/MetricCard';
import Card from '../../components/Card';
import Button from '../../components/Button';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadForecast();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const loadForecast = async () => {
    try {
      const data = await fetchAllForecasts('downtown', 'ml');
      setForecast(data);
    } catch (error) {
      console.error('Failed to load forecast:', error);
      alert('Failed to load forecast: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentConditions = () => {
    if (!forecast) return null;
    const currentHour = forecast.noise[0];
    const currentAQI = forecast.aqi[0];
    const currentPollen = forecast.pollen[0];
    const currentLitter = forecast.litter[0];

    return {
      noise: currentHour.value,
      aqi: currentAQI.value,
      pollen: currentPollen.value,
      litter: currentLitter.value,
    };
  };

  const getOverallRisk = () => {
    const conditions = getCurrentConditions();
    if (!conditions) return 'loading';

    const avgRisk = (conditions.noise / 100 + conditions.aqi / 100 + conditions.pollen / 100 + conditions.litter / 100) / 4;

    if (avgRisk < 0.3) return 'low';
    if (avgRisk < 0.6) return 'moderate';
    if (avgRisk < 0.8) return 'high';
    return 'very_high';
  };

  const getRiskMessage = () => {
    const risk = getOverallRisk();
    switch (risk) {
      case 'low':
        return { title: 'Excellent', message: 'Great conditions today!', color: Colors.safe };
      case 'moderate':
        return { title: 'Moderate', message: 'Be aware of sensitivities', color: Colors.warning };
      case 'high':
        return { title: 'High Risk', message: 'Take precautions outdoors', color: Colors.danger };
      case 'very_high':
        return { title: 'Very High', message: 'Limit outdoor exposure', color: Colors.danger };
      default:
        return { title: 'Loading', message: 'Fetching conditions...', color: Colors.textSecondary };
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading environmental data...</Text>
      </View>
    );
  }

  const conditions = getCurrentConditions();
  const riskInfo = getRiskMessage();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: riskInfo.color }]}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLocation}>📍 Williamsburg, NYC</Text>
            <Text style={styles.heroTime}>{formatTime(currentTime)}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={loadForecast}>
            <Text style={styles.refreshIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{riskInfo.title}</Text>
          <Text style={styles.heroSubtitle}>Environmental Conditions</Text>
          <Text style={styles.heroMessage}>{riskInfo.message}</Text>
        </View>
      </View>

      {/* Current Conditions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Conditions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {conditions && (
            <>
              <MetricCard
                icon="🔊"
                title="Noise Level"
                value={Math.round(conditions.noise)}
                unit="dB"
                severity={conditions.noise > 80 ? 'high' : conditions.noise > 60 ? 'moderate' : 'low'}
                trend="stable"
              />
              <MetricCard
                icon="💨"
                title="Air Quality"
                value={Math.round(conditions.aqi)}
                unit="AQI"
                severity={conditions.aqi > 150 ? 'high' : conditions.aqi > 100 ? 'moderate' : 'low'}
                trend="down"
              />
              <MetricCard
                icon="🌸"
                title="Pollen"
                value={Math.round(conditions.pollen)}
                unit="count"
                severity={conditions.pollen > 70 ? 'high' : conditions.pollen > 40 ? 'moderate' : 'low'}
                trend="up"
              />
              <MetricCard
                icon="🗑️"
                title="Litter Index"
                value={Math.round(conditions.litter)}
                severity={conditions.litter > 60 ? 'high' : conditions.litter > 30 ? 'moderate' : 'low'}
                trend="stable"
              />
            </>
          )}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('HealthTab' as never)}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionTitle}>View Forecast</Text>
            <Text style={styles.actionSubtitle}>Next 24 hours</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ReportTab' as never)}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Submit Report</Text>
            <Text style={styles.actionSubtitle}>Report an issue</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MapTab' as never)}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionTitle}>View Map</Text>
            <Text style={styles.actionSubtitle}>Risk zones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ProfileTab' as never)}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Profile</Text>
            <Text style={styles.actionSubtitle}>Settings & info</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Alerts</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>High Noise Expected</Text>
              <Text style={styles.alertTime}>Today at 6:00 PM</Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>
            Construction activity will peak between 6-8 PM near your location.
          </Text>
        </Card>

        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertIcon}>🌸</Text>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Elevated Pollen Levels</Text>
              <Text style={styles.alertTime}>Tomorrow morning</Text>
            </View>
          </View>
          <Text style={styles.alertMessage}>
            Tree pollen count will be high. Consider taking allergy medication.
          </Text>
        </Card>
      </View>

      {/* Health Tip */}
      <View style={styles.section}>
        <Card style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipTitle}>Daily Tip</Text>
          <Text style={styles.tipText}>
            Air quality is best in the early morning. Consider outdoor exercise before 8 AM for optimal conditions.
          </Text>
        </Card>
      </View>

      <View style={{ height: Spacing.unit(4) }} />
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
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.unit(2),
    color: Colors.textSecondary,
  },
  heroSection: {
    paddingTop: Spacing.unit(6),
    paddingBottom: Spacing.unit(4),
    paddingHorizontal: Spacing.screenPadding,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.unit(3),
  },
  heroLocation: {
    ...Typography.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  heroTime: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.unit(0.5),
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    fontSize: 24,
    color: Colors.surface,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.surface,
    marginBottom: Spacing.unit(0.5),
  },
  heroSubtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.unit(1),
  },
  heroMessage: {
    ...Typography.subtitle,
    color: Colors.surface,
  },
  section: {
    marginTop: Spacing.unit(3),
    paddingHorizontal: Spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(2),
  },
  sectionTitle: {
    ...Typography.title,
    marginBottom: Spacing.unit(2),
  },
  seeAllText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.unit(1),
  },
  actionCard: {
    width: (width - Spacing.screenPadding * 2 - Spacing.unit(2)) / 2,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.unit(2),
    margin: Spacing.unit(1),
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: Spacing.unit(1),
  },
  actionTitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.unit(0.5),
  },
  actionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  alertCard: {
    marginBottom: Spacing.unit(2),
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.unit(1),
  },
  alertIcon: {
    fontSize: 24,
    marginRight: Spacing.unit(1.5),
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(0.5),
  },
  alertTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  alertMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.unit(5),
  },
  tipCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  tipIcon: {
    fontSize: 32,
    marginBottom: Spacing.unit(1),
  },
  tipTitle: {
    ...Typography.subtitle,
    color: Colors.primary,
    marginBottom: Spacing.unit(1),
  },
  tipText: {
    ...Typography.body,
    color: Colors.textPrimary,
  },
});
