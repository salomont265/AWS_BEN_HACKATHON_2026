# Data Directory

## Overview

This directory contains training data for the Environmental Prediction ML models.

## Files Included in Repository

### Processed Training Data (CSVs)
- `aqi_real_api.csv` - AQI training data (1,644 hours)
- `noise_real_api.csv` - Noise training data (1,644 hours)
- `litter_real_api.csv` - Litter training data (1,644 hours)
- `pollen_real_api.csv` - Pollen training data (1,644 hours)

### Verified Source Data
- `verified_real_weather.csv` - Weather from Open-Meteo API
- `verified_real_aqi.csv` - AQI from EPA AirNow API
- `verified_real_noise_complaints.csv` - NYC 311 noise complaints
- `verified_real_litter_complaints.csv` - NYC 311 litter complaints
- `verified_synthetic_pollen.csv` - Synthetic pollen patterns

## Files NOT Included (Too Large)

### raw_api_responses/ (366 MB - excluded from git)

Contains raw JSON responses from APIs as proof of data authenticity:
- `weather_response.json` (52 KB)
- `noise_complaints.json` (342 MB - 186,946 records!)
- `litter_complaints.json` (24 MB - 20,144 records)
- `aqi_responses/` (92 daily JSON files)

**Note:** These files are too large for git. They prove data authenticity but aren't needed to use the models.

## Regenerating Data

If you need to fetch fresh data:

### 1. Weather Data
```bash
# No API key needed
python3 scripts/fetch_weather_data.py
```

### 2. NYC 311 Data
```bash
# No API key needed
python3 scripts/fetch_and_process_noise_data.py
```

### 3. EPA AQI Data
```bash
# Requires API key (free registration)
export EPA_AIRNOW_API_KEY="your-key-here"
python3 scripts/fetch_real_aqi_data.py
```

### 4. Pollen Data
Pollen data is synthetic (no free API exists). Regenerate with:
```bash
python3 scripts/generate_pollen_data.py
```

## Data Sources

| File | Source | Records | Status |
|------|--------|---------|--------|
| Weather | Open-Meteo API | 1,644 hours | ✅ Real |
| Noise | NYC 311 API | 186,946 complaints | ✅ Real |
| Litter | NYC 311 API | 20,144 complaints | ✅ Real |
| AQI | EPA AirNow API | 92 days | ✅ Real |
| Pollen | Generated | 2,208 hours | ⚠️ Synthetic |

## Data Privacy

All data is from public APIs and contains no personal information:
- NYC 311: Aggregated complaint counts (no names/addresses)
- EPA AirNow: Public sensor readings
- Open-Meteo: Public weather data

## License

Data sourced from:
- NYC Open Data: Public domain
- EPA AirNow: Public domain (U.S. Government)
- Open-Meteo: CC BY 4.0
