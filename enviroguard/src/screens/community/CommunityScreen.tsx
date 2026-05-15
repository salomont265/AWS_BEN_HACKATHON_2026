/**
 * Community Screen - Tab 4
 * SCAFFOLD: Placeholder UI
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';

export default function CommunityScreen() {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.letterCard}>
        <Text style={styles.letterIcon}>✉️</Text>
        <Text style={styles.letterTitle}>Letter Generator</Text>
        <Text style={styles.letterText}>
          Generate advocacy letters with Claude AI
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <View style={styles.postCard}>
        <Text style={styles.postAuthor}>Sarah Johnson</Text>
        <Text style={styles.postContent}>
          Great turnout at yesterday's river cleanup! We collected over 200 lbs of trash.
        </Text>
        <Text style={styles.postMeta}>2 hours ago • 24 likes</Text>
      </View>

      <View style={styles.eventCard}>
        <Text style={styles.eventBadge}>📅 EVENT</Text>
        <Text style={styles.eventTitle}>Beach Cleanup</Text>
        <Text style={styles.eventDetails}>Saturday, May 18 • 9:00 AM</Text>
        <Text style={styles.eventLocation}>Ocean Beach, San Francisco</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Coming Soon:</Text>
        <Text style={styles.infoText}>• Post updates and photos</Text>
        <Text style={styles.infoText}>• Create and join events</Text>
        <Text style={styles.infoText}>• Generate advocacy letters</Text>
        <Text style={styles.infoText}>• Claude AI letter drafting (streaming)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  letterCard: {
    backgroundColor: Colors.primary,
    margin: Spacing.screenPadding,
    padding: Spacing.unit(3),
    borderRadius: 12,
    alignItems: 'center',
  },
  letterIcon: {
    fontSize: 48,
    marginBottom: Spacing.unit(1),
  },
  letterTitle: {
    ...Typography.subtitle,
    color: Colors.surface,
    marginBottom: Spacing.unit(0.5),
  },
  letterText: {
    ...Typography.body,
    color: Colors.primaryLight,
    textAlign: 'center',
  },
  divider: {
    height: 8,
    backgroundColor: Colors.border,
  },
  postCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postAuthor: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  postContent: {
    ...Typography.body,
    marginBottom: Spacing.unit(1),
  },
  postMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  eventCard: {
    backgroundColor: Colors.primaryLight,
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  eventBadge: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.unit(1),
  },
  eventTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(0.5),
  },
  eventDetails: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
  eventLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  infoBox: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  infoText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
});
