import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

// Dynamic import for web only
let L: any;
if (typeof window !== 'undefined') {
  L = require('leaflet');
  require('leaflet/dist/leaflet.css');
  require('leaflet.heat');
}

interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-100 scale
}

interface HeatMapWebProps {
  center: { lat: number; lng: number };
  zoom: number;
  heatPoints: HeatPoint[];
  maxIntensity?: number;
}

export default function HeatMapWeb({ center, zoom, heatPoints, maxIntensity = 100 }: HeatMapWebProps) {
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!L || mapRef.current) return;

    // Initialize map
    const map = L.map('leaflet-map').setView([center.lat, center.lng], zoom);
    mapRef.current = map;

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !L) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Convert to leaflet.heat format: [[lat, lng, intensity], ...]
    const heatData = heatPoints.map((p) => [p.lat, p.lng, p.intensity]);

    // Add new heat layer
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: maxIntensity,
      gradient: {
        0.0: '#00ff00', // Green (low risk)
        0.25: '#ffff00', // Yellow
        0.5: '#ffa500', // Orange
        0.75: '#ff4500', // Red-orange
        1.0: '#ff0000', // Red (high risk)
      },
    }).addTo(mapRef.current);

    // Update map center
    mapRef.current.setView([center.lat, center.lng], zoom);
  }, [center, zoom, heatPoints, maxIntensity]);

  return (
    <View style={styles.container}>
      <div id="leaflet-map" style={{ width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
