#!/usr/bin/env python3
import json
import csv
import requests
from datetime import datetime
from collections import defaultdict
import time

# API configuration
base_url = "https://data.cityofnewyork.us/resource/erm2-nwe9.json"
start_date = "2026-02-15T00:00:00"
end_date = "2026-05-17T23:59:59"

# Fetch data with pagination
all_complaints = []
offset = 0
limit = 50000
page = 1
max_retries = 3

print("Fetching noise complaints from NYC Open Data API...")

while True:
    params = {
        "$where": f"complaint_type like '%Noise%' AND created_date >= '{start_date}' AND created_date <= '{end_date}'",
        "$limit": limit,
        "$offset": offset,
        "$order": "created_date ASC"
    }

    print(f"  Fetching page {page} (offset {offset})...")

    # Retry logic
    for attempt in range(max_retries):
        try:
            response = requests.get(base_url, params=params, timeout=120)

            if response.status_code != 200:
                print(f"  Error: HTTP {response.status_code}")
                break

            data = response.json()
            count = len(data)
            print(f"  Retrieved {count} records")

            if count == 0:
                break

            all_complaints.extend(data)

            if count < limit:
                # Last page
                break

            offset += limit
            page += 1
            time.sleep(1)  # Be nice to the API
            break  # Success, exit retry loop

        except (requests.exceptions.ReadTimeout, requests.exceptions.ConnectionError) as e:
            if attempt < max_retries - 1:
                wait_time = (attempt + 1) * 10
                print(f"  Timeout/connection error. Retrying in {wait_time}s... (attempt {attempt + 2}/{max_retries})")
                time.sleep(wait_time)
            else:
                print(f"  Failed after {max_retries} attempts. Using {len(all_complaints)} records collected so far.")
                break
    else:
        # This executes if we didn't break from the inner loop
        continue

    # Check if we broke from pagination loop
    if len(data) == 0 or len(data) < limit:
        break

print(f"\nTotal complaints fetched: {len(all_complaints)}")

# Save raw API response
raw_path = '/home/ec2-user/ml model/data/raw_api_responses/noise_complaints.json'
print(f"\nSaving raw data to {raw_path}...")
with open(raw_path, 'w') as f:
    json.dump(all_complaints, f, indent=2)

# Show sample complaint IDs
if all_complaints:
    print("\nSample complaint IDs:")
    for i, complaint in enumerate(all_complaints[:5]):
        unique_key = complaint.get('unique_key', 'N/A')
        created_date = complaint.get('created_date', 'N/A')
        complaint_type = complaint.get('complaint_type', 'N/A')
        print(f"  {i+1}. ID: {unique_key} | Date: {created_date} | Type: {complaint_type}")

# Group by hour
print("\nGrouping complaints by hour...")
hourly_data = defaultdict(lambda: {'count': 0, 'ids': []})

for complaint in all_complaints:
    if 'created_date' in complaint:
        # Parse the timestamp and round to hour
        dt = datetime.fromisoformat(complaint['created_date'].replace('Z', '+00:00'))
        hour_bucket = dt.strftime('%Y-%m-%d %H:00:00')

        hourly_data[hour_bucket]['count'] += 1
        # Store sample IDs (up to 3 per hour for proof)
        if len(hourly_data[hour_bucket]['ids']) < 3:
            hourly_data[hour_bucket]['ids'].append(complaint.get('unique_key', 'N/A'))

# Sort by timestamp
sorted_hours = sorted(hourly_data.items())

# Write to CSV
csv_path = '/home/ec2-user/ml model/data/verified_real_noise_complaints.csv'
print(f"\nWriting CSV to {csv_path}...")
with open(csv_path, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['timestamp', 'complaint_count', 'complaint_ids'])

    for hour, data in sorted_hours:
        ids_str = ';'.join(data['ids'])
        writer.writerow([hour, data['count'], ids_str])

print(f"\nTotal hourly buckets: {len(sorted_hours)}")
print("\nFirst 10 hourly counts:")
for i, (hour, data) in enumerate(sorted_hours[:10]):
    print(f"  {hour}: {data['count']} complaints")

print(f"\nLast 10 hourly counts:")
for i, (hour, data) in enumerate(sorted_hours[-10:]):
    print(f"  {hour}: {data['count']} complaints")

print("\nProcessing complete!")
print(f"Data range: {sorted_hours[0][0]} to {sorted_hours[-1][0]}")
