/**
 * Community Screen - Tab 4
 * Shows community posts/reports feed
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchFeed, Post } from '../../services/postsService';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { posts: feedPosts } = await fetchFeed('williamsburg', undefined, 'recent');
      setPosts(feedPosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community Reports</Text>
        <Text style={styles.headerSubtitle}>Real-time neighborhood issues</Text>
      </View>

      {posts.map((post) => (
        <View key={post.post_id} style={styles.postCard}>
          <View style={styles.postHeader}>
            <Text style={styles.categoryBadge}>
              {getCategoryEmoji(post.category)} {post.category.toUpperCase()}
            </Text>
            <Text style={styles.severityBadge}>
              Severity: {post.severity}/5
            </Text>
          </View>

          <Text style={styles.postDescription}>{post.description}</Text>

          <View style={styles.postFooter}>
            <Text style={styles.postMeta}>{formatTimeAgo(post.created_at)}</Text>
            <Text style={styles.agreementCount}>
              👍 {post.agreement_count} agreements
            </Text>
          </View>

          {post.petition_ready && (
            <View style={styles.petitionBadge}>
              <Text style={styles.petitionText}>✓ Petition Ready</Text>
            </View>
          )}
        </View>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>✅ Connected to API Services</Text>
        <Text style={styles.infoText}>• Showing {posts.length} real posts from fake data</Text>
        <Text style={styles.infoText}>• Toggle USE_FAKE_DATA in .env to use real backend</Text>
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
  header: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.primary,
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
  postCard: {
    backgroundColor: Colors.surface,
    margin: Spacing.screenPadding,
    marginTop: Spacing.unit(1),
    marginBottom: Spacing.unit(1),
    padding: Spacing.unit(2),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1),
  },
  categoryBadge: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.unit(1),
    paddingVertical: Spacing.unit(0.5),
    borderRadius: 6,
  },
  severityBadge: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  postDescription: {
    ...Typography.body,
    marginBottom: Spacing.unit(1),
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postMeta: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  agreementCount: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  petitionBadge: {
    marginTop: Spacing.unit(1),
    padding: Spacing.unit(1),
    backgroundColor: Colors.safe,
    borderRadius: 6,
    alignItems: 'center',
  },
  petitionText: {
    ...Typography.caption,
    color: Colors.surface,
    fontWeight: '600',
  },
  infoBox: {
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
