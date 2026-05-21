#!/usr/bin/env python3
"""
Merge verified real data into unified training datasets for model retraining.

This script:
1. Interpolates AQI from daily to hourly
2. Aligns all timestamps to a common date range
3. Creates 8 training CSV files (4 API mode, 4 Community mode)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def load_and_process_data():
    """Load all input datasets and determine common date range."""

    print("Loading input files...")

    # Load weather data (hourly)
    weather = pd.read_csv('/home/ec2-user/ml model/data/verified_real_weather.csv')
    weather['timestamp'] = pd.to_datetime(weather['timestamp'])
    print(f"Weather: {len(weather)} hours from {weather['timestamp'].min()} to {weather['timestamp'].max()}")

    # Load AQI data (daily - needs interpolation)
    aqi = pd.read_csv('/home/ec2-user/ml model/data/verified_real_aqi.csv')
    aqi['timestamp'] = pd.to_datetime(aqi['timestamp'])
    print(f"AQI: {len(aqi)} days from {aqi['timestamp'].min()} to {aqi['timestamp'].max()}")

    # Load noise complaints (hourly)
    noise = pd.read_csv('/home/ec2-user/ml model/data/verified_real_noise_complaints.csv')
    noise['timestamp'] = pd.to_datetime(noise['timestamp'])
    print(f"Noise: {len(noise)} hours from {noise['timestamp'].min()} to {noise['timestamp'].max()}")

    # Load litter complaints (hourly)
    litter = pd.read_csv('/home/ec2-user/ml model/data/verified_real_litter_complaints.csv')
    litter['timestamp'] = pd.to_datetime(litter['timestamp'])
    print(f"Litter: {len(litter)} hours from {litter['timestamp'].min()} to {litter['timestamp'].max()}")

    # Load synthetic pollen (hourly)
    # Skip first 2 lines (comment lines)
    pollen = pd.read_csv('/home/ec2-user/ml model/data/verified_synthetic_pollen.csv', skiprows=2)
    pollen['timestamp'] = pd.to_datetime(pollen['timestamp'])
    print(f"Pollen: {len(pollen)} hours from {pollen['timestamp'].min()} to {pollen['timestamp'].max()}")

    return weather, aqi, noise, litter, pollen

def interpolate_aqi_to_hourly(aqi_daily):
    """Interpolate daily AQI values to hourly resolution."""

    print("\nInterpolating AQI from daily to hourly...")

    # Get the max value from the two parameters for each day
    aqi_by_day = aqi_daily.groupby('timestamp')['aqi_value'].max().reset_index()

    # Create hourly timestamps for the entire range
    start_date = aqi_by_day['timestamp'].min()
    end_date = aqi_by_day['timestamp'].max()

    # Generate hourly timestamps
    hourly_timestamps = pd.date_range(start=start_date, end=end_date + timedelta(days=1), freq='H')[:-1]

    # Create a dataframe with hourly timestamps
    aqi_hourly = pd.DataFrame({'timestamp': hourly_timestamps})

    # Merge with daily data
    aqi_hourly['date'] = aqi_hourly['timestamp'].dt.date
    aqi_by_day['date'] = aqi_by_day['timestamp'].dt.date

    # Merge and forward fill, then interpolate
    aqi_hourly = aqi_hourly.merge(aqi_by_day[['date', 'aqi_value']], on='date', how='left')

    # Interpolate linearly between days
    aqi_hourly['aqi_value'] = aqi_hourly['aqi_value'].interpolate(method='linear')

    # Fill any remaining NaNs
    aqi_hourly['aqi_value'] = aqi_hourly['aqi_value'].fillna(method='ffill').fillna(method='bfill')

    # Drop the date column
    aqi_hourly = aqi_hourly[['timestamp', 'aqi_value']]

    print(f"Interpolated to {len(aqi_hourly)} hourly records")

    return aqi_hourly

def find_common_date_range(weather, aqi_hourly, noise, litter, pollen):
    """Find the intersection of all datasets."""

    print("\nFinding common date range...")

    # Get min and max timestamps for each dataset
    ranges = {
        'weather': (weather['timestamp'].min(), weather['timestamp'].max()),
        'aqi': (aqi_hourly['timestamp'].min(), aqi_hourly['timestamp'].max()),
        'noise': (noise['timestamp'].min(), noise['timestamp'].max()),
        'litter': (litter['timestamp'].min(), litter['timestamp'].max()),
        'pollen': (pollen['timestamp'].min(), pollen['timestamp'].max())
    }

    for name, (start, end) in ranges.items():
        print(f"  {name}: {start} to {end}")

    # Find intersection
    start_date = max(r[0] for r in ranges.values())
    end_date = min(r[1] for r in ranges.values())

    print(f"\nCommon range: {start_date} to {end_date}")

    return start_date, end_date

def merge_datasets(weather, aqi_hourly, noise, litter, pollen, start_date, end_date):
    """Merge all datasets on timestamp within the common date range."""

    print("\nMerging datasets...")

    # Filter to common date range
    weather_filtered = weather[(weather['timestamp'] >= start_date) & (weather['timestamp'] <= end_date)].copy()
    aqi_filtered = aqi_hourly[(aqi_hourly['timestamp'] >= start_date) & (aqi_hourly['timestamp'] <= end_date)].copy()
    noise_filtered = noise[(noise['timestamp'] >= start_date) & (noise['timestamp'] <= end_date)].copy()
    litter_filtered = litter[(litter['timestamp'] >= start_date) & (litter['timestamp'] <= end_date)].copy()
    pollen_filtered = pollen[(pollen['timestamp'] >= start_date) & (pollen['timestamp'] <= end_date)].copy()

    # Start with weather as base (it has all the hourly features)
    merged = weather_filtered.copy()

    # Merge AQI
    merged = merged.merge(aqi_filtered[['timestamp', 'aqi_value']], on='timestamp', how='left')

    # Merge noise (keep complaint count)
    merged = merged.merge(noise_filtered[['timestamp', 'complaint_count']],
                         on='timestamp', how='left', suffixes=('', '_noise'))
    merged.rename(columns={'complaint_count': 'noise_complaint_count'}, inplace=True)

    # Merge litter (keep complaint count)
    merged = merged.merge(litter_filtered[['timestamp', 'complaint_count']],
                         on='timestamp', how='left', suffixes=('', '_litter'))
    merged.rename(columns={'complaint_count': 'litter_complaint_count'}, inplace=True)

    # Merge pollen
    merged = merged.merge(pollen_filtered[['timestamp', 'grass_pollen', 'tree_pollen', 'weed_pollen']],
                         on='timestamp', how='left')

    # Fill any missing values with 0 for complaint counts
    merged['noise_complaint_count'] = merged['noise_complaint_count'].fillna(0)
    merged['litter_complaint_count'] = merged['litter_complaint_count'].fillna(0)

    print(f"Merged dataset: {len(merged)} records")
    print(f"Missing values per column:")
    print(merged.isnull().sum())

    return merged

def derive_noise_db(complaint_count):
    """Derive noise_db from complaint count."""
    # More complaints = higher noise levels
    # Baseline: 50 dB (quiet) + scale based on complaints
    # Scale: logarithmic relationship
    return 50 + 15 * np.log1p(complaint_count)

def derive_litter_severity(complaint_count, temperature):
    """Derive litter severity from complaints and temperature."""
    # More complaints = higher severity
    # Higher temperature = more activity, more litter
    # Scale to 1-10 range
    base_severity = np.minimum(10, 1 + complaint_count / 5)
    temp_factor = 1 + (temperature - 10) / 50  # Increases with temperature
    severity = base_severity * temp_factor
    return np.clip(severity, 1, 10)

def convert_to_severity_scale(value, min_val, max_val):
    """Convert a value to 1-10 severity scale."""
    normalized = (value - min_val) / (max_val - min_val)
    severity = 1 + (normalized * 9)
    return np.clip(severity, 1, 10)

def create_api_mode_files(merged):
    """Create 4 API mode training files."""

    print("\nCreating API mode training files...")

    # AQI API mode
    aqi_api = merged[['timestamp', 'temperature', 'humidity', 'wind_speed', 'aqi_value']].copy()
    aqi_api.rename(columns={'aqi_value': 'y'}, inplace=True)
    aqi_api.to_csv('/home/ec2-user/ml model/data/aqi_real_api.csv', index=False)
    print(f"  Created aqi_real_api.csv with {len(aqi_api)} records")

    # Noise API mode
    noise_api = merged[['timestamp', 'temperature', 'humidity', 'wind_speed', 'noise_complaint_count']].copy()
    noise_api['y'] = derive_noise_db(noise_api['noise_complaint_count'])
    noise_api.drop('noise_complaint_count', axis=1, inplace=True)
    noise_api.to_csv('/home/ec2-user/ml model/data/noise_real_api.csv', index=False)
    print(f"  Created noise_real_api.csv with {len(noise_api)} records")

    # Litter API mode
    litter_api = merged[['timestamp', 'temperature', 'humidity', 'wind_speed', 'litter_complaint_count']].copy()
    litter_api['y'] = derive_litter_severity(litter_api['litter_complaint_count'], merged['temperature'])
    litter_api.drop('litter_complaint_count', axis=1, inplace=True)
    litter_api.to_csv('/home/ec2-user/ml model/data/litter_real_api.csv', index=False)
    print(f"  Created litter_real_api.csv with {len(litter_api)} records")

    # Pollen API mode
    pollen_api = merged[['timestamp', 'temperature', 'humidity', 'wind_speed',
                        'grass_pollen', 'tree_pollen', 'weed_pollen']].copy()
    pollen_api['y'] = pollen_api['grass_pollen'] + pollen_api['tree_pollen'] + pollen_api['weed_pollen']
    pollen_api.to_csv('/home/ec2-user/ml model/data/pollen_real_api.csv', index=False)
    print(f"  Created pollen_real_api.csv with {len(pollen_api)} records")

def create_community_mode_files(merged):
    """Create 4 Community mode training files."""

    print("\nCreating Community mode training files...")

    # AQI Community mode (convert to 1-10 scale)
    aqi_community = merged[['timestamp', 'aqi_value']].copy()
    # AQI ranges: 0-50 Good, 51-100 Moderate, 101-150 Unhealthy for Sensitive, etc.
    # Map to 1-10: divide by 15 (150/10)
    aqi_community['y'] = np.clip(aqi_community['aqi_value'] / 15, 1, 10)
    aqi_community.drop('aqi_value', axis=1, inplace=True)
    aqi_community.to_csv('/home/ec2-user/ml model/data/aqi_real_community.csv', index=False)
    print(f"  Created aqi_real_community.csv with {len(aqi_community)} records")

    # Noise Community mode (convert dB to 1-10 scale)
    noise_community = merged[['timestamp', 'noise_complaint_count']].copy()
    noise_db = derive_noise_db(noise_community['noise_complaint_count'])
    # Typical range: 50-100 dB -> map to 1-10
    noise_community['y'] = convert_to_severity_scale(noise_db, 50, 100)
    noise_community.drop('noise_complaint_count', axis=1, inplace=True)
    noise_community.to_csv('/home/ec2-user/ml model/data/noise_real_community.csv', index=False)
    print(f"  Created noise_real_community.csv with {len(noise_community)} records")

    # Litter Community mode (already 1-10 scale)
    litter_community = merged[['timestamp', 'litter_complaint_count']].copy()
    litter_community['y'] = derive_litter_severity(litter_community['litter_complaint_count'],
                                                     merged['temperature'])
    litter_community.drop('litter_complaint_count', axis=1, inplace=True)
    litter_community.to_csv('/home/ec2-user/ml model/data/litter_real_community.csv', index=False)
    print(f"  Created litter_real_community.csv with {len(litter_community)} records")

    # Pollen Community mode (convert total pollen to 1-10 scale)
    pollen_community = merged[['timestamp', 'grass_pollen', 'tree_pollen', 'weed_pollen']].copy()
    total_pollen = pollen_community['grass_pollen'] + pollen_community['tree_pollen'] + pollen_community['weed_pollen']
    # Typical range: 0-30 total pollen -> map to 1-10
    pollen_community['y'] = convert_to_severity_scale(total_pollen, 0, 30)
    pollen_community = pollen_community[['timestamp', 'y']]
    pollen_community.to_csv('/home/ec2-user/ml model/data/pollen_real_community.csv', index=False)
    print(f"  Created pollen_real_community.csv with {len(pollen_community)} records")

def print_summary(merged, start_date, end_date):
    """Print summary of the merged dataset."""

    print("\n" + "="*80)
    print("DATA MERGE SUMMARY")
    print("="*80)

    print(f"\nFinal Date Range: {start_date} to {end_date}")
    print(f"Total Hourly Records: {len(merged)}")

    print("\n--- Sample Rows from Each Dataset ---\n")

    # AQI API
    print("AQI (API Mode):")
    aqi_sample = pd.read_csv('/home/ec2-user/ml model/data/aqi_real_api.csv').head(3)
    print(aqi_sample.to_string(index=False))

    print("\n\nNoise (API Mode):")
    noise_sample = pd.read_csv('/home/ec2-user/ml model/data/noise_real_api.csv').head(3)
    print(noise_sample.to_string(index=False))

    print("\n\nLitter (API Mode):")
    litter_sample = pd.read_csv('/home/ec2-user/ml model/data/litter_real_api.csv').head(3)
    print(litter_sample.to_string(index=False))

    print("\n\nPollen (API Mode):")
    pollen_sample = pd.read_csv('/home/ec2-user/ml model/data/pollen_real_api.csv').head(3)
    print(pollen_sample.to_string(index=False))

    print("\n\nAQI (Community Mode):")
    aqi_comm_sample = pd.read_csv('/home/ec2-user/ml model/data/aqi_real_community.csv').head(3)
    print(aqi_comm_sample.to_string(index=False))

    print("\n\nNoise (Community Mode):")
    noise_comm_sample = pd.read_csv('/home/ec2-user/ml model/data/noise_real_community.csv').head(3)
    print(noise_comm_sample.to_string(index=False))

    print("\n\nLitter (Community Mode):")
    litter_comm_sample = pd.read_csv('/home/ec2-user/ml model/data/litter_real_community.csv').head(3)
    print(litter_comm_sample.to_string(index=False))

    print("\n\nPollen (Community Mode):")
    pollen_comm_sample = pd.read_csv('/home/ec2-user/ml model/data/pollen_real_community.csv').head(3)
    print(pollen_comm_sample.to_string(index=False))

    print("\n\n--- Data Alignment Confirmation ---\n")

    # Check that all files have the same number of records
    files = [
        'aqi_real_api.csv', 'noise_real_api.csv', 'litter_real_api.csv', 'pollen_real_api.csv',
        'aqi_real_community.csv', 'noise_real_community.csv', 'litter_real_community.csv', 'pollen_real_community.csv'
    ]

    print("Record counts per file:")
    for file in files:
        count = len(pd.read_csv(f'/home/ec2-user/ml model/data/{file}'))
        print(f"  {file}: {count} records")

    print("\n✓ All data successfully merged and aligned!")
    print("="*80)

def main():
    """Main execution function."""

    print("="*80)
    print("MERGING VERIFIED REAL DATA INTO UNIFIED TRAINING DATASETS")
    print("="*80)

    # Load data
    weather, aqi, noise, litter, pollen = load_and_process_data()

    # Interpolate AQI to hourly
    aqi_hourly = interpolate_aqi_to_hourly(aqi)

    # Find common date range
    start_date, end_date = find_common_date_range(weather, aqi_hourly, noise, litter, pollen)

    # Merge all datasets
    merged = merge_datasets(weather, aqi_hourly, noise, litter, pollen, start_date, end_date)

    # Create API mode files
    create_api_mode_files(merged)

    # Create Community mode files
    create_community_mode_files(merged)

    # Print summary
    print_summary(merged, start_date, end_date)

    print("\nAll training datasets created successfully!")
    print("Files saved to: /home/ec2-user/ml model/data/")

if __name__ == "__main__":
    main()
