# Fake Data Directory

⚠️ **SCAFFOLD-ONLY: This entire directory should be DELETED when connecting to real AWS backend.**

## Purpose

This directory contains placeholder JSON data that:
1. Allows the app to run without a backend
2. Matches the exact structure of real API responses
3. Provides multiple scenarios for UI testing
4. Demonstrates the data contracts from the PRD

## Migration Path

When integrating with real APIs:

1. **Deploy AWS backend** (API Gateway + Lambda + DynamoDB)
2. **Update .env**: Set `EXPO_PUBLIC_ENABLE_FAKE_DATA=false`
3. **Uncomment real API calls** in `src/services/api/*.ts`
4. **Test each endpoint** individually
5. **Delete this directory**: `rm -rf src/data/fake/`

## File Structure

Each fake data file corresponds to an API endpoint:

| File | Real API Endpoint | DynamoDB Table | Purpose |
|------|-------------------|----------------|---------|
| `mapZones.json` | `GET /stations` | enviroguard-stations | Station locations for map |
| `forecastData.json` | `POST /predict-noise` | (ML model output) | 24h noise forecast |
| `alertHistory.json` | `GET /alerts` | enviroguard-alerts | User's alert history |
| `reports.json` | `GET /reports` | enviroguard-hazard_reports | Nearby hazard reports |
| `posts.json` | `GET /posts` | enviroguard-posts | Community feed |
| `sensors.json` | `GET /readings/{id}` | enviroguard-sensor_readings | Sensor data for letters |
| `mockUser.ts` | `GET /users/{id}` | enviroguard-users | User profile |

## Data Contract Guidelines

### Rule 1: Match Real API Exactly
Fake data must have the **identical structure** as real API responses.

**Bad:**
```json
{
  "stationName": "Main St",
  "lat": 40.7,
  "lon": -74.0
}
```

**Good:**
```json
{
  "id": "station-001",
  "name": "Main St Station",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "status": "active"
}
```

### Rule 2: Use TypeScript Types
All fake data should conform to types in `src/types/models.ts`.

```typescript
import { Station } from '@/types/models';

export const FAKE_STATIONS: Station[] = [
  // Type checking ensures fake data matches real structure
];
```

### Rule 3: Include Comments
Every fake data file must have a header comment:

```typescript
/**
 * FAKE-DATA: Placeholder stations for map display
 * 
 * REAL API: GET /stations
 * DynamoDB Table: enviroguard-stations
 * 
 * Data Structure:
 * - id: Unique station identifier
 * - name: Display name
 * - location: { latitude, longitude }
 * - status: 'active' | 'inactive' | 'maintenance'
 * 
 * Migration:
 * Replace this file with API call in src/services/api/mapService.ts
 */
```

### Rule 4: Provide Multiple Scenarios
Include edge cases for UI testing:

```json
[
  { "severity": 1, "status": "normal" },
  { "severity": 3, "status": "warning" },
  { "severity": 5, "status": "critical" }
]
```

## Creating New Fake Data

When adding a new feature that needs data:

1. **Create TypeScript type** in `src/types/models.ts`
2. **Create fake data file** in this directory
3. **Add comment header** explaining real source
4. **Export from service** with fake→real toggle

**Example:**

```typescript
// src/data/fake/newFeature.ts

/**
 * FAKE-DATA: Feature X data
 * REAL API: GET /feature-x
 * DynamoDB Table: enviroguard-feature-x
 */

import { FeatureX } from '@/types/models';

export const FAKE_FEATURE_X: FeatureX[] = [
  {
    id: 'fx-001',
    name: 'Test Feature',
    // ... other fields
  },
];
```

```typescript
// src/services/api/featureService.ts

import { ENV } from '@/utils/env';
import { FAKE_FEATURE_X } from '@/data/fake/newFeature';

export async function getFeatureX() {
  // FAKE-DATA START
  if (ENV.enableFakeData) {
    return FAKE_FEATURE_X;
  }
  // FAKE-DATA END
  
  // REAL implementation:
  // const response = await fetch(`${ENV.apiBaseUrl}/feature-x`);
  // return response.json();
}
```

## Common Patterns

### Time-Series Data
```json
[
  { "timestamp": "2026-05-14T00:00:00Z", "value": 65 },
  { "timestamp": "2026-05-14T01:00:00Z", "value": 68 },
  // ... 24 hours
]
```

### Location Data
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY 10001"
}
```

### Status Enums
```typescript
type Status = 'pending' | 'active' | 'resolved' | 'rejected';
```

### Timestamps
Always use ISO 8601 format:
```json
{
  "createdAt": "2026-05-14T10:30:00Z",
  "updatedAt": "2026-05-14T11:00:00Z"
}
```

## Testing with Fake Data

### Toggle Fake Data Mode
```bash
# In .env
EXPO_PUBLIC_ENABLE_FAKE_DATA=true  # Use fake data
EXPO_PUBLIC_ENABLE_FAKE_DATA=false # Use real API
```

### Verify Data Structure
```typescript
import { FAKE_STATIONS } from '@/data/fake/mapZones';
import { Station } from '@/types/models';

// TypeScript will error if structure doesn't match
const station: Station = FAKE_STATIONS[0];
```

### Simulate Network Delay
```typescript
export async function getFakeData() {
  // Simulate 500ms network latency
  await new Promise(resolve => setTimeout(resolve, 500));
  return FAKE_DATA;
}
```

## Maintenance

### When to Update Fake Data
- Backend API contract changes
- New fields added to TypeScript types
- UI needs different test scenarios

### When to Delete Fake Data
- Backend endpoint is deployed and tested
- `ENABLE_FAKE_DATA=false` works for that feature
- Service layer no longer references fake files

## Remember

🚫 **Never commit real user data** to this directory  
🚫 **Never use fake data in production builds**  
✅ **Always match real API structure exactly**  
✅ **Always add explanatory comments**  
✅ **Always type-check fake data**

---

**Delete this entire directory when backend is ready!**
