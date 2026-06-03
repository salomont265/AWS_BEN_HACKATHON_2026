import { apiGet } from '../utils/api';

export interface HourlyPrediction {
  hour: string;
  value: number;
  lower: number;
  upper: number;
}

export interface ForecastData {
  neighborhood_id: string;
  mode: 'api' | 'ml';
  confidence: string;
  generated_at: string;
  noise: HourlyPrediction[];
  aqi: HourlyPrediction[];
  litter: HourlyPrediction[];
  pollen: HourlyPrediction[];
}

export async function fetchAllForecasts(
  neighborhood: string,
  mode: 'api' | 'ml'
): Promise<ForecastData> {
  try {
    const [noise, aqi, litter, pollen] = await Promise.all([
      apiGet(`/predict-noise/${neighborhood}`, { mode }),
      apiGet(`/predict-aqi/${neighborhood}`, { mode }),
      apiGet(`/predict-litter/${neighborhood}`, { mode }),
      apiGet(`/predict-pollen/${neighborhood}`, { mode }),
    ]);

    return {
      neighborhood_id: neighborhood,
      mode,
      confidence: 'high',
      generated_at: new Date().toISOString(),
      noise: normalizeMLResponse(noise),
      aqi: normalizeMLResponse(aqi),
      litter: normalizeMLResponse(litter),
      pollen: normalizeMLResponse(pollen),
    };
  } catch (error) {
    console.error('fetchAllForecasts ERROR:', error);
    throw error;
  }
}

// ML API returns: { category, data: { prediction[], lower[], upper[], timestamp[] }, mode, neighborhood }
function normalizeMLResponse(raw: any): HourlyPrediction[] {
  if (!raw?.data?.prediction) {
    console.error('Invalid ML response:', raw);
    return [];
  }

  const { prediction, lower, upper, timestamp } = raw.data;

  return prediction.map((value: number, index: number) => {
    const date = timestamp ? new Date(timestamp[index]) : new Date();
    const hour = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return {
      hour,
      value: Math.round(value),
      lower: Math.round(lower[index]),
      upper: Math.round(upper[index]),
    };
  });
}
