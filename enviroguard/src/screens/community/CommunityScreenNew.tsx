/**
 * Community Screen - EnviroGuard v2 Beautiful Redesign
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInDown,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { apiGet, apiPost, apiDelete, getUserId } from '../../utils/api';
import { createComment, listComments, Comment } from '@/services/commentsService';

// Reusable Theme Components
import { ReportCard } from '../../components/ThemeComponents';

const Tab = createMaterialTopTabNavigator();

interface Post {
  post_id: string;
  user_id: string;
  category: string;
  description: string;
  photo_url?: string;
  severity: number;
  lat: number;
  lng: number;
  neighborhood_id: string;
  agreement_count: number;
  comment_count?: number;
  petition_ready: boolean;
  created_at: string;
  claude_vision?: any;
}

interface Petition {
  petition_id: string;
  post_id: string;
  neighborhood: string;
  category: string;
  petition_text: string;
  signature_count: number;
  threshold: number;
  status: string;
  official: {
    name: string;
    email: string;
    role: string;
  };
  created_at: string;
}

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

// Feed Tab
function FeedTab({
  agreedPosts,
  onAgree,
  onCommentPress,
  onShare,
  posts,
  loading,
  refreshing,
  onRefresh,
  category,
  setCategory,
}: {
  agreedPosts: Set<string>;
  onAgree: (id: string) => void;
  onCommentPress: (post: Post) => void;
  onShare: (post: Post) => void;
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  category: string;
  setCategory: (cat: string) => void;
}) {
  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      {/* Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Filter by Category:</Text>
        <View style={styles.filterChips}>
          {['all', 'noise', 'air', 'litter', 'pollen'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, category === cat && styles.filterChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.filterChipText, category === cat && styles.filterChipTextActive]}>
                {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Posts List with staggered entrance */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
            <ReportCard
              category={item.category}
              severity={item.severity}
              description={item.description}
              location={item.neighborhood_id}
              timeAgo={formatTimeAgo(item.created_at)}
              photoUrl={item.photo_url}
              agreed={agreedPosts.has(item.post_id)}
              agreementCount={item.agreement_count}
              commentCount={item.comment_count}
              onAgree={() => onAgree(item.post_id)}
              onCommentPress={() => onCommentPress(item)}
              onSharePress={() => onShare(item)}
              petitionReady={item.petition_ready}
            />
          </Animated.View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      />
    </View>
  );
}

// My Reports Tab
function MyReportsTab({
  myPosts,
  loading,
  onCommentPress,
  onShare,
  onDelete,
}: {
  myPosts: Post[];
  loading: boolean;
  onCommentPress: (post: Post) => void;
  onShare: (post: Post) => void;
  onDelete: (postId: string) => void;
}) {
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={myPosts}
        keyExtractor={(item) => item.post_id}
        renderItem={({ item }) => (
          <ReportCard
            category={item.category}
            severity={item.severity}
            description={item.description}
            location={item.neighborhood_id}
            timeAgo={formatTimeAgo(item.created_at)}
            photoUrl={item.photo_url}
            agreed={false}
            agreementCount={item.agreement_count}
            commentCount={item.comment_count}
            onAgree={() => {}}
            onCommentPress={() => onCommentPress(item)}
            onSharePress={() => onShare(item)}
            onDelete={() => onDelete(item.post_id)}
            petitionReady={item.petition_ready}
            isMyPost={true}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Reports Submitted</Text>
            <Text style={styles.emptyText}>Submit a report under the Report tab to see it here.</Text>
          </View>
        }
      />
    </View>
  );
}

