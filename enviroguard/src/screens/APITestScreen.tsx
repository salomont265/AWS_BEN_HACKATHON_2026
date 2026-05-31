import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';

const BASE_URL = 'https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2';

export default function APITestScreen() {
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');

  const log = (title: string, data: any) => {
    const formatted = `\n=== ${title} ===\n${JSON.stringify(data, null, 2)}\n`;
    setOutput(prev => prev + formatted);
  };

  const testCreateUser = async () => {
    setLoading(true);
    try {
      log('CALLING', `POST ${BASE_URL}/users`);
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'password123'
        })
      });
      log('RESPONSE', { status: res.status, ok: res.ok });
      const result = await res.json();
      log('CREATE USER', result);
      if (result.token) {
        setToken(result.token);
        Alert.alert('Success', `User: ${result.user_id}\nToken saved!`);
      } else {
        Alert.alert('Error', JSON.stringify(result));
      }
    } catch (error: any) {
      log('ERROR DETAILS', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      Alert.alert('Error', `${error.name}: ${error.message}`);
    }
    setLoading(false);
  };

  const testGetPosts = async () => {
    if (!token) {
      Alert.alert('Error', 'Create a user first to get a token');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/posts?neighborhood=downtown`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      log('GET POSTS', result);
      Alert.alert('Success', `Got ${result.posts?.length || 0} posts`);
    } catch (error: any) {
      log('ERROR', error.message);
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const testPredictNoise = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/predict-noise/downtown?mode=ml`);
      const result = await res.json();
      log('PREDICT NOISE', result);
      Alert.alert('Success', `Got ${result.data?.prediction?.length || 0} predictions`);
    } catch (error: any) {
      log('ERROR', error.message);
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const testAirQuality = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/air-quality?lat=40.7128&lng=-74.006`);
      const result = await res.json();
      log('AIR QUALITY', result);
      Alert.alert('Success', `AQI: ${result.aqi}`);
    } catch (error: any) {
      log('ERROR', error.message);
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const testMapData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/map-data?lat=40.7128&lng=-74.006&mode=api`);
      const result = await res.json();
      log('MAP DATA', result);
      Alert.alert('Success', `Score: ${result.composite_score}`);
    } catch (error: any) {
      log('ERROR', error.message);
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  const Button = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={loading}>
      <Text style={styles.buttonText}>{loading ? 'Loading...' : title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>API Integration Tests</Text>
        <Text style={styles.info}>
          Test each API endpoint. Create a user first to get auth token.
        </Text>
        {token ? <Text style={styles.token}>✓ Token saved</Text> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Users API</Text>
          <Button title="Create User" onPress={testCreateUser} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Posts API (needs token)</Text>
          <Button title="Get Posts" onPress={testGetPosts} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. ML Predictions (no auth)</Text>
          <Button title="Predict Noise" onPress={testPredictNoise} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Environment (no auth)</Text>
          <Button title="Air Quality" onPress={testAirQuality} />
          <Button title="Map Data" onPress={testMapData} />
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.clearButton} onPress={() => setOutput('')}>
            <Text style={styles.clearButtonText}>Clear Output</Text>
          </TouchableOpacity>
        </View>
      </View>

      {output ? (
        <View style={styles.card}>
          <Text style={styles.title}>Output</Text>
          <ScrollView style={styles.output}>
            <Text style={styles.outputText}>{output}</Text>
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  token: {
    fontSize: 12,
    color: '#0a0',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  output: {
    maxHeight: 400,
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 8,
  },
  outputText: {
    fontFamily: 'Courier',
    color: '#0f0',
    fontSize: 11,
  },
});
