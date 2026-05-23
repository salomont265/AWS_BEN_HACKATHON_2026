import { apiGet } from '../utils/api';
import { USE_FAKE_DATA } from '../constants/env';
import { fakeForecastData } from '../data/fake/fakeForecastData';

export interface HourlyPrediction {
  hour: string; // e.g. '15:00'
  value: number; // dB, AQI, index, or count depending on category
  lower: number;
  upper: number;
  health_category?: string; // AQI only
}

export interface ForecastData {
  neighborhood_id: string;
  mode: 'api' | 'community';
  confidence: 'low' | 'medium' | 'high';
  community_report_count: number | null; // null in API mode, count in community mode
  generated_at: string;
  noise: HourlyPrediction[];
  aqi: HourlyPrediction[];
  litter: HourlyPrediction[];
  pollen: HourlyPrediction[];
}

// Called by ForecastScreen on mount and when mode or neighborhood changes
// Fires all 4 prediction endpoints in parallel — do not await them in sequence
export async function fetchAllForecasts(
  neighborhood: string,
  mode: 'api' | 'community'
): Promise<ForecastData> {
  if (USE_FAKE_DATA) return fakeForecastData[mode];

  const params = { mode };
  const [noise, aqi, litter, pollen] = await Promise.all([
    apiGet(`/predict-noise/${neighborhood}`, params),
    apiGet(`/predict-aqi/${neighborhood}`, params),
    apiGet(`/predict-litter/${neighborhood}`, params),
    apiGet(`/predict-pollen/${neighborhood}`, params),
  ]);

  // Normalize all 4 responses into one ForecastData shape
  // Each endpoint returns slightly different field names — flatten here
  return {
    neighborhood_id: neighborhood,
    mode,
    confidence: (noise as any).confidence ?? 'medium',
    community_report_count: (noise as any).community_report_count ?? null,
    generated_at: (noise as any).generated_at,
    noise: normalizeHourly(noise, 'db'),
    aqi: normalizeHourly(aqi, 'aqi', true),
    litter: normalizeHourly(litter, 'index'),
    pollen: normalizeHourly(pollen, 'count'),
  };
}

// Maps each endpoint's value field to a common 'value' key
function normalizeHourly(
  raw: any,
  valueKey: string,
  includeHealthCategory = false
): HourlyPrediction[] {
  return (raw.predictions ?? []).map((p: any) => ({
    hour: p.hour,
    value: p[valueKey],
    lower: p.lower,
    upper: p.upper,
    health_category: includeHealthCategory ? p.health_category : undefined,
  }));
}

// How ForecastScreen uses this:
//
// useEffect(() => {
//   setLoading(true);
//   fetchAllForecasts(selectedNeighborhood, mode)
//     .then(setForecast)
//     .finally(() => setLoading(false));
// }, [selectedNeighborhood, mode]);
