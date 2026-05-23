/**
 * Report Screen - Tab 3
 * Shows user's submitted reports
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchMyPosts, Post } from '../../services/postsService';

export default function ReportScreen() {
  const [myReports, setMyReports] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyReports();
  }, []);

  const loadMyReports = async () => {
    try {
      // Using fake user_001 for demo
      const reports = await fetchMyPosts('user_001');
      setMyReports(reports);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewReport = () => {
    Alert.alert(
      'Create Report',
      'This would open the report creation form with photo picker and Claude Vision analysis.',
      [{ text: 'OK' }]
    );
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      noise: '🔊',
      air: '💨',
      litter: '🗑️',
      pollen: '🌸',
      general: '⚠️'
    };
    return emojis[category] || '📍';
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const hoursAgo = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60));
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo === 1) return '1 hour ago';
    if (hoursAgo < 24) return `${hoursAgo} hours ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return Colors.danger;
    if (severity >= 3) return Colors.warning;
    return Colors.safe;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📝 My Reports</Text>
          <Text style={styles.headerSubtitle}>
            {myReports.length} report{myReports.length !== 1 ? 's' : ''} submitted
          </Text>
        </View>

        {myReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button below to submit your first environmental report
            </Text>
          </View>
        ) : (
          myReports.map((report) => (
            <View key={report.post_id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {getCategoryEmoji(report.category)} {report.category.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(report.severity) }]} />
              </View>

              <Text style={styles.reportDescription}>{report.description}</Text>

              <View style={styles.reportStats}>
                <Text style={styles.statItem}>
                  👍 {report.agreement_count} agreement{report.agreement_count !== 1 ? 's' : ''}
                </Text>
                {report.petition_ready && (
                  <Text style={styles.petitionReady}>✓ Petition Ready</Text>
                )}
              </View>

              <Text style={styles.reportMeta}>
                {formatTimeAgo(report.created_at)} • Severity {report.severity}/5
              </Text>

              {report.photo_url && (
                <View style={styles.photoIndicator}>
                  <Text style={styles.photoText}>📷 Photo attached</Text>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>✅ Connected to Posts Service</Text>
          <Text style={styles.infoText}>• Showing your reports from fake data</Text>
          <Text style={styles.infoText}>• User ID: user_001</Text>
          <Text style={styles.infoText}>• Toggle USE_FAKE_DATA in .env for real backend</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleNewReport}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.unit(3),
  },
  headerTitle: {
    ...Typography.title,
    color: Colors.surface,
    marginBottom: Spacing.unit(0.5),
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.primaryLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.unit(4),
    marginTop: Spacing.unit(4),
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.unit(2),
  },
  emptyTitle: {
    ...Typography.title,
    marginBottom: Spacing.unit(1),
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    marginTop: Spacing.unit(1),
    marginBottom: Spacing.unit(1),
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1),
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.unit(1.5),
    paddingVertical: Spacing.unit(0.5),
    borderRadius: 6,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  severityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  reportDescription: {
    ...Typography.body,
    marginBottom: Spacing.unit(1.5),
  },
  reportStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.unit(1),
  },
  statItem: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginRight: Spacing.unit(2),
  },
  petitionReady: {
    ...Typography.caption,
    color: Colors.safe,
    fontWeight: '600',
  },
  reportMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  photoIndicator: {
    marginTop: Spacing.unit(1),
    padding: Spacing.unit(1),
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
  },
  photoText: {
    ...Typography.caption,
  },
  infoBox: {
    margin: Spacing.screenPadding,
    padding: Spacing.unit(2),
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginBottom: Spacing.unit(10),
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
  fab: {
    position: 'absolute',
    right: Spacing.unit(2),
    bottom: Spacing.unit(2),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: Colors.surface,
    fontWeight: '300',
  },
});
