#!/usr/bin/env python3
import json
import csv
from datetime import datetime
from collections import defaultdict

# Load the raw API response
print("Loading raw API data...")
with open('/home/ec2-user/ml model/data/raw_api_responses/noise_complaints.json', 'r') as f:
    complaints = json.load(f)

print(f"Total complaints fetched: {len(complaints)}")

# Show sample complaint IDs
if complaints:
    print("\nSample complaint IDs:")
    for i, complaint in enumerate(complaints[:5]):
        unique_key = complaint.get('unique_key', 'N/A')
        created_date = complaint.get('created_date', 'N/A')
        complaint_type = complaint.get('complaint_type', 'N/A')
        print(f"  {i+1}. ID: {unique_key} | Date: {created_date} | Type: {complaint_type}")

# Group by hour
hourly_data = defaultdict(lambda: {'count': 0, 'ids': []})

for complaint in complaints:
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

print(f"\nCSV saved to: {csv_path}")
