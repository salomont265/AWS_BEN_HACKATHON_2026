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
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { apiPost, getUserId } from '../../utils/api';
import { uploadPhotoToS3 } from '@/services/photoUploadService';

type Category = 'noise' | 'air' | 'litter' | 'pollen' | 'general';

export default function ReportScreenNew({ navigation }: any) {
  const [category, setCategory] = useState<Category>('noise');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
    requestCameraPermission();
  }, []);

  const getCurrentLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        // Use browser geolocation API for web
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  altitude: null,
                  accuracy: position.coords.accuracy,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: position.timestamp,
              } as any);
              Alert.alert('Success', 'Location found!');
            },
            (error) => {
              // User denied permission or geolocation failed - use default location
              if (error.code !== 1) {
                // Only log if it's not a user denial (code 1)
                console.warn('Geolocation error:', error.message);
              }
              Alert.alert('Location Not Available', 'Using default NYC location for your report.');
            }
          );
        } else {
          Alert.alert('Error', 'Geolocation not supported. Using default NYC location.');
        }
      } else {
        // Use expo-location for mobile
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission needed', 'Location permission is required');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        Alert.alert('Success', 'Location found!');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get location');
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      console.log('Camera permission not granted');
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Use HTML5 file input for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const uri = URL.createObjectURL(file);
          setPhotoUri(uri);
        }
      };
      input.click();
    } else {
      // Use ImagePicker for mobile
      const result = await ImagePicker.launchImagePickerAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
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
    console.log('handleSubmit called');

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }

    // Use location if available, otherwise default to NYC
    const lat = location?.coords?.latitude || 40.7128;
    const lng = location?.coords?.longitude || -74.006;

    setLoading(true);
    try {
      let finalPhotoUrl: string | undefined = undefined;

      // Upload photo to S3 first if photo exists
      if (photoUri) {
        try {
          console.log('Uploading photo to S3...');
          finalPhotoUrl = await uploadPhotoToS3(photoUri);
          console.log('Photo uploaded to S3:', finalPhotoUrl);
        } catch (error) {
          console.error('Photo upload error:', error);
          Alert.alert(
            'Photo Upload Failed',
            'Could not upload photo. Submit report without photo?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
              { text: 'Submit Without Photo', onPress: () => submitReport(undefined, lat, lng) },
            ]
          );
          return;
        }
      }

      // Submit report with S3 URL
      await submitReport(finalPhotoUrl, lat, lng);
    } catch (error: any) {
      console.error('Report submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit report');
      setLoading(false);
    }
  };

  const submitReport = async (s3PhotoUrl: string | undefined, lat: number, lng: number) => {
    try {
      console.log('Submitting report...');
      const userId = await getUserId();

      const body = {
        user_id: userId,
        category,
        lat,
        lng,
        neighborhood_id: 'downtown',
        description,
        severity,
        photo_url: s3PhotoUrl,
      };

      console.log('Posting to /posts:', body);
      const response = await apiPost('/posts', body);
      console.log('Post created:', response);

      // Reset form immediately
      setDescription('');
      setSeverity(3);
      setPhotoUri(null);
      setLoading(false);

      // Show success and navigate to Community tab
      Alert.alert(
        '✅ Report Submitted!',
        'Your report has been shared with the community. Thank you for helping make our environment better!',
        [
          {
            text: 'View in Community',
            onPress: () => navigation.navigate('CommunityTab'),
          },
          {
            text: 'Submit Another',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      throw error;
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
    backgroundColor: Colors.primaryLight,
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
    backgroundColor: Colors.primaryLight,
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
