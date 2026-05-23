import { MapZone } from '../../services/mapService';

export const fakeMapData: MapZone[] = [
  {
    neighborhood_id: 'williamsburg',
    name: 'Williamsburg',
    lat: 40.7081,
    lng: -73.9571,
    composite_score: 67,
    severity: 'high',
    mode: 'api',
    confidence: 'high',
    layers: {
      noise: {
        index: 72,
        complaint_count_24h: 15
      },
      air: {
        aqi: 85,
        pm25: 35.2,
        o3: 0.068,
        health_category: 'Moderate'
      },
      litter: {
        complaint_count_24h: 8,
        avg_severity: 3.2
      },
      pollen: {
        grass: 4,
        tree: 6,
        weed: 2,
        total_index: 68
      },
      general: {
        report_count_24h: 12
      }
    },
    last_updated: new Date().toISOString()
  },
  {
    neighborhood_id: 'greenpoint',
    name: 'Greenpoint',
    lat: 40.7308,
    lng: -73.9507,
    composite_score: 45,
    severity: 'moderate',
    mode: 'api',
    confidence: 'medium',
    layers: {
      noise: {
        index: 48,
        complaint_count_24h: 6
      },
      air: {
        aqi: 52,
        pm25: 18.5,
        o3: 0.045,
        health_category: 'Good'
      },
      litter: {
        complaint_count_24h: 3,
        avg_severity: 2.1
      },
      pollen: {
        grass: 2,
        tree: 3,
        weed: 1,
        total_index: 42
      },
      general: {
        report_count_24h: 5
      }
    },
    last_updated: new Date().toISOString()
  }
];
