/**
 * Report Screen - Phase 3 Implementation
 * Per FRONTEND_IMPLEMENTATION_PLAN.md - Report Screen section
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { apiPost, getUserId } from '../../utils/api';

type Category = 'noise' | 'air' | 'litter' | 'pollen' | 'general';

export default function ReportScreenNew() {
  const [category, setCategory] = useState<Category>('noise');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);

  useEffect(() => {
    getCurrentLocation();
    requestCameraPermission();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to submit reports');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera permission not granted');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      // Simulate AI analysis
      analyzePhoto(result.assets[0].uri);
    }
  };

  const analyzePhoto = async (uri: string) => {
    setAiAnalyzing(true);
    try {
      // Simulate Claude Vision analysis
      // In real implementation, this would call POST /reports with photo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock AI suggestion
      setAiSuggestion({
        confirmed_category: category,
        severity: severity + 1,
        description: 'AI detected: ' + getCategoryLabel(category) + ' issue in the photo',
      });
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const useAISuggestion = () => {
    if (aiSuggestion) {
      setCategory(aiSuggestion.confirmed_category);
      setSeverity(Math.min(aiSuggestion.severity, 5));
      setDescription(aiSuggestion.description);
    }
  };

  const getCategoryLabel = (cat: Category) => {
    const labels = {
      noise: 'Noise',
      air: 'Air Quality',
      litter: 'Litter',
      pollen: 'Pollen',
      general: 'General',
    };
    return labels[cat];
  };

  const getCategoryIcon = (cat: Category) => {
    const icons = {
      noise: '🔊',
      air: '💨',
      litter: '🗑️',
      pollen: '🌸',
      general: '📋',
    };
    return icons[cat];
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required. Please enable location services.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    try {
      setLoading(true);
      const userId = await getUserId();

      const body = {
        user_id: userId,
        category,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        neighborhood_id: 'williamsburg', // TODO: Calculate from lat/lng
        description,
        severity,
        photo_url: photoUri || undefined,
      };

      await apiPost('/posts', body);

      Alert.alert('Success', 'Report submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setDescription('');
            setSeverity(3);
            setPhotoUri(null);
            setAiSuggestion(null);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Report an Issue</Text>
        <Text style={styles.headerSubtitle}>Help your community</Text>
      </View>

      {/* Category Selector */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Issue Type</Text>
        <View style={styles.categoryGrid}>
          {(['noise', 'air', 'litter', 'pollen', 'general'] as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryButton,
                category === cat && styles.categoryButtonActive,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={styles.categoryIcon}>{getCategoryIcon(cat)}</Text>
              <Text
                style={[
                  styles.categoryLabel,
                  category === cat && styles.categoryLabelActive,
                ]}
              >
                {getCategoryLabel(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Location */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {location ? (
          <View style={styles.locationInfo}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationText}>Current Location</Text>
              <Text style={styles.locationCoords}>
                {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          </View>
        ) : (
          <Button
            title="Get Current Location"
            icon="📍"
            variant="outline"
            onPress={getCurrentLocation}
          />
        )}
      </Card>

      {/* Description */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the issue..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </Card>

      {/* Severity */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Severity: {severity}/5</Text>
        <View style={styles.severitySlider}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.severityDot,
                severity >= level && styles.severityDotActive,
                severity >= level && level >= 4 && { backgroundColor: Colors.danger },
                severity >= level && level === 3 && { backgroundColor: Colors.warning },
                severity >= level && level <= 2 && { backgroundColor: Colors.safe },
              ]}
              onPress={() => setSeverity(level)}
            >
              <Text style={styles.severityNumber}>{level}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.severityLabels}>
          <Text style={styles.severityLabel}>Minimal</Text>
          <Text style={styles.severityLabel}>Severe</Text>
        </View>
      </Card>

      {/* Photo Upload */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Photo (Optional)</Text>
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            <View style={styles.photoActions}>
              <Button
                title="Remove"
                variant="outline"
                size="small"
                onPress={() => {
                  setPhotoUri(null);
                  setAiSuggestion(null);
                }}
              />
              <Button
                title="Change Photo"
                variant="outline"
                size="small"
                onPress={pickImage}
              />
            </View>
          </View>
        ) : (
          <Button title="Add Photo" icon="📷" variant="outline" onPress={pickImage} />
        )}
      </Card>

      {/* AI Analysis */}
      {aiAnalyzing && (
        <Card style={[styles.section, styles.aiCard]}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.aiAnalyzing}>AI analyzing photo...</Text>
        </Card>
      )}

      {aiSuggestion && !aiAnalyzing && (
        <Card style={[styles.section, styles.aiCard]}>
          <Text style={styles.aiTitle}>🤖 AI Suggestions</Text>
          <Text style={styles.aiText}>Category: {getCategoryLabel(aiSuggestion.confirmed_category)}</Text>
          <Text style={styles.aiText}>Severity: {aiSuggestion.severity}/5</Text>
          <Text style={styles.aiText}>Description: {aiSuggestion.description}</Text>
          <Button
            title="Use AI Suggestions"
            icon="✨"
            size="small"
            onPress={useAISuggestion}
          />
        </Card>
      )}

      {/* Submit */}
      <Button
        title="Submit Report"
        icon="📤"
        onPress={handleSubmit}
        loading={loading}
        size="large"
        fullWidth
      />

      <View style={{ height: Spacing.unit(4) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: Spacing.unit(0.5),
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.unit(2),
  },
  sectionTitle: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(1.5),
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.unit(0.5),
  },
  categoryButton: {
    width: '31%',
    margin: Spacing.unit(0.5),
    padding: Spacing.unit(1.5),
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  categoryButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: Spacing.unit(0.5),
  },
  categoryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryLabelActive: {
    color: Colors.primary,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 32,
    marginRight: Spacing.unit(2),
  },
  locationText: {
    ...Typography.subtitle,
    marginBottom: Spacing.unit(0.5),
  },
  locationCoords: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  textArea: {
    ...Typography.body,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.unit(2),
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
  },
  severitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.unit(1),
  },
  severityDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityDotActive: {
    backgroundColor: Colors.primary,
  },
  severityNumber: {
    ...Typography.subtitle,
    color: Colors.surface,
    fontWeight: '700',
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: Spacing.unit(2),
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.unit(2),
  },
  aiCard: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  aiAnalyzing: {
    ...Typography.body,
    marginTop: Spacing.unit(1),
    textAlign: 'center',
  },
  aiTitle: {
    ...Typography.subtitle,
    color: Colors.primary,
    marginBottom: Spacing.unit(1),
  },
  aiText: {
    ...Typography.body,
    marginBottom: Spacing.unit(0.5),
  },
});
