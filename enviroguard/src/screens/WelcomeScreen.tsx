/**
 * Welcome/Splash Screen
 * First screen users see when opening the app
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Button from '../components/Button';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    console.log('Navigate to main app');
  };

  const handleLearnMore = () => {
    console.log('Show onboarding');
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.appIcon}>🌱</Text>
        <Text style={styles.appName}>EnviroGuard</Text>
        <Text style={styles.tagline}>Your Environmental Health Companion</Text>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureTitle}>24-Hour Forecasts</Text>
          <Text style={styles.featureDescription}>
            Get predictions for noise, air quality, pollen, and litter
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🗺️</Text>
          <Text style={styles.featureTitle}>Risk Maps</Text>
          <Text style={styles.featureDescription}>
            View environmental conditions across NYC neighborhoods
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>🚨</Text>
          <Text style={styles.featureTitle}>Smart Alerts</Text>
          <Text style={styles.featureDescription}>
            Personalized notifications based on your health conditions
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureIcon}>👥</Text>
          <Text style={styles.featureTitle}>Community Reports</Text>
          <Text style={styles.featureDescription}>
            Submit and view real-time environmental issues
          </Text>
        </View>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          size="large"
          fullWidth
        />
        <TouchableOpacity style={styles.learnMoreButton} onPress={handleLearnMore}>
          <Text style={styles.learnMoreText}>Learn More</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Powered by ML predictions with 96.7% accuracy
        </Text>
        <Text style={styles.footerSubtext}>AWS BEN Hackathon 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: Spacing.unit(4),
  },
  appIcon: {
    fontSize: 80,
    marginBottom: Spacing.unit(2),
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.unit(1),
  },
  tagline: {
    ...Typography.subtitle,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.unit(2),
    marginBottom: Spacing.unit(2),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: Spacing.unit(2),
  },
  featureTitle: {
    ...Typography.subtitle,
    fontWeight: '600',
    marginBottom: Spacing.unit(0.5),
    flex: 1,
  },
  featureDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    flex: 1,
    position: 'absolute',
    top: 42,
    left: 64,
    right: 16,
  },
  ctaSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.unit(3),
  },
  learnMoreButton: {
    paddingVertical: Spacing.unit(2),
    alignItems: 'center',
  },
  learnMoreText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: Spacing.unit(4),
    alignItems: 'center',
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(0.5),
  },
  footerSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
