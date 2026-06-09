# EnviroGuard - Complete Project Context Document

## Project Overview
EnviroGuard is a React Native + Expo environmental monitoring app that predicts and displays air quality, noise levels, pollen counts, and litter levels for NYC neighborhoods. It uses ML predictions and displays data on maps, charts, and community feeds.

## Tech Stack
- **Frontend**: React Native 0.80.0, Expo SDK 54
- **Navigation**: React Navigation (stack + tab navigators)
- **Maps**: 
  - Web: Leaflet + leaflet.heat plugin
  - Mobile: react-native-maps with Circle overlays
- **Backend**: AWS Lambda functions, DynamoDB
- **APIs**: 
  - Custom API Gateway: `https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod`
  - OpenWeather API for weather forecasts
  - Anthropic Claude API for chat/insights
- **Styling**: Design tokens system in `/src/theme/tokens.ts`

## Project Structure
```
enviroguard/
├── src/
│   ├── screens/
│   │   ├── home/HomeScreen.tsx          - Dashboard with predictions
│   │   ├── health/HealthScreen.tsx      - 24hr forecast charts
│   │   ├── map/MapScreenNew.tsx         - Heatmap visualization
│   │   ├── report/ReportScreenNew.tsx   - Submit environmental reports
│   │   ├── community/CommunityScreenNew.tsx - Social feed
│   │   └── profile/ProfileScreen.tsx    - User settings
│   ├── components/
│   │   ├── MetricCard.tsx               - Displays metric with severity
│   │   ├── Card.tsx                     - Base card component
│   │   ├── Button.tsx                   - Button component
│   │   ├── FloatingLeaves.tsx           - Animated background
│   │   ├── HeatMapWeb.tsx               - Leaflet heatmap for web
│   │   └── AnimatedCard.tsx             - Fade-in card animation
│   ├── services/
│   │   ├── forecastService.ts           - ML predictions API
│   │   ├── weatherService.ts            - OpenWeather integration
│   │   ├── postsService.ts              - Community posts API
│   │   └── apiClient.ts                 - Base API wrapper
│   ├── theme/tokens.ts                  - Design system colors/spacing
│   └── navigation/AppNavigator.tsx      - Navigation setup
├── App.tsx                              - Root component
└── package.json
```

## Current Feature Status

### ✅ WORKING FEATURES

#### 1. Home Screen (`/src/screens/home/HomeScreen.tsx`)
- Shows current environmental conditions (noise, AQI, pollen, litter)
- Displays 24-hour peak predictions for all metrics
- Quick action buttons to navigate to other screens
- Recent alerts section
- Daily health tips
- Risk-based hero section (color changes based on conditions)

#### 2. Health Screen (`/src/screens/health/HealthScreen.tsx`)
- 7 metric options: Noise, AQI, Pollen, Litter, Temperature, Humidity, Wind Speed
- 24-hour prediction chart with confidence intervals
- Peak prediction cards for each metric
- Weather forecast integration
- Toggleable chart view

#### 3. Map Screen (`/src/screens/map/MapScreenNew.tsx`)
- Web: Leaflet heatmap with color-coded zones
- Mobile: react-native-maps with Circle overlays for heatmap
- User location marker (blue dot)
- Neighborhood badges with composite scores
- Click-to-center functionality
- Real API data from `/map-data` endpoint

#### 4. Community Screen (`/src/screens/community/CommunityScreenNew.tsx`)
- Social feed with posts from DynamoDB
- Like/share functionality
- Comment counts
- User avatars and timestamps
- Real posts from `/posts` API endpoint

#### 5. Report Screen (`/src/screens/report/ReportScreenNew.tsx`)
- Submit environmental reports (noise, air quality, litter, pollen)
- Photo upload capability
- Location capture
- Description text input
- Saves to DynamoDB via `/submit-report` endpoint

#### 6. Profile Screen (`/src/screens/profile/ProfileScreen.tsx`)
- User info display
- Settings toggles
- Notification preferences
- Account management

### 🔴 CURRENT ISSUES

#### Issue 1: Theme Not Applying Consistently
**Problem**: Color changes in `/src/theme/tokens.ts` not showing in browser despite server restarts
**Root Cause**: Aggressive browser caching + Metro bundler cache
**Files Affected**: All screens
**What Was Changed**: 
- Changed `Colors.primary` from `#06B68D` (bright teal) to `#0F6E56` (deep teal)
- Updated all color tokens to professional civic tech palette
- Removed tropical theme references

