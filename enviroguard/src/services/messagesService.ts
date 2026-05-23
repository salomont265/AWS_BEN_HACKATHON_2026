import { apiGet, apiPost } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';
import { fakeThreads, fakeMessages } from '../data/fake/fakeThreads';

export interface Thread {
  thread_id: string;
  type: 'dm' | 'group';
  user_ids: string[];
  petition_id: string | null;
  last_message: string;
  last_updated: string;
}

export interface Message {
  message_id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  read_by: string[];
}

// Called by ThreadListScreen on mount
export async function fetchThreads(userId: string): Promise<Thread[]> {
  if (USE_FAKE_DATA) return fakeThreads;
  return apiGet<Thread[]>('/threads', { userId });
}

// Called by ThreadDetailScreen on mount
// Pass since to get only new messages (used by the poll)
export async function fetchMessages(
  threadId: string,
  since?: string
): Promise<Message[]> {
  if (USE_FAKE_DATA) return fakeMessages[threadId] ?? [];

  const params: Record<string, string> = {};
  if (since) params.since = since;

  return apiGet<Message[]>(`/messages/${threadId}`, params);
}

// Called by ThreadDetailScreen Send button
export async function sendMessage(
  threadId: string,
  senderId: string,
  content: string
): Promise<Message> {
  if (USE_FAKE_DATA) return {
    message_id: 'msg_' + Date.now(),
    thread_id: threadId,
    sender_id: senderId,
    content,
    timestamp: new Date().toISOString(),
    read_by: [senderId]
  };

  return apiPost<Message>('/messages', {
    thread_id: threadId,
    sender_id: senderId,
    content
  });
}

// Called by PetitionScreen sign handler when meetup_thread_created=true
export async function createThread(
  userIds: string[],
  type: 'dm' | 'group',
  petitionId?: string
): Promise<Thread> {
  if (USE_FAKE_DATA) return {
    thread_id: 'thr_fake',
    type,
    user_ids: userIds,
    petition_id: petitionId ?? null,
    last_message: '',
    last_updated: new Date().toISOString()
  };

  return apiPost<Thread>('/threads', {
    type,
    user_ids: userIds,
    petition_id: petitionId ?? null
  });
}

// Polling helper — used inside ThreadDetailScreen useEffect
// Returns a cleanup function to stop polling
export function startMessagePolling(
  threadId: string,
  lastTimestamp: string,
  onNewMessages: (msgs: Message[]) => void,
  intervalMs = 10000
): () => void {
  const interval = setInterval(async () => {
    const newMsgs = await fetchMessages(threadId, lastTimestamp);
    if (newMsgs.length > 0) onNewMessages(newMsgs);
  }, intervalMs);

  return () => clearInterval(interval);
}

// How ThreadDetailScreen uses polling:
//
// useEffect(() => {
//   const lastTs = messages[messages.length - 1]?.timestamp;
//   if (!lastTs) return;
//   return startMessagePolling(threadId, lastTs, (newMsgs) => {
//     setMessages(prev => [...prev, ...newMsgs]);
//   });
// }, [messages.length]);