// Petitions Tab
function PetitionsTab({
  petitions,
  loading,
  onSign,
}: {
  petitions: Petition[];
  loading: boolean;
  onSign: (id: string) => void;
}) {
  const [expandedPetitions, setExpandedPetitions] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.tabContainer}>
      <FlatList
        data={petitions}
        keyExtractor={(item) => item.petition_id}
        renderItem={({ item }) => {
          const fillPercent = Math.min((item.signature_count / item.threshold) * 100, 100);
          const isExpanded = expandedPetitions.has(item.petition_id);
          const shouldTruncate = item.petition_text.length > 120;

          return (
            <Card style={styles.petitionCard} elevated>
              <Text style={styles.petitionCategory}>
                {item.category.toUpperCase()} PETITION
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newExpanded = new Set(expandedPetitions);
                  if (isExpanded) {
                    newExpanded.delete(item.petition_id);
                  } else {
                    newExpanded.add(item.petition_id);
                  }
                  setExpandedPetitions(newExpanded);
                }}
              >
                <Text style={styles.petitionTitle}>
                  {isExpanded || !shouldTruncate
                    ? item.petition_text
                    : `${item.petition_text.slice(0, 120)}...`}
                </Text>
                {shouldTruncate && (
                  <Text style={styles.expandText}>
                    {isExpanded ? '▲ Show less' : '▼ Read full petition'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${fillPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {item.signature_count} / {item.threshold} supports verified
                </Text>
              </View>

              <View style={styles.officialInfo}>
                <Text style={styles.officialLabel}>Sent to City Office:</Text>
                <Text style={styles.officialName}>{item.official.name}</Text>
                <Text style={styles.officialRole}>{item.official.role}</Text>
              </View>

              <Button
                title={item.signature_count >= item.threshold ? 'Submitted to City Council' : 'Support Petition'}
                icon="✍️"
                onPress={() => onSign(item.petition_id)}
                disabled={item.signature_count >= item.threshold}
              />
            </Card>
          );
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚖️</Text>
            <Text style={styles.emptyTitle}>No Active Petitions</Text>
            <Text style={styles.emptyText}>
              Reports that cross 10 agreements will trigger a formal petition filing.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// Main Component
export default function CommunityScreenNew() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMyPosts, setLoadingMyPosts] = useState(true);
  const [loadingPetitions, setLoadingPetitions] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('all');
  const [agreedPosts, setAgreedPosts] = useState<Set<string>>(new Set());

  // Comments State
  const [showComments, setShowComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');

  // Reanimated sliding banner state
  const bannerY = useSharedValue(-120);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');

  useEffect(() => {
    loadFeed();
  }, [category]);

  useEffect(() => {
    loadMyPosts();
    loadPetitions();
  }, []);

  const loadFeed = async () => {
    try {
      setLoadingPosts(true);
      const params: Record<string, string> = {
        neighborhood: 'downtown',
        limit: '20',
        sort: 'recent',
      };
      if (category !== 'all') {
        params.category = category;
      }
      const data = await apiGet<{ posts: Post[] }>('/posts', params);
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoadingPosts(false);
      setRefreshing(false);
    }
  };

  const loadMyPosts = async () => {
    try {
      setLoadingMyPosts(true);
      const userId = await getUserId();
      const data = await apiGet<{ posts: Post[] }>('/posts', {
        user_id: userId || '',
        limit: '50',
      });
      setMyPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load my posts:', error);
    } finally {
      setLoadingMyPosts(false);
    }
  };

  const loadPetitions = async () => {
    try {
      setLoadingPetitions(true);
      const data = await apiGet<{ petitions: Petition[] }>('/petitions', {
        status: 'active',
      });
      setPetitions(data.petitions || []);
    } catch (error) {
      console.error('Failed to load petitions:', error);
      setPetitions([]);
    } finally {
      setLoadingPetitions(false);
    }
  };

  const triggerSlideDownBanner = (msg: string) => {
    console.log('triggerSlideDownBanner called with:', msg);
    setBannerMsg(msg);
    bannerY.value = 0; // Start visible immediately
    setBannerVisible(true);

    setTimeout(() => {
      bannerY.value = withTiming(-120, { duration: 300 }, (finished) => {
        if (finished) {
          runOnJS(setBannerVisible)(false);
        }
      });
    }, 4500);
  };

  const handleAgree = async (postId: string) => {
    try {
      const userId = await getUserId();
      const result = await apiPost<{ agreement_count: number; petition_ready: boolean }>(`/agree/${postId}`, { user_id: userId });

      console.log('API RESULT:', result);

      // Update feed count with real value from API
      let crossedThreshold = false;
      let targetCat = '';
      const updatedFeed = posts.map((p) => {
        if (p.post_id === postId) {
          const oldCount = p.agreement_count;
          const newCount = result.agreement_count;
          console.log(`POST ${postId}: oldCount=${oldCount}, newCount=${newCount}`);
          if (oldCount < 10 && newCount >= 10) {
            crossedThreshold = true;
            targetCat = p.category;
            console.log('THRESHOLD CROSSED!');
          }
          return { ...p, agreement_count: newCount, petition_ready: newCount >= 10 };
        }
        return p;
      });

      setPosts(updatedFeed);
      // setAgreedPosts(new Set([...agreedPosts, postId])); // TESTING: Allow multiple clicks

      // Reload petitions and my posts
      loadPetitions();
      loadMyPosts();

      // TESTING: Always show banner
      console.log('ALWAYS TRIGGERING BANNER');
      triggerSlideDownBanner(`✅ Agreed! Count: ${result.agreement_count}. ${result.petition_ready ? '📝 PETITION READY!' : ''}`);
    } catch (error: any) {
      console.error('AGREE ERROR:', error);
      Alert.alert('Error', error.message || 'Failed to agree with post');
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiDelete(`/posts/${postId}`);
                // Remove from local state
                setPosts(posts.filter(p => p.post_id !== postId));
                setMyPosts(myPosts.filter(p => p.post_id !== postId));
                Alert.alert('Success', 'Post deleted successfully');
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to delete post');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete post');
    }
  };

  const handleShare = async (post: Post) => {
    try {
      const message = `EnviroGuard v2 Environmental Report:\nCategory: ${post.category.toUpperCase()}\nSeverity: ${post.severity}/5\nLocation: ${post.neighborhood_id}\n\n${post.description}`;
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(message);
        alert('Copied report details to clipboard!');
      } else {
        await Share.share({ message, title: 'Share Report' });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleCommentPress = async (post: Post) => {
    setSelectedPost(post);
    setShowComments(true);
    try {
      const data = await listComments(post.post_id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSendComment = async () => {
    if (!selectedPost || !commentText.trim()) return;
    try {
      await createComment(selectedPost.post_id, commentText);
      setCommentText('');
      const data = await listComments(selectedPost.post_id);
      setComments(data);

      setPosts(
        posts.map((p) =>
          p.post_id === selectedPost.post_id
            ? { ...p, comment_count: (p.comment_count || 0) + 1 }
            : p
        )
      );
    } catch (error) {
      console.error('Failed to send comment:', error);
    }
  };

  const handleSignPetition = async (petitionId: string) => {
    try {
      const userId = await getUserId();
      await apiPost(`/petitions/${petitionId}/sign`, { user_id: userId });
      Alert.alert('Signed!', 'Thank you for supporting this environmental action.');
      loadPetitions();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign petition');
    }
  };

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: bannerY.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Sliding Banner Notification */}
      {bannerVisible && (
        <Animated.View style={[styles.bannerContainer, bannerAnimatedStyle]}>
          <Text style={styles.bannerText}>{bannerMsg}</Text>
        </Animated.View>
      )}


      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Williamsburg Feed</Text>
        <Text style={styles.headerSubtitle}>Active Community Intelligence</Text>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textSecondary,
          tabBarIndicatorStyle: { backgroundColor: Colors.primary, height: 3 },
          tabBarStyle: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.border },
          tabBarLabelStyle: { fontWeight: '700', fontSize: 13, textTransform: 'none' },
        }}
      >
        <Tab.Screen name="Local Feed">
          {() => (
            <FeedTab
              agreedPosts={agreedPosts}
              onAgree={handleAgree}
              onCommentPress={handleCommentPress}
              onShare={handleShare}
              posts={posts}
              loading={loadingPosts}
              refreshing={refreshing}
              onRefresh={loadFeed}
              category={category}
              setCategory={setCategory}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="My Reports">
          {() => (
            <MyReportsTab
              myPosts={myPosts}
              loading={loadingMyPosts}
              onCommentPress={handleCommentPress}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Active Actions">
          {() => (
            <PetitionsTab
              petitions={petitions}
              loading={loadingPetitions}
              onSign={handleSignPetition}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <Modal
          visible={showComments}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowComments(false)}
        >
          <View style={styles.commentsOverlay}>
            <View style={styles.commentsModal}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <TouchableOpacity onPress={() => setShowComments(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={comments}
                keyExtractor={(item) => item.comment_id}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTime}>
                      {formatTimeAgo(item.created_at)}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noComments}>No comments yet. Start the conversation!</Text>
                }
                style={styles.commentsList}
              />

              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={Colors.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim()}
                >
                  <Text style={styles.sendButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  tabContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  filterSection: {
    padding: Spacing.screenPadding,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterLabel: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.screenPadding,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  petitionCard: {
    marginBottom: Spacing.unit(2),
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  petitionCategory: {
    ...Typography.caption,
    color: Colors.amber,
    fontWeight: '700',
    marginBottom: 6,
  },
  petitionTitle: {
    ...Typography.subtitle,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E8E6DE',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  officialInfo: {
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1D9E7533',
  },
  officialLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginBottom: 2,
  },
  officialName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  officialRole: {
    ...Typography.caption,
    fontSize: 11,
  },
  commentsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  commentsModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentsTitle: {
    ...Typography.subtitle,
    fontSize: 18,
  },
  closeButton: {
    fontSize: 20,
    color: Colors.textSecondary,
    padding: 4,
  },
  commentsList: {
    padding: 16,
  },
  commentItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentText: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  commentTime: {
    ...Typography.caption,
    fontSize: 11,
    marginTop: 4,
  },
  noComments: {
    ...Typography.body,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 32,
  },
  commentInput: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 80,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  // Slide-Down Banner Styles
  bannerContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 12,
    right: 12,
    backgroundColor: Colors.amber,
    borderRadius: 10,
    padding: 12,
    zIndex: 10000,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
});
