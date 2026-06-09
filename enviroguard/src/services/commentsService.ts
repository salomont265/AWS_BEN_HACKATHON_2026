import { apiGet, apiPost, apiDelete } from '@/utils/api';

export interface Comment {
  post_id: string;
  comment_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export async function createComment(postId: string, text: string): Promise<void> {
  await apiPost(`/posts/${postId}/comments`, { text });
}

export async function listComments(postId: string): Promise<Comment[]> {
  const response = await apiGet<{ comments: Comment[] }>(`/posts/${postId}/comments`);
  return response.comments;
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await apiDelete(`/posts/${postId}/comments/${commentId}`);
}
