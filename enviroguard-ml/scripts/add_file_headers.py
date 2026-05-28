#!/usr/bin/env python3
"""
Add documentation headers to all training files explaining data sources.
"""

import pandas as pd

def add_header_to_file(filepath, header_lines):
    """Add header comment lines to a CSV file."""

    # Read the existing file
    df = pd.read_csv(filepath)

    # Write back with headers
    with open(filepath, 'w') as f:
        for line in header_lines:
            f.write(f"# {line}\n")
        df.to_csv(f, index=False)

    print(f"✓ Added header to {filepath}")

def main():
    """Add headers to all 8 training files."""

    print("Adding documentation headers to training files...\n")

    # AQI API Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/aqi_real_api.csv',
        [
            "AQI TRAINING DATA (API Mode) - Real EPA Data",
            "Data Sources:",
            "  - timestamp, temperature, humidity, wind_speed: Real NOAA weather data (NYC)",
            "  - y (aqi_value): Real EPA AQI data (NYC), interpolated from daily to hourly",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: AQI values linearly interpolated between daily measurements"
        ]
    )

    # Noise API Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/noise_real_api.csv',
        [
            "NOISE TRAINING DATA (API Mode) - Derived from Real Complaints",
            "Data Sources:",
            "  - timestamp, temperature, humidity, wind_speed: Real NOAA weather data (NYC)",
            "  - y (noise_db): Derived from real NYC 311 noise complaints using formula:",
            "      noise_db = 50 + 15 * log(1 + complaint_count)",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Noise dB is estimated, not measured directly"
        ]
    )

    # Litter API Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/litter_real_api.csv',
        [
            "LITTER TRAINING DATA (API Mode) - Derived from Real Complaints",
            "Data Sources:",
            "  - timestamp, temperature, humidity, wind_speed: Real NOAA weather data (NYC)",
            "  - y (severity): Derived from real NYC 311 litter complaints using formula:",
            "      severity = min(10, 1 + complaint_count/5) * (1 + (temp-10)/50)",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Severity is estimated on 1-10 scale based on complaints and temperature"
        ]
    )

    # Pollen API Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/pollen_real_api.csv',
        [
            "POLLEN TRAINING DATA (API Mode) - Synthetic Data",
            "Data Sources:",
            "  - timestamp, temperature, humidity, wind_speed: Real NOAA weather data (NYC)",
            "  - grass_pollen, tree_pollen, weed_pollen: SYNTHETIC (generated for modeling)",
            "  - y (total_pollen): Sum of grass + tree + weed pollen",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Pollen values follow NYC seasonal patterns (Tree peaks April, Grass peaks June, Weed peaks September)"
        ]
    )

    # AQI Community Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/aqi_real_community.csv',
        [
            "AQI TRAINING DATA (Community Mode) - Real EPA Data",
            "Data Sources:",
            "  - timestamp: Real NOAA weather data timestamps (NYC)",
            "  - y (severity): Real EPA AQI data (NYC), interpolated to hourly, scaled to 1-10",
            "      Formula: severity = clip(aqi_value / 15, 1, 10)",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: AQI values linearly interpolated between daily measurements"
        ]
    )

    # Noise Community Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/noise_real_community.csv',
        [
            "NOISE TRAINING DATA (Community Mode) - Derived from Real Complaints",
            "Data Sources:",
            "  - timestamp: Real NOAA weather data timestamps (NYC)",
            "  - y (severity): Derived from real NYC 311 noise complaints, scaled to 1-10",
            "      Formula: noise_db = 50 + 15*log(1+complaints), then map 50-100dB to 1-10 scale",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Severity is estimated on 1-10 scale based on complaint patterns"
        ]
    )

    # Litter Community Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/litter_real_community.csv',
        [
            "LITTER TRAINING DATA (Community Mode) - Derived from Real Complaints",
            "Data Sources:",
            "  - timestamp: Real NOAA weather data timestamps (NYC)",
            "  - y (severity): Derived from real NYC 311 litter complaints, scaled to 1-10",
            "      Formula: severity = min(10, 1 + complaint_count/5) * (1 + (temp-10)/50)",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Severity considers both complaint count and temperature effects"
        ]
    )

    # Pollen Community Mode
    add_header_to_file(
        '/home/ec2-user/ml model/data/pollen_real_community.csv',
        [
            "POLLEN TRAINING DATA (Community Mode) - Synthetic Data",
            "Data Sources:",
            "  - timestamp: Real NOAA weather data timestamps (NYC)",
            "  - y (severity): SYNTHETIC pollen data (grass + tree + weed), scaled to 1-10",
            "      Formula: severity = map(total_pollen, 0-30 range to 1-10 scale)",
            "Data Range: 2026-03-10 12:00:00 to 2026-05-17 23:00:00 (1,644 hourly records)",
            "Note: Pollen follows NYC seasonal patterns (Tree peaks April, Grass June, Weed September)"
        ]
    )

    print("\n✓ All headers added successfully!")

if __name__ == "__main__":
    main()
