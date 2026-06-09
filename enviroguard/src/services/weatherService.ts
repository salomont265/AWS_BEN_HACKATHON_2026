import { apiGet } from '@/utils/api';
import { HourlyPrediction } from './forecastService';

export interface CurrentWeather {
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  uv: number;
  description: string;
  icon: string;
}

export interface WeatherForecast {
  timestamp: string;
  temp: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  uv: number;
  description: string;
}

export interface WeatherResponse {
  current: CurrentWeather;
  forecast: WeatherForecast[];
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResponse> {
  return apiGet<WeatherResponse>('/weather', {
    lat: lat.toString(),
    lng: lng.toString(),
  });
}

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

export function getUVLevel(uv: number): { level: string; color: string } {
  if (uv <= 2) return { level: 'Low', color: '#22c55e' };
  if (uv <= 5) return { level: 'Moderate', color: '#eab308' };
  if (uv <= 7) return { level: 'High', color: '#f97316' };
  if (uv <= 10) return { level: 'Very High', color: '#ef4444' };
  return { level: 'Extreme', color: '#991b1b' };
}

export function convertWeatherToHourlyPredictions(
  forecast: WeatherForecast[],
  metric: 'temp' | 'humidity' | 'wind_speed'
): HourlyPrediction[] {
  return forecast.slice(0, 24).map((hour) => {
    const hourTime = new Date(hour.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    let value: number;
    switch (metric) {
      case 'temp':
        value = hour.temp;
        break;
      case 'humidity':
        value = hour.humidity;
        break;
      case 'wind_speed':
        value = hour.wind_speed;
        break;
    }

    return {
      hour: hourTime,
      value,
      lower: value, // No confidence interval for weather forecasts
      upper: value,
    };
  });
}
