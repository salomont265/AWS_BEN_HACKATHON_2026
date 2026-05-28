import { Post } from '../../services/postsService';

export const fakePosts: Post[] = [
  {
    post_id: 'post_001',
    user_id: 'user_001',
    category: 'noise',
    description: 'Construction noise at 6am waking up entire block',
    severity: 4,
    lat: 40.7081,
    lng: -73.9571,
    neighborhood_id: 'williamsburg',
    agreement_count: 12,
    petition_ready: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    post_id: 'post_002',
    user_id: 'user_002',
    category: 'air',
    description: 'Strong diesel fumes from idling trucks on Bedford Ave',
    severity: 3,
    lat: 40.7085,
    lng: -73.9565,
    neighborhood_id: 'williamsburg',
    agreement_count: 8,
    petition_ready: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    post_id: 'post_003',
    user_id: 'user_003',
    category: 'litter',
    description: 'Overflowing trash bins attracting rats',
    photo_url: 'https://placehold.co/400x300/png',
    severity: 4,
    lat: 40.7075,
    lng: -73.9580,
    neighborhood_id: 'williamsburg',
    agreement_count: 15,
    petition_ready: true,
    claude_vision: {
      confirmed_category: 'litter',
      severity: 4,
      description: 'Multiple overflowing trash receptacles with visible rodent activity'
    },
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    post_id: 'post_004',
    user_id: 'user_001',
    category: 'pollen',
    description: 'Severe allergies from tree pollen on N 7th St',
    severity: 2,
    lat: 40.7090,
    lng: -73.9560,
    neighborhood_id: 'williamsburg',
    agreement_count: 5,
    petition_ready: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    post_id: 'post_005',
    user_id: 'user_004',
    category: 'general',
    description: 'Broken streetlight making sidewalk unsafe at night',
    severity: 3,
    lat: 40.7070,
    lng: -73.9575,
    neighborhood_id: 'williamsburg',
    agreement_count: 6,
    petition_ready: false,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];
