import { ForecastData } from '../../services/forecastService';

const generateHourlyData = (baseValue: number, variance: number) => {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, '0')}:00`,
    value: baseValue + Math.random() * variance - variance / 2,
    lower: baseValue - variance / 2,
    upper: baseValue + variance / 2,
  }));
};

export const fakeForecastData: Record<'api' | 'community', ForecastData> = {
  api: {
    neighborhood_id: 'williamsburg',
    mode: 'api',
    confidence: 'high',
    community_report_count: null,
    generated_at: new Date().toISOString(),
    noise: generateHourlyData(65, 15).map(p => ({ ...p, value: Math.round(p.value) })),
    aqi: generateHourlyData(75, 30).map(p => ({
      ...p,
      value: Math.round(p.value),
      health_category: p.value > 100 ? 'Unhealthy for Sensitive Groups' : 'Moderate'
    })),
    litter: generateHourlyData(3, 2).map(p => ({ ...p, value: Math.round(p.value) })),
    pollen: generateHourlyData(60, 20).map(p => ({ ...p, value: Math.round(p.value) })),
  },
  community: {
    neighborhood_id: 'williamsburg',
    mode: 'community',
    confidence: 'medium',
    community_report_count: 45,
    generated_at: new Date().toISOString(),
    noise: generateHourlyData(70, 20).map(p => ({ ...p, value: Math.round(p.value) })),
    aqi: generateHourlyData(68, 25).map(p => ({
      ...p,
      value: Math.round(p.value),
      health_category: p.value > 100 ? 'Unhealthy for Sensitive Groups' : 'Moderate'
    })),
    litter: generateHourlyData(4, 3).map(p => ({ ...p, value: Math.round(p.value) })),
    pollen: generateHourlyData(55, 18).map(p => ({ ...p, value: Math.round(p.value) })),
  }
};
