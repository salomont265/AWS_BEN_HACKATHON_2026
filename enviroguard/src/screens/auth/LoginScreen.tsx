/**
 * Login/Registration Screen
 * Per FRONTEND_IMPLEMENTATION_PLAN.md - Authentication Flow
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Button from '../../components/Button';
import { apiPost, saveAuthToken } from '../../utils/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // POST /users - Creates new user or returns error if exists
      const response = await apiPost<{
        user_id: string;
        email: string;
        token: string;
      }>('/users', {
        email,
        password,
      });

      // Save token and user_id to SecureStore
      await saveAuthToken(response.token, response.user_id);

      Alert.alert('Success', 'Welcome to EnviroGuard!');
      onLoginSuccess();
    } catch (error: any) {
      if (error.message.includes('409')) {
        // User already exists
        if (isLogin) {
          Alert.alert('Error', 'Invalid credentials');
        } else {
          Alert.alert(
            'Account Exists',
            'This email is already registered. Try logging in instead.',
            [{ text: 'Switch to Login', onPress: () => setIsLogin(true) }]
          );
        }
      } else {
        Alert.alert('Error', error.message || 'Failed to authenticate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo/Header */}
        <View style={styles.header}>
          <Text style={styles.appIcon}>🌱</Text>
          <Text style={styles.appName}>EnviroGuard</Text>
          <Text style={styles.tagline}>
            Environmental Health Monitoring for NYC
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              editable={!loading}
            />
          </View>

          <Button
            title={isLogin ? 'Log In' : 'Sign Up'}
            onPress={handleSubmit}
            loading={loading}
            size="large"
            fullWidth
          />

          <View style={styles.switchMode}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <Button
              title={isLogin ? 'Sign Up' : 'Log In'}
              onPress={() => setIsLogin(!isLogin)}
              variant="outline"
              size="small"
              disabled={loading}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>24-hour forecasts</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>Risk maps</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👥</Text>
            <Text style={styles.featureText}>Community reports</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.screenPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.unit(4),
  },
  appIcon: {
    fontSize: 72,
    marginBottom: Spacing.unit(2),
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.unit(1),
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.unit(3),
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.unit(3),
  },
  formTitle: {
    ...Typography.title,
    textAlign: 'center',
    marginBottom: Spacing.unit(3),
  },
  inputGroup: {
    marginBottom: Spacing.unit(2),
  },
  label: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1),
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.unit(2),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchMode: {
    marginTop: Spacing.unit(3),
    alignItems: 'center',
  },
  switchText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.unit(1),
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: Spacing.unit(0.5),
  },
  featureText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
});
