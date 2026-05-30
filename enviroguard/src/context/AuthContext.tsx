import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { fetchProfile, savePushToken } from '../services/usersService';
import { UserProfile } from '../services/usersService';

interface AuthContextType {
  userId: string | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedId = await SecureStore.getItemAsync('user_id');
      if (storedId) {
        setUserId(storedId);
        const p = await fetchProfile(storedId);
        setProfile(p);

        // Register push token on launch
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        await savePushToken(storedId, token);
      }
      setLoading(false);
    })();
  }, []);

  async function logout() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('user_id');
    setUserId(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (!userId) return;
    const p = await fetchProfile(userId);
    setProfile(p);
  }

  return (
    <AuthContext.Provider
      value={{
        userId,
        profile,
        isLoading,
        isAuthenticated: !!userId,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// How screens use it:
// const { userId, profile } = useAuth();
// Then pass userId into service calls:
// fetchFeed(profile.neighborhoods[0].id)
