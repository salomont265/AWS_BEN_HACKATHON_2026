#!/bin/bash

# Update HomeScreen
cat > /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard/src/screens/home/HomeScreenTropical.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchAllForecasts, ForecastData } from '../../services/forecastService';
import MetricCard from '../../components/MetricCard';
import FloatingLeaves from '../../components/FloatingLeaves';

export default function HomeScreen() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForecast();
  }, []);

  const loadForecast = async () => {
    try {
      const data = await fetchAllForecasts('downtown', 'ml');
      setForecast(data);
    } catch (error) {
      console.error('Failed to load forecast:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <FloatingLeaves />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const current = forecast?.noise[0];

  return (
    <View style={styles.container}>
      <FloatingLeaves />
      <LinearGradient
        colors={['#06B68D', '#40E0B0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🌴 EnviroGuard</Text>
        <Text style={styles.headerSubtitle}>Your Eco Dashboard</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>🌿 Current Conditions</Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="🔊"
            title="Noise"
            value={Math.round(current?.value || 0)}
            unit="dB"
            severity={current?.value > 70 ? 'high' : 'low'}
          />
          <MetricCard
            icon="💨"
            title="Air Quality"
            value={Math.round(forecast?.aqi[0]?.value || 0)}
            severity={forecast?.aqi[0]?.value > 100 ? 'high' : 'low'}
          />
          <MetricCard
            icon="🌸"
            title="Pollen"
            value={Math.round(forecast?.pollen[0]?.value || 0)}
            severity={forecast?.pollen[0]?.value > 70 ? 'high' : 'low'}
          />
          <MetricCard
            icon="🗑️"
            title="Litter"
            value={Math.round(forecast?.litter[0]?.value || 0)}
            severity={forecast?.litter[0]?.value > 60 ? 'high' : 'low'}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.surface,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: Colors.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
EOF

# Backup and replace
mv /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard/src/screens/home/HomeScreen.tsx /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard/src/screens/home/HomeScreen.backup.tsx
mv /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard/src/screens/home/HomeScreenTropical.tsx /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard/src/screens/home/HomeScreen.tsx

echo "✅ Updated HomeScreen with tropical theme"
