import { apiGet } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';
import { fakeMapData } from '../data/fake/fakeMapData';

export interface MapLayer {
  noise: {
    index: number;
    complaint_count_24h: number;
  };
  air: {
    aqi: number;
    pm25: number;
    o3: number;
    health_category: string;
  };
  litter: {
    complaint_count_24h: number;
    avg_severity: number;
  };
  pollen: {
    grass: number;
    tree: number;
    weed: number;
    total_index: number;
  };
  general: {
    report_count_24h: number;
  };
}

export interface MapZone {
  neighborhood_id: string;
  name: string;
  lat: number;
  lng: number;
  composite_score: number;
  severity: 'low' | 'moderate' | 'high' | 'very_high';
  mode: 'api' | 'community';
  confidence: 'low' | 'medium' | 'high';
  layers: MapLayer;
  last_updated: string;
}

export interface RiskScore {
  neighborhood_id: string;
  composite_score: number;
  severity: 'low' | 'moderate' | 'high' | 'very_high';
  mode: 'api' | 'community';
  confidence: 'low' | 'medium' | 'high';
  breakdown: {
    air: number;
    noise: number;
    pollen: number;
    litter: number;
    general: number;
  };
}

// Primary map call — used by MapScreen on mount and every 15 min.
// ALWAYS call this regardless of mode. Never call /posts directly from the frontend.
// mode='api' → Lambda calls AirNow, OpenWeather, Ambee, 311 internally
// mode='community' → Lambda aggregates posts table internally
// Same endpoint, same frontend call, Lambda handles the difference.
export async function fetchMapData(
  lat: number,
  lng: number,
  mode: 'api' | 'community'
): Promise<MapZone[]> {
  if (USE_FAKE_DATA) return fakeMapData;
  return apiGet<MapZone[]>('/map-data', {
    lat: lat.toString(),
    lng: lng.toString(),
    mode
  });
}

// Risk score — called when the bottom sheet needs just the composite score
// without refetching all map layers. EC2 FastAPI computes it.
export async function fetchRiskScore(
  neighborhood: string,
  mode: 'api' | 'community'
): Promise<RiskScore> {
  if (USE_FAKE_DATA) return {
    neighborhood_id: neighborhood,
    composite_score: 67,
    severity: 'high',
    mode,
    confidence: 'high',
    breakdown: {
      air: 85,
      noise: 72,
      pollen: 68,
      litter: 45,
      general: 20
    }
  };
  return apiGet<RiskScore>(`/risk-score/${neighborhood}`, { mode });
}

// How MapScreen uses these:
//
// useEffect(() => {
//   fetchMapData(location.lat, location.lng, mode).then(setMapData);
//   const poll = setInterval(() =>
//     fetchMapData(location.lat, location.lng, mode).then(setMapData),
//     15 * 60 * 1000
//   );
//   return () => clearInterval(poll);
// }, [mode]);
//
// Bottom sheet on zone tap:
// fetchRiskScore(zone.neighborhood_id, mode).then(setRiskScore);
