import { apiGet, apiPost } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';
import { fakePosts } from '../data/fake/fakePosts';

export interface ClaudeVision {
  confirmed_category: string;
  severity: number;
  description: string;
}

export interface Post {
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
  petition_ready: boolean;
  petition_id?: string;
  claude_vision?: ClaudeVision;
  created_at: string;
}

export interface FeedResponse {
  posts: Post[];
  lastKey: string | null;
}

// Social feed — called by SocialFeedScreen
// aggregate=false returns individual post cards
export async function fetchFeed(
  neighborhood: string,
  category?: string,
  sort: 'recent' | 'agreements' = 'recent',
  lastKey?: string
): Promise<FeedResponse> {
  if (USE_FAKE_DATA) return { posts: fakePosts, lastKey: null };

  const params: Record<string, string> = {
    neighborhood,
    aggregate: 'false',
    sort
  };
  if (category && category !== 'all') params.category = category;
  if (lastKey) params.lastKey = lastKey;

  return apiGet<FeedResponse>('/posts', params);
}

// Report markers on the map — same endpoint, no aggregate
export async function fetchMapReports(neighborhood: string): Promise<Post[]> {
  if (USE_FAKE_DATA) return fakePosts.slice(0, 5);

  const res = await apiGet<FeedResponse>('/posts', {
    neighborhood,
    aggregate: 'false',
    sort: 'recent'
  });
  return res.posts;
}

// Single post detail — called by PostDetailScreen
export async function fetchPost(postId: string): Promise<Post> {
  if (USE_FAKE_DATA) return fakePosts.find(p => p.post_id === postId) ?? fakePosts[0];
  return apiGet<Post>(`/posts/${postId}`);
}

// User's own posts — called by MyReportsScreen
export async function fetchMyPosts(userId: string): Promise<Post[]> {
  if (USE_FAKE_DATA) return fakePosts.filter(p => p.user_id === userId);

  const res = await apiGet<FeedResponse>('/posts', {
    user_id: userId,
    aggregate: 'false'
  });
  return res.posts;
}

// Submit a new report — called by SubmitReportScreen on confirm
// photoUrl is the S3 URL after direct upload — pass null if no photo
export async function createPost(data: {
  user_id: string;
  category: string;
  description: string;
  photo_url: string | null;
  severity: number;
  lat: number;
  lng: number;
  neighborhood_id: string;
}): Promise<Post> {
  if (USE_FAKE_DATA) return {
    ...data,
    post_id: 'fake_' + Date.now(),
    agreement_count: 0,
    petition_ready: false,
    created_at: new Date().toISOString()
  } as Post;

  return apiPost<Post>('/posts', data);
}

// Agreement functions — called by ReportCard and PostDetailScreen
export async function getAgreement(
  postId: string,
  userId: string
): Promise<{
  agreement_count: number;
  user_has_agreed: boolean;
  petition_ready: boolean;
}> {
  if (USE_FAKE_DATA) return {
    agreement_count: 3,
    user_has_agreed: false,
    petition_ready: false
  };

  return apiGet(`/agree/${postId}`, { userId });
}

export async function agreePost(
  postId: string,
  userId: string
): Promise<{
  agreement_count: number;
  user_has_agreed: boolean;
  petition_ready: boolean;
}> {
  if (USE_FAKE_DATA) return {
    agreement_count: 4,
    user_has_agreed: true,
    petition_ready: false
  };

  return apiPost(`/agree/${postId}`, { user_id: userId });
}