**What Should Happen**: Deep teal (#0F6E56) should be used throughout app

#### Issue 2: Styling Inconsistencies
**Problem**: Cards, buttons, and components don't have unified professional styling
**Files Affected**:
- `/src/components/Card.tsx` - Updated to clean shadows
- `/src/components/MetricCard.tsx` - Needs consistent borders
- `/src/screens/home/HomeScreen.tsx` - Action cards need proper styling

**Desired Outcome**: 
- Clean, minimal shadows (not colored)
- 1-2px borders with `Colors.border`
- Border radius: 12px standard, 8px for small elements
- Professional civic tech aesthetic (NOT playful/tropical)

#### Issue 3: FloatingLeaves Animation
**Problem**: Animated leaves component exists but may not match professional theme
**File**: `/src/components/FloatingLeaves.tsx`
**Current State**: 3 falling animated circles
**Question**: Should this be removed for professional civic tech look?

## API Endpoints

### Backend (AWS Lambda + API Gateway)
Base URL: `https://xxxxxxx.execute-api.us-east-1.amazonaws.com/prod`

#### Forecast Endpoints
- `GET /forecast/noise/{neighborhood}` - 24hr noise predictions
- `GET /forecast/aqi/{neighborhood}` - 24hr AQI predictions
- `GET /forecast/pollen/{neighborhood}` - 24hr pollen predictions
- `GET /forecast/litter/{neighborhood}` - 24hr litter predictions
- `GET /forecast/all/{neighborhood}?model={ml|statistical}` - All predictions

#### Map Endpoint
- `GET /map-data` - Returns array of neighborhoods with composite scores:
```json
[
  {
    "neighborhood_id": "williamsburg",
    "neighborhood_name": "Williamsburg",
    "lat": 40.7081,
    "lng": -73.9571,
    "composite_score": 45.2,
    "noise": 65,
    "aqi": 78,
    "pollen": 42,
    "litter": 38
  }
]
```

#### Community Endpoints
- `GET /posts?limit=50` - Get recent community posts
- `POST /posts` - Create new post
- `POST /posts/{id}/like` - Like a post
- `POST /posts/{id}/share` - Share a post

#### Report Endpoint
- `POST /submit-report` - Submit environmental report
```json
{
  "type": "noise|air_quality|litter|pollen",
  "location": {"lat": 40.7, "lng": -73.9},
  "description": "string",
  "severity": 1-5,
  "photo_url": "string (optional)"
}
```

#### Weather Endpoint
- `GET /weather?lat={lat}&lon={lon}` - OpenWeather proxy
```json
{
  "current": {...},
  "forecast": [
    {
      "timestamp": "2026-06-04T12:00:00Z",
      "temp": 72.5,
      "humidity": 65,
      "wind_speed": 8.2,
      "description": "Partly cloudy"
    }
  ]
}
```

## Design System (tokens.ts)

### Color Palette (CURRENT - Updated but not showing in UI)
```typescript
Colors = {
  // Primary - Professional deep teal
  primary: '#0F6E56',
  primaryMid: '#148466',
  primaryLight: '#E8F4F1',
  primaryDark: '#0A4D3D',

  // Semantic
  danger: '#D32F2F',      // High severity
  warning: '#F57C00',     // Moderate severity
  safe: '#388E3C',        // Low severity
  info: '#1976D2',

  // Neutrals
  text: '#1A1A1A',
  textSecondary: '#616161',
  border: '#E0E0E0',
  background: '#F5F5F5',
  surface: '#FFFFFF'
}
```

### Spacing
- Base unit: 8px
- `Spacing.unit(n)` = n * 8px
- Screen padding: 16px
- Card padding: 16-20px
- Section gap: 24px

### Typography
- Title: 20px, weight 600
- Subtitle: 16px, weight 500
- Body: 14px, weight 400
- Caption: 12px, weight 400

## Key Data Types

```typescript
// Forecast data structure
interface HourlyPrediction {
  hour: string;          // "14:00"
  value: number;         // 65
  lower: number;         // Confidence interval
  upper: number;         // Confidence interval
}

interface ForecastData {
  noise: HourlyPrediction[];
  aqi: HourlyPrediction[];
  pollen: HourlyPrediction[];
  litter: HourlyPrediction[];
}

// Map zone structure
interface MapZone {
  neighborhood_id: string;
  neighborhood_name: string;
  lat: number;
  lng: number;
  composite_score: number;  // 0-100
  noise: number;
  aqi: number;
  pollen: number;
  litter: number;
}

// Community post structure
interface Post {
  post_id: string;
  user_id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: number;
  location?: string;
  tags?: string[];
}
```

## Environment Variables (.env)
```
EXPO_PUBLIC_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-xxxxx
EXPO_PUBLIC_USE_FAKE_DATA=false
EXPO_PUBLIC_KIOSK_MODE=false
EXPO_PUBLIC_DEBUG_MODE=true
```

## Development Commands

```bash
# Start development server
npm start

# Clear caches and restart
npm start -- -c
# OR
rm -rf .expo node_modules/.cache .metro-cache && npm start

# Kill all Expo processes
pkill -f expo

# Build for web
npx expo export:web

# Install dependencies
npm install --legacy-peer-deps
```

## Known Working Features - Do NOT Break These

1. **ML Predictions**: All 4 environmental metrics have real ML predictions from backend
2. **Weather Integration**: Temperature, humidity, wind speed using OpenWeather API
3. **Map Heatmap**: Works on both web (Leaflet) and mobile (react-native-maps)
4. **Community Feed**: Real posts from DynamoDB with like/share functionality
5. **Report Submission**: Photo upload + location capture works
6. **Navigation**: Tab + stack navigation fully functional

## What User Wants NOW

### Primary Goal: Apply Professional Civic Tech Design System

**Requirements from user's design spec:**
1. Deep teal color scheme (#0F6E56) - NO bright tropical colors
2. Clean, minimal shadows (black, not colored)
3. Thin borders (1-2px) on all cards/buttons
4. Professional, data-forward aesthetic
5. Remove any "tropical" or playful language
6. Make sure all prediction data shows on home screen (already done, just not showing visually with new theme)

**What's Already Been Done But Not Showing:**
- `tokens.ts` updated with new colors
- `HomeScreen.tsx` has all prediction data
- `Card.tsx` updated with clean styling
- Server restarted multiple times

**Problem**: Browser caching is preventing visual updates from showing

**Nuclear Option Solution Needed:**
1. Force Metro bundler to completely rebuild
2. Add cache-busting mechanism
3. Verify theme is actually being imported correctly
4. Maybe add a version number to force re-import

## File Priority List

### CRITICAL - Fix immediately:
1. `/src/theme/tokens.ts` - Design system
2. `/src/screens/home/HomeScreen.tsx` - Main screen
3. `/src/components/Card.tsx` - Base component
4. `/src/components/MetricCard.tsx` - Data display

### HIGH - Update styling:
5. `/src/screens/health/HealthScreen.tsx`
6. `/src/screens/map/MapScreenNew.tsx`
7. `/src/components/Button.tsx`

### MEDIUM - Polish:
8. `/src/screens/community/CommunityScreenNew.tsx`
9. `/src/screens/report/ReportScreenNew.tsx`
10. `/src/screens/profile/ProfileScreen.tsx`

## Recent Changes Log

1. **Color system update** - Changed from bright teal (#06B68D) to deep teal (#0F6E56)
2. **HomeScreen restoration** - Brought back all prediction data that was accidentally removed
3. **Card styling** - Updated shadows from colored to black, reduced intensity
4. **MetricCard update** - Added proper borders and background
5. **Cache clearing** - Multiple attempts to force Metro to rebuild

## Next Steps

1. **Verify theme is loading**: Add console.log in tokens.ts to verify it's being imported
2. **Force re-import**: Change a value in tokens.ts and change it back to trigger rebuild
3. **Check browser**: Use incognito mode to bypass all cache
4. **Nuclear restart**: 
   ```bash
   pkill -f expo
   rm -rf .expo node_modules/.cache .metro-cache
   watchman watch-del-all
   npm start -- --reset-cache
   ```
5. **Apply civic tech design** to ALL remaining screens systematically

## Contact Info for APIs

- Backend deployed to AWS Lambda in `us-east-1`
- DynamoDB tables: `enviroguard-posts`, `enviroguard-reports`
- All Lambda functions use Node.js 18.x runtime
- API Gateway has CORS enabled for web access

---

**Last Updated**: 2026-06-04 23:16 EST
**Current Issues**: Theme not applying visually despite code changes
**Blocker**: Browser/Metro cache preventing updates from showing
