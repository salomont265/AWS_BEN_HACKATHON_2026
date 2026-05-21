#!/usr/bin/env python3
"""
Fetch REAL AQI data from EPA AirNow API for NYC ZIP 10001
Date range: February 15, 2026 to May 17, 2026
"""

import requests
import json
import time
from datetime import datetime, timedelta
import pandas as pd
import os

# API configuration
# Get API key from environment variable or use placeholder
API_KEY = os.getenv("EPA_AIRNOW_API_KEY", "YOUR_API_KEY_HERE")
BASE_URL = "http://www.airnowapi.org/aq/observation/zipCode/historical/"
ZIP_CODE = "10001"
DISTANCE = 25

# Date range
START_DATE = datetime(2026, 2, 15)
END_DATE = datetime(2026, 5, 17)

# Output paths
RAW_RESPONSE_DIR = "/home/ec2-user/ml model/data/raw_api_responses/aqi_responses/"
CSV_OUTPUT = "/home/ec2-user/ml model/data/verified_real_aqi.csv"

# Ensure output directory exists
os.makedirs(RAW_RESPONSE_DIR, exist_ok=True)

def fetch_aqi_for_date(date_obj):
    """Fetch AQI data for a specific date"""
    date_str = date_obj.strftime("%Y-%m-%d")

    params = {
        'format': 'application/json',
        'zipCode': ZIP_CODE,
        'date': date_str + "T00-0000",  # Format: YYYY-MM-DDTHH-0000
        'distance': DISTANCE,
        'API_KEY': API_KEY
    }

    print(f"Fetching data for {date_str}...")

    try:
        response = requests.get(BASE_URL, params=params, timeout=30)

        # Save raw response
        response_file = os.path.join(RAW_RESPONSE_DIR, f"aqi_{date_str}.json")
        with open(response_file, 'w') as f:
            json.dump({
                'date': date_str,
                'status_code': response.status_code,
                'url': response.url,
                'response': response.json() if response.status_code == 200 else response.text
            }, f, indent=2)

        if response.status_code == 200:
            data = response.json()
            print(f"  ✓ Success: {len(data)} records")
            return data
        else:
            print(f"  ✗ Error {response.status_code}: {response.text}")
            return None

    except Exception as e:
        print(f"  ✗ Exception: {str(e)}")
        return None

def main():
    print("=" * 80)
    print("FETCHING REAL AQI DATA FROM EPA AirNow API")
    print("=" * 80)
    print(f"ZIP Code: {ZIP_CODE}")
    print(f"Date Range: {START_DATE.date()} to {END_DATE.date()}")
    print(f"API Key: {API_KEY[:8]}...{API_KEY[-8:]}")
    print(f"Raw responses will be saved to: {RAW_RESPONSE_DIR}")
    print("=" * 80)
    print()

    all_data = []
    current_date = START_DATE

    # Fetch data for each date
    while current_date <= END_DATE:
        data = fetch_aqi_for_date(current_date)

        if data and isinstance(data, list):
            for record in data:
                all_data.append({
                    'date': current_date.strftime("%Y-%m-%d"),
                    'raw_data': record
                })

        current_date += timedelta(days=1)

        # Be respectful to the API - small delay between requests
        time.sleep(0.5)

    print()
    print("=" * 80)
    print(f"Total records fetched: {len(all_data)}")
    print("=" * 80)
    print()

    if not all_data:
        print("ERROR: No data was returned from the API!")
        print("This could mean:")
        print("  1. The API key is invalid")
        print("  2. The date range is in the future (API only has historical data)")
        print("  3. No monitoring stations are within the distance parameter")
        print("  4. The API is down or has changed")
        print()
        print("CRITICAL: Cannot proceed without real data. Will NOT generate fake data.")
        return

    # Process data into CSV format
    print("Processing data into CSV format...")
    rows = []

    for entry in all_data:
        record = entry['raw_data']

        # Extract relevant fields
        date_observed = record.get('DateObserved', '')
        hour_observed = record.get('HourObserved', '')
        aqi_value = record.get('AQI', None)
        category = record.get('Category', {}).get('Name', '')
        parameter = record.get('ParameterName', '')

        # Create timestamp
        if date_observed and hour_observed is not None:
            try:
                timestamp = datetime.strptime(f"{date_observed} {hour_observed}", "%Y-%m-%d %H")
            except:
                timestamp = date_observed
        else:
            timestamp = date_observed

        rows.append({
            'timestamp': timestamp,
            'aqi_value': aqi_value,
            'category': category,
            'parameter': parameter,
            'reporting_area': record.get('ReportingArea', ''),
            'state_code': record.get('StateCode', ''),
            'latitude': record.get('Latitude', ''),
            'longitude': record.get('Longitude', '')
        })

    # Create DataFrame
    df = pd.DataFrame(rows)

    # Sort by timestamp
    df = df.sort_values('timestamp')

    # Save to CSV
    df.to_csv(CSV_OUTPUT, index=False)
    print(f"✓ CSV saved to: {CSV_OUTPUT}")
    print()

    # Show sample data
    print("=" * 80)
    print("FIRST 5 ROWS OF DATA:")
    print("=" * 80)
    print(df.head().to_string())
    print()

    # Show raw API response sample
    print("=" * 80)
    print("SAMPLE RAW API RESPONSE (first record):")
    print("=" * 80)
    if all_data:
        print(json.dumps(all_data[0]['raw_data'], indent=2))
    print()

    # Summary statistics
    print("=" * 80)
    print("DATA SUMMARY:")
    print("=" * 80)
    print(f"Total records: {len(df)}")
    print(f"Date range: {df['timestamp'].min()} to {df['timestamp'].max()}")
    print(f"Parameters monitored: {df['parameter'].unique()}")
    print(f"AQI categories: {df['category'].unique()}")
    print(f"AQI range: {df['aqi_value'].min()} to {df['aqi_value'].max()}")
    print()

    print("=" * 80)
    print("SUCCESS: Real EPA AQI data has been fetched and saved!")
    print("=" * 80)

if __name__ == "__main__":
    main()
