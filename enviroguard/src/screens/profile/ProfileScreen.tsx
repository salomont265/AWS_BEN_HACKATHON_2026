import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, Alert, Platform, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { getUserProfile, updateUserProfile } from '@/services/usersService';
import { getUserId } from '@/utils/api';
import * as storage from '@/utils/storage';

interface UserProfile {
  user_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  health_preferences?: {
    allergies?: string[];
    sensitivities?: string[];
  };
  notification_settings?: {
    enabled: boolean;
    noise_threshold?: number;
    aqi_threshold?: number;
    pollen_threshold?: number;
  };
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [noiseThreshold, setNoiseThreshold] = useState('70');
  const [aqiThreshold, setAqiThreshold] = useState('100');
  const [pollenThreshold, setPollenThreshold] = useState('50');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      const data = await getUserProfile(userId);
      setProfile(data);

      setName(data.name || '');
      setNotificationsEnabled(!!data.thresholds);
      setNoiseThreshold(data.thresholds?.noise_db?.toString() || '70');
      setAqiThreshold(data.thresholds?.aqi?.toString() || '100');
      setPollenThreshold(data.thresholds?.pollen_index?.toString() || '50');
    } catch (error) {
      console.error('Failed to load profile:', error);
      if (Platform.OS === 'web') {
        alert('Could not load profile');
      } else {
        Alert.alert('Error', 'Could not load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = await getUserId();

      console.log('Saving profile:', { userId, name, notificationsEnabled });

      const updates: any = {};

      // Update thresholds if notifications enabled
      if (notificationsEnabled) {
        updates.thresholds = {
          noise_db: parseInt(noiseThreshold),
          aqi: parseInt(aqiThreshold),
          pollen_index: parseInt(pollenThreshold),
        };
      }

      console.log('Sending updates:', updates);

      await updateUserProfile(userId, updates);

      console.log('Save successful, reloading profile...');

      // Reload profile to show saved changes
      await loadProfile();

      console.log('✅ Profile saved and reloaded!');

      // Force re-render
      setProfile({ ...profile, name });
    } catch (error) {
      console.error('❌ Failed to save profile:', error);
      alert('Could not save profile: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await storage.removeItem('jwt_token');
      await storage.removeItem('user_id');
      console.log('Logged out successfully');

      // Navigate to login (assumes you have a login screen)
      if (navigation.navigate) {
        navigation.navigate('Login');
      } else {
        // Refresh page for web
        if (Platform.OS === 'web') {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Could not log out');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profile</Text>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Information</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.emailText}>{profile?.email}</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textSecondary}
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Health Preferences</Text>
        <Text style={styles.description}>
          Set your sensitivities to personalize alerts and recommendations
        </Text>

        <Text style={styles.comingSoon}>Coming soon: Allergy tracking</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Enable Alerts</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: Colors.border, true: Colors.primary }}
          />
        </View>

        {notificationsEnabled && (
          <>
            <Text style={styles.thresholdTitle}>Alert me when levels exceed:</Text>

            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>🔊 Noise (dB)</Text>
              <TextInput
                style={styles.thresholdInput}
                value={noiseThreshold}
                onChangeText={setNoiseThreshold}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>💨 AQI</Text>
              <TextInput
                style={styles.thresholdInput}
                value={aqiThreshold}
                onChangeText={setAqiThreshold}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>🌸 Pollen</Text>
              <TextInput
                style={styles.thresholdInput}
                value={pollenThreshold}
                onChangeText={setPollenThreshold}
                keyboardType="numeric"
              />
            </View>
          </>
        )}
      </Card>

      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={saving}
        fullWidth
      />

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.unit(4) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
  },
  content: {
    padding: Spacing.screenPadding,
  },
  header: {
    marginBottom: Spacing.unit(3),
  },
  headerTitle: {
    ...Typography.title,
    fontSize: 28,
  },
  section: {
    marginBottom: Spacing.unit(2),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.unit(2),
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(2),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.unit(0.5),
    marginTop: Spacing.unit(1.5),
  },
  emailText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.unit(1.5),
    fontSize: 16,
    color: Colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.unit(1),
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  thresholdTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.unit(2),
    marginBottom: Spacing.unit(1),
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.unit(1.5),
  },
  thresholdLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  thresholdInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.unit(1),
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.text,
  },
  comingSoon: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: Spacing.unit(3),
    padding: Spacing.unit(2),
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.danger,
  },
});
