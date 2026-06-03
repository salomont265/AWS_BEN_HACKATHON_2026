/**
 * Community Screen - Tab 4
 * Shows community posts/reports feed with enhanced UI
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { fetchFeed, Post } from '../../services/postsService';
import Card from '../../components/Card';
import Button from '../../components/Button';

type FilterType = 'recent' | 'trending' | 'nearby';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('recent');

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const { posts: feedPosts } = await fetchFeed('williamsburg', undefined, filter);
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

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return Colors.danger;
    if (severity >= 3) return Colors.warning;
    return Colors.safe;
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading community reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Williamsburg, NYC</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterButton, filter === 'recent' && styles.filterButtonActive]}
              onPress={() => setFilter('recent')}
            >
              <Text style={[styles.filterText, filter === 'recent' && styles.filterTextActive]}>
                🕐 Recent
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filter === 'trending' && styles.filterButtonActive]}
              onPress={() => setFilter('trending')}
            >
              <Text style={[styles.filterText, filter === 'trending' && styles.filterTextActive]}>
                🔥 Trending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterButton, filter === 'nearby' && styles.filterButtonActive]}
              onPress={() => setFilter('nearby')}
            >
              <Text style={[styles.filterText, filter === 'nearby' && styles.filterTextActive]}>
                📍 Nearby
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Stats Card */}
        <Card style={styles.statsCard} elevated>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{posts.length}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {posts.reduce((sum, p) => sum + p.agreement_count, 0)}
              </Text>
              <Text style={styles.statLabel}>Agreements</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {posts.filter(p => p.petition_ready).length}
              </Text>
              <Text style={styles.statLabel}>Petitions</Text>
            </View>
          </View>
        </Card>

        {/* Posts Feed */}
        <View style={styles.postsSection}>
          {posts.map((post) => (
            <Card key={post.post_id} style={styles.postCard} elevated>
              <View style={styles.postHeader}>
                <View style={styles.postHeaderLeft}>
                  <Text style={styles.categoryIcon}>{getCategoryEmoji(post.category)}</Text>
                  <View>
                    <Text style={styles.categoryLabel}>{post.category.toUpperCase()}</Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  </View>
                </View>
                <View style={[styles.severityDot, { backgroundColor: getSeverityColor(post.severity) }]}>
                  <Text style={styles.severityText}>{post.severity}</Text>
                </View>
              </View>

              <Text style={styles.postDescription}>{post.description}</Text>

              <View style={styles.postFooter}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>👍</Text>
                  <Text style={styles.actionText}>{post.agreement_count}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionText}>Comment</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionIcon}>🔗</Text>
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>

              {post.petition_ready && (
                <View style={styles.petitionBanner}>
                  <Text style={styles.petitionIcon}>📝</Text>
                  <Text style={styles.petitionText}>Petition Ready - Sign Now</Text>
                  <Text style={styles.petitionArrow}>→</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <Button
            title="Submit New Report"
            icon="📝"
            fullWidth
            onPress={() => console.log('Create report')}
          />
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
  filterSection: {
    paddingTop: Spacing.unit(2),
    paddingBottom: Spacing.unit(1),
  },
  filterScroll: {
    paddingHorizontal: Spacing.screenPadding,
  },
  filterButton: {
    paddingHorizontal: Spacing.unit(2.5),
    paddingVertical: Spacing.unit(1.5),
    marginRight: Spacing.unit(1.5),
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.surface,
  },
  statsCard: {
    marginHorizontal: Spacing.screenPadding,
    marginTop: Spacing.unit(2),
    marginBottom: Spacing.unit(1),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.unit(0.5),
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  postsSection: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.unit(2),
  },
  postCard: {
    marginBottom: Spacing.unit(2),
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.unit(1.5),
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: Spacing.unit(1.5),
  },
  categoryLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.unit(0.25),
  },
  postTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  severityDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityText: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.surface,
  },
  postDescription: {
    ...Typography.body,
    marginBottom: Spacing.unit(2),
    lineHeight: 20,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.unit(1.5),
    marginTop: Spacing.unit(1),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.unit(0.5),
    paddingHorizontal: Spacing.unit(1.5),
    marginRight: Spacing.unit(2),
  },
  actionIcon: {
    fontSize: 18,
    marginRight: Spacing.unit(0.75),
  },
  actionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  petitionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.unit(1.5),
    padding: Spacing.unit(1.5),
    backgroundColor: Colors.safe,
    borderRadius: 8,
  },
  petitionIcon: {
    fontSize: 20,
    marginRight: Spacing.unit(1),
  },
  petitionText: {
    ...Typography.body,
    flex: 1,
    color: Colors.surface,
    fontWeight: '600',
  },
  petitionArrow: {
    ...Typography.body,
    color: Colors.surface,
    fontSize: 18,
  },
  actionSection: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.unit(2),
  },
});
