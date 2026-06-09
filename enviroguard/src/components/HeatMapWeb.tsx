import React, { useEffect, useRef, createElement } from 'react';

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
  intensity: number;
}

interface HeatMapWebProps {
  center: { lat: number; lng: number };
  zoom: number;
  heatPoints: HeatPoint[];
  maxIntensity?: number;
}

export default function HeatMapWeb({ center, zoom, heatPoints, maxIntensity = 100 }: HeatMapWebProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!L || !containerRef.current || mapRef.current) return;

    console.log('Initializing Leaflet map at', center);

    // Initialize map
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([center.lat, center.lng], zoom);
    mapRef.current = map;

    // Add tile layer (using a brighter, more visible tileset)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 10,
    }).addTo(map);

    console.log('Leaflet map initialized');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !L) return;

    console.log('Updating heat layer with', heatPoints.length, 'points');

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
    }

    // Convert to leaflet.heat format
    const heatData = heatPoints.map((p) => [p.lat, p.lng, p.intensity]);
    console.log('Heat data:', heatData);

    // Add new heat layer with much stronger colors
    // Use a fixed radius in pixels - Leaflet handles the scaling automatically
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 40,          // Fixed radius in pixels - stays visually consistent across zoom levels
      blur: 20,            // Fixed blur
      maxZoom: 18,
      minZoom: 10,
      max: maxIntensity * 0.5,  // Lower max to make colors more intense
      minOpacity: 0.6,     // Minimum opacity so colors are always visible
      gradient: {
        0.0: 'green',      // Green for low
        0.25: 'yellow',    // Yellow for low-moderate
        0.5: 'orange',     // Orange for moderate-high
        0.75: 'red',       // Red for high
        1.0: 'darkred',    // Dark red for very high
      },
    }).addTo(mapRef.current);

    // Update map center
    mapRef.current.setView([center.lat, center.lng], zoom);
  }, [center, zoom, heatPoints, maxIntensity]);

  // Return pure HTML div using createElement to avoid JSX issues
  return createElement('div', {
    ref: containerRef,
    style: { width: '100%', height: '100%' }
  });
}
