"""
Synthetic Data Generator for EnviroGuard ML Models

Generates two CSV files with realistic patterns:
1. noise_synthetic.csv - 90 days of hourly dB readings (3 stations)
2. fill_synthetic.csv - 90 days of 15-min bin fill % readings (3 stations)

This data is used to train Prophet models before real sensor data is available.

Run: python data/generate_data.py
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Set random seed for reproducibility
np.random.seed(42)

print("Generating synthetic data for EnviroGuard ML models...")

# ============================================
# NOISE DATA (90 days, hourly, 3 stations)
# ============================================

print("\n1. Generating noise data...")

# Create hourly timestamps for 90 days
start_date = datetime(2026, 1, 1)
noise_dates = pd.date_range(start=start_date, periods=2160, freq='H')

noise_data = []

for station_id in ['STATION_001', 'STATION_002', 'STATION_003']:
    print(f"   - {station_id}")

    for timestamp in noise_dates:
        hour = timestamp.hour
        day_of_week = timestamp.dayofweek

        # Base level
        db_level = 55.0

        # Daily pattern: +15dB during daytime (7am-10pm)
        if 7 <= hour <= 22:
            db_level += 15.0

        # Weekly pattern: weekdays 5dB louder than weekends
        if day_of_week < 5:  # Monday=0 to Friday=4
            db_level += 5.0

        # Random spikes (buses/trucks): 3-8 per day
        if np.random.random() < 0.15:  # ~15% chance = ~3.6 per day
            db_level += np.random.uniform(20, 35)

        # Gaussian noise
        db_level += np.random.normal(0, 5)

        # Clip to realistic range
        db_level = np.clip(db_level, 30, 100)

        noise_data.append({
            'ds': timestamp,
            'station_id': station_id,
            'y': round(db_level, 2)
        })

# Convert to DataFrame
noise_df = pd.DataFrame(noise_data)

# Simulate 2% sensor dropout
drop_indices = np.random.choice(len(noise_df), size=int(len(noise_df) * 0.02), replace=False)
noise_df = noise_df.drop(drop_indices).reset_index(drop=True)

# Save to CSV
noise_df.to_csv('data/noise_synthetic.csv', index=False)
print(f"   ✓ Saved {len(noise_df)} noise readings to data/noise_synthetic.csv")
print(f"     Mean dB: {noise_df['y'].mean():.1f}, Std: {noise_df['y'].std():.1f}")

# ============================================
# FILL DATA (90 days, 15-min intervals, 3 stations)
# ============================================

print("\n2. Generating fill data...")

# Create 15-minute timestamps for 90 days
fill_dates = pd.date_range(start=start_date, periods=8640, freq='15T')

fill_data = []

for station_id in ['STATION_001', 'STATION_002', 'STATION_003']:
    print(f"   - {station_id}")

    current_fill = 5.0  # Start at 5% after recent emptying

    for timestamp in fill_dates:
        hour = timestamp.hour
        day_of_week = timestamp.dayofweek

        # Base fill rate: 2-4% per hour = 0.5-1% per 15 min
        fill_rate_per_15min = np.random.uniform(0.5, 1.0)

        # Peak hours: 12-2pm and 6-9pm on weekdays
        is_weekday = day_of_week < 5
        is_lunch_peak = (12 <= hour < 14)
        is_dinner_peak = (18 <= hour < 21)
        is_weekend_peak = (day_of_week >= 5) and (11 <= hour < 15)

        if is_weekday and (is_lunch_peak or is_dinner_peak):
            fill_rate_per_15min = np.random.uniform(2.5, 3.75)  # 10-15% per hour
        elif is_weekend_peak:
            fill_rate_per_15min = np.random.uniform(2.0, 3.0)  # 8-12% per hour

        # Add fill
        current_fill += fill_rate_per_15min

        # Add Gaussian noise
        current_fill += np.random.normal(0, 2)

        # Clip to valid range
        current_fill = np.clip(current_fill, 0, 105)

        # Overflow reset: when reaches 95-100%, reset to 5%
        if current_fill >= 95:
            current_fill = 5.0

        fill_data.append({
            'ds': timestamp,
            'station_id': station_id,
            'y': round(current_fill, 2)
        })

# Convert to DataFrame
fill_df = pd.DataFrame(fill_data)

# Save to CSV
fill_df.to_csv('data/fill_synthetic.csv', index=False)
print(f"   ✓ Saved {len(fill_df)} fill readings to data/fill_synthetic.csv")

# Count overflow events (resets)
for station in ['STATION_001', 'STATION_002', 'STATION_003']:
    station_data = fill_df[fill_df['station_id'] == station]['y'].values
    resets = np.sum(np.diff(station_data) < -50)  # Big negative jump = reset
    print(f"     {station}: ~{resets} overflow events")

print("\n✅ Synthetic data generation complete!")
print("\nNext steps:")
print("1. On EC2: python models/noise/train_noise.py")
print("2. On EC2: python models/fill/train_fill.py")
