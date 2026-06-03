import { apiGet, apiPost, apiPut } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';
import * as storage from '../utils/storage';
import { fakeUser } from '../data/fake/fakeUser';

export interface UserProfile {
  user_id: string;
  email: string;
  health: {
    asthma: boolean;
    copd: boolean;
    pollen_allergy: boolean;
    noise_sensitivity: boolean;
    age_group: string;
  };
  thresholds: {
    aqi: number;
    noise_db: number;
    pollen_index: number;
  };
  neighborhoods: Array<{
    label: string;
    id: string;
    lat: number;
    lng: number;
  }>;
  push_token: string | null;
  notification_prefs: {
    noise: boolean;
    air: boolean;
    litter: boolean;
    pollen: boolean;
    general: boolean;
    quiet_hours: {
      start: string;
      end: string;
    };
  };
}

// Called by AuthContext on app launch after token found in SecureStore
export async function fetchProfile(userId: string): Promise<UserProfile> {
  if (USE_FAKE_DATA) return fakeUser;
  return apiGet<UserProfile>(`/users/${userId}`);
}

// Called by LoginScreen on signup — POST /users
// Returns user_id and JWT token — store both in SecureStore
export async function createUser(
  email: string,
  password: string
): Promise<{ user_id: string; token: string }> {
  const result = await apiPost<{ user_id: string; token: string }>('/users', {
    email,
    password
  });

  await storage.setItem('jwt_token', result.token);
  await storage.setItem('user_id', result.user_id);

  return result;
}

// Called by ProfileScreen Save button and OnboardingScreen Done button
// Only pass the fields you want to update — others stay unchanged
export async function updateProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, 'user_id'>>
): Promise<{ updated: boolean }> {
  if (USE_FAKE_DATA) return { updated: true };
  return apiPut(`/users/${userId}`, updates);
}

// Called on app launch after Notifications.getExpoPushTokenAsync()
export async function savePushToken(
  userId: string,
  token: string
): Promise<void> {
  if (USE_FAKE_DATA) return;
  await apiPost('/push-token', { user_id: userId, token });
}
