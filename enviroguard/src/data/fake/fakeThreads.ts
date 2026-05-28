import { Thread, Message } from '../../services/messagesService';

export const fakeThreads: Thread[] = [
  {
    thread_id: 'thread_001',
    type: 'group',
    user_ids: ['user_001', 'user_002', 'user_003'],
    petition_id: 'pet_001',
    last_message: 'Let\'s meet tomorrow at 6pm?',
    last_updated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    thread_id: 'thread_002',
    type: 'dm',
    user_ids: ['user_001', 'user_004'],
    petition_id: null,
    last_message: 'Thanks for the update!',
    last_updated: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  }
];

export const fakeMessages: Record<string, Message[]> = {
  thread_001: [
    {
      message_id: 'msg_001',
      thread_id: 'thread_001',
      sender_id: 'user_002',
      content: 'I signed the petition about the construction noise',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      read_by: ['user_001', 'user_002', 'user_003']
    },
    {
      message_id: 'msg_002',
      thread_id: 'thread_001',
      sender_id: 'user_003',
      content: 'Me too! Should we organize a meetup?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read_by: ['user_001', 'user_002', 'user_003']
    },
    {
      message_id: 'msg_003',
      thread_id: 'thread_001',
      sender_id: 'user_001',
      content: 'Let\'s meet tomorrow at 6pm?',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      read_by: ['user_001', 'user_002']
    }
  ],
  thread_002: [
    {
      message_id: 'msg_004',
      thread_id: 'thread_002',
      sender_id: 'user_004',
      content: 'Did you see the latest air quality update?',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      read_by: ['user_001', 'user_004']
    },
    {
      message_id: 'msg_005',
      thread_id: 'thread_002',
      sender_id: 'user_001',
      content: 'Thanks for the update!',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read_by: ['user_001', 'user_004']
    }
  ]
};
