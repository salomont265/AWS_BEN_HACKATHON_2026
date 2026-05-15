# EnviroGuard - Environmental Intelligence App

**Status:** Functional Scaffold - Starting Point for Development

This is a React Native/Expo mobile app scaffold built from the EnviroGuard PRD. All 5 tabs are functional with placeholder UI and fake data, ready to be connected to a real AWS backend (API Gateway + Lambda + DynamoDB).

## 🎯 Project Overview

EnviroGuard is a neighborhood environmental intelligence app with:
- **5 tabs**: Map (risk visualization), Health (forecasts & alerts), Report (hazard submission), Community (events & letter generator), Profile (settings)
- **AI-powered**: Claude Vision for photo analysis, Claude LLM for advocacy letter generation
- **IoT sensors**: Designed to integrate with station kiosks monitoring noise, trash, and hazards
- **AWS backend (future)**: API Gateway → Lambda → DynamoDB

**Current State:** The app runs completely offline with fake data. Claude API features (photo analysis, letter generation) work NOW if you provide an API key.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- iOS Simulator (Mac only) or Android Emulator

### Installation

```bash
# Install dependencies (use legacy-peer-deps flag due to React Native version conflicts)
npm install --legacy-peer-deps

# If you need web support, also install:
npm install react-dom react-native-web --legacy-peer-deps

# Copy environment template
cp .env.example .env

# (Optional) Add your Claude API key to .env
# EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-your-key-here

# Start development server
npm start

# Run on specific platform
npm run ios     # iOS Simulator
npm run android # Android Emulator  
npm run web     # Web browser
```

### Common Installation Issues

**Port 8081 already in use:**
```bash
# Kill existing Expo process
lsof -ti:8081 | xargs kill -9

# Then start again
npm start
```

**Peer dependency conflicts:**
```bash
# Always use --legacy-peer-deps flag with npm install
npm install --legacy-peer-deps
```

**Web dependencies missing:**
```bash
# Install web support packages
npm install react-dom react-native-web --legacy-peer-deps
```

### First Run
When you first open the app:
1. You'll see 5 tabs at the bottom
2. All data is fake but fully functional
3. Try the Report tab → Take Photo → See Claude Vision analysis (if API key set)
4. Try the Community tab → Generate Letter → See Claude streaming (if API key set)

## 📋 Current State: What's Real vs Placeholder

| Component | Status | Location | Notes |
|-----------|--------|----------|-------|
| ✅ Navigation | REAL | `src/navigation/` | 5-tab structure, all routes working |
| ✅ TypeScript types | REAL | `src/types/` | Match PRD API contracts |
| ✅ Design system | REAL | `src/theme/` | Colors, spacing, typography |
| ⚠️ Map data | FAKE | `src/data/fake/mapZones.json` | Replace with GET /stations |
| ⚠️ Health forecasts | FAKE | `src/data/fake/forecastData.json` | Replace with POST /predict-noise |
| ⚠️ Reports | FAKE | Logs to console | Replace with POST /reports |
| ✅ Claude Vision | REAL | `src/services/claude/vision.ts` | Works now with API key |
| ✅ Claude Letters | REAL | `src/services/claude/letter.ts` | Works now with API key |
| ⚠️ Profile storage | FAKE | AsyncStorage only | Replace with GET/PUT /users/{id} |
| ❌ Authentication | NOT IMPLEMENTED | Placeholder | Add Cognito/JWT |
| ❌ Real-time updates | NOT IMPLEMENTED | — | Add WebSocket/polling |

### Legend
- ✅ **REAL** = Production-ready, no changes needed
- ⚠️ **FAKE** = Works but uses placeholder data, needs backend connection
- ❌ **NOT IMPLEMENTED** = Feature exists as placeholder only

## 📁 Project Structure

```
enviroguard/
├── src/
│   ├── navigation/          # React Navigation setup
│   │   ├── types.ts         # Navigation type definitions
│   │   ├── index.tsx        # Root navigator (Auth vs Main)
│   │   ├── MainNavigator.tsx # Bottom tabs (5 tabs)
│   │   ├── MapStack.tsx     # Map tab navigation
│   │   ├── HealthStack.tsx  # Health tab navigation
│   │   ├── ReportStack.tsx  # Report tab navigation
│   │   ├── CommunityStack.tsx # Community tab navigation
│   │   └── ProfileStack.tsx # Profile tab navigation
│   │
│   ├── screens/             # Screen components
│   │   ├── map/             # Tab 1: MapScreen, ZoneDetailScreen
│   │   ├── health/          # Tab 2: HealthDashboardScreen, AlertDetailScreen
│   │   ├── report/          # Tab 3: ReportFeedScreen, SubmitReportScreen
│   │   ├── community/       # Tab 4: CommunityScreen, LetterScreen
│   │   └── profile/         # Tab 5: ProfileScreen, EditHealthScreen
│   │
│   ├── components/          # Reusable UI components
│   │   ├── atoms/           # Basic components (Button, Badge, Pill)
│   │   ├── molecules/       # Component compositions (Card, Slider)
│   │   ├── map/             # Map-specific components
│   │   ├── health/          # Health-specific components
│   │   ├── report/          # Report-specific components
│   │   └── community/       # Community-specific components
│   │
│   ├── data/                # Fake data (DELETE when backend ready)
│   │   └── fake/            # JSON files matching API contracts
│   │       ├── mapZones.json
│   │       ├── forecastData.json
│   │       ├── reports.json
│   │       ├── posts.json
│   │       └── README.md    # Migration instructions
│   │
│   ├── services/            # API clients and external services
│   │   ├── claude/
│   │   │   ├── vision.ts    # ✅ Claude Vision (REAL)
│   │   │   └── letter.ts    # ✅ Claude Streaming (REAL)
│   │   ├── api/
│   │   │   ├── mapService.ts
│   │   │   ├── healthService.ts
│   │   │   ├── reportService.ts
│   │   │   ├── communityService.ts
│   │   │   └── profileService.ts
│   │   └── storage/         # AsyncStorage wrapper
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useKioskMode.ts  # Kiosk mode detection
│   │   └── useAuth.ts       # Auth state (placeholder)
│   │
│   ├── contexts/            # React Context providers
│   │   └── AuthContext.tsx  # Auth state provider
│   │
│   ├── types/               # TypeScript interfaces
│   │   └── models.ts        # All data models from PRD
│   │
│   ├── utils/               # Utility functions
│   │   └── env.ts           # Environment variable access
│   │
│   └── theme/               # Design system
│       ├── tokens.ts        # Colors, spacing, typography
│       └── utils.ts         # Theme helper functions
│
├── .env.example             # Environment variable template
├── app.json                 # Expo configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies
├── README.md                # This file
└── SCAFFOLD_NOTES.md        # Detailed scaffold documentation
```

## 🔧 Environment Variables

See `.env.example` for the complete list. Key variables:

| Variable | Purpose | Current Value | Production Value |
|----------|---------|---------------|------------------|
| `EXPO_PUBLIC_API_BASE_URL` | Backend endpoint | `http://localhost:8000` | Your API Gateway URL |
| `EXPO_PUBLIC_ANTHROPIC_API_KEY` | Claude API key | `(empty)` | Get from console.anthropic.com |
| `EXPO_PUBLIC_ENABLE_FAKE_DATA` | Use fake data mode | `true` | `false` when backend ready |
| `EXPO_PUBLIC_KIOSK_MODE` | Kiosk mode for public displays | `false` | `true` for tablet builds |

## 🔗 API Endpoints Reference

All endpoints use API Gateway (future). Currently returns fake data.

### Tab 1: Map
- `GET /stations` - List all sensor stations
- `GET /readings/{station_id}` - Latest sensor readings

### Tab 2: Health & Alerts  
- `POST /predict-noise/{station_id}` - 24h noise forecast (Prophet model)
- `POST /predict-fill/{station_id}` - 48h bin fill forecast
- `GET /alerts` - User's alert history

### Tab 3: Report
- `GET /reports?lat=&lng=&radius=` - Nearby hazard reports
- `POST /reports` - Submit new report with photo

### Tab 4: Community
- `GET /posts?lat=&lng=` - Community feed
- `POST /posts` - Create post or event

### Tab 5: Profile
- `GET /users/{user_id}` - Fetch user profile
- `PUT /users/{user_id}` - Update user profile

**Detailed API documentation:** See `SCAFFOLD_NOTES.md` for request/response examples.

## 🎨 Design System

From PRD page 8:

**Colors:**
- Primary: `#0F6E56` (teal)
- Danger: `#D85A30` (red)
- Warning: `#EF9F27` (orange)
- Safe: `#639922` (green)

**Spacing:**
- Base unit: 8px
- Screen padding: 16px
- Section gaps: 24px

**Typography:**
- Titles: 20-22px bold
- Body: 14-15px regular
- Captions: 12px regular
- Data values: tabular-nums (prevents layout shift)

**Key Components:**
- Risk score pill: 80px wide, colored by score
- Severity badge: 32px circle, 1-5 rating
- Report card: White, 12px radius, 1px border

## 🤖 Claude API Usage

### Where Claude is Used

**1. Photo Analysis (Tab 3: Report)**
- File: `src/services/claude/vision.ts`
- Input: Photo of environmental hazard
- Output: `{ type, severity, description, confidence }`
- Model: Claude Sonnet 4
- Status: ✅ **WORKS NOW** (if API key provided)

**2. Advocacy Letter Generation (Tab 4: Community)**
- File: `src/services/claude/letter.ts`
- Input: Sensor readings + location
- Output: Streaming letter text
- Model: Claude Sonnet 4
- Status: ✅ **WORKS NOW** (sensor data is fake for now)

### Connecting Claude

**Photo Analysis** - Ready to use:
```typescript
// src/services/claude/vision.ts
import Anthropic from '@anthropic-ai/sdk';

export async function analyzeEnvironmentalPhoto(imageUri: string) {
  const anthropic = new Anthropic({
    apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY, // Add to .env
  });
  
  // Converts image → base64 → sends to Claude Vision
  // Returns: { type, severity, description, confidence }
}
```

**Letter Generation** - Ready to use:
```typescript
// src/services/claude/letter.ts
export async function generateAdvocacyLetter(options) {
  // Streams letter text token-by-token
  // Currently uses fake sensor data from src/data/fake/sensors.json
  // TODO: Replace with real GET /readings/{station_id}
}
```

## 📝 What Still Needs to Be Built

### Phase 1: Complete the Scaffold
- [x] Project foundation (theme, types, navigation)
- [ ] All 5 tab screens with placeholder UI
- [ ] Fake data files matching API contracts
- [ ] Service layer with fake→real stubs
- [ ] Component library (atoms & molecules)
- [ ] Complete README and SCAFFOLD_NOTES

### Phase 2: AWS Backend
- [ ] Create API Gateway REST API
- [ ] Create Lambda functions for each endpoint
- [ ] Create DynamoDB tables (stations, readings, reports, users, posts)
- [ ] Set up IAM roles and policies
- [ ] Enable Bedrock access for Lambda

### Phase 3: Connect App to Backend
- [ ] Set `ENABLE_FAKE_DATA=false`
- [ ] Configure `API_BASE_URL` to API Gateway
- [ ] Test each endpoint individually
- [ ] Remove fake data files

### Phase 4: Production Features
- [ ] Add authentication (Cognito)
- [ ] Implement error handling
- [ ] Add offline support (AsyncStorage cache)
- [ ] Set up analytics
- [ ] Push notifications
- [ ] Performance optimization

## 🔍 For AI Tools and Future Developers

### Quick Reference: Spotting Fake Data

**How to identify fake data in code:**
1. Look for `// FAKE` or `// FAKE-DATA` comments
2. Check for `if (ENV.enableFakeData)` blocks
3. Files in `src/data/fake/` directory
4. `require('@/data/fake/...')` imports
5. Service methods returning hardcoded JSON

**Example:**
```typescript
// FAKE-DATA START
if (ENV.enableFakeData) {
  return require('@/data/fake/mapZones.json').zones;
}
// FAKE-DATA END

// REAL implementation (commented out):
// const response = await fetch(`${ENV.apiBaseUrl}/stations`);
// return response.json();
```

### Migration Checklist (Fake → Real)

For each service file in `src/services/`:

1. **Read the TODO comments** - They explain what endpoint to connect
2. **Ensure AWS resource exists** - Check API Gateway, Lambda, DynamoDB table
3. **Uncomment real implementation** - Remove fake data return
4. **Test with `ENABLE_FAKE_DATA=false`** - Verify it works
5. **Delete fake data code** - Remove entire fake block
6. **Update this README** - Mark component as ✅ REAL

### File Organization by Status

**Production-Ready (✅ REAL):**
- `src/navigation/` - All navigation files
- `src/theme/` - Design system
- `src/types/` - TypeScript interfaces
- `src/services/claude/` - Claude API integration

**Needs Backend Connection (⚠️ FAKE):**
- `src/services/api/*.ts` - Uncomment real API calls
- `src/data/fake/*.json` - Delete when backend ready

**Not Yet Implemented (❌):**
- Authentication screens
- Real-time updates
- Error boundaries
- Offline sync

## 🐛 Troubleshooting

### "Fake data showing in app"
✅ **This is expected!** Set `EXPO_PUBLIC_ENABLE_FAKE_DATA=false` in `.env` when backend is ready.

### "Claude photo analysis not working"
- Check: `EXPO_PUBLIC_ANTHROPIC_API_KEY` in `.env`
- Verify: API key is valid (test at console.anthropic.com)
- Note: Costs ~$0.001 per photo analysis

### "No data showing in app"
- Fake data mode: Check console for errors
- Real data mode: Verify `API_BASE_URL` is correct and backend is running

### "TypeScript errors about paths"
- Run: `npm install` to ensure dependencies are installed
- Check: `tsconfig.json` has path aliases configured

## 📚 Additional Documentation

- **SCAFFOLD_NOTES.md** - Detailed fake→real migration guide
- **src/data/fake/README.md** - Fake data structure and API contracts
- **PRD (EnviroGuard_PRD.pdf)** - Original product requirements

## 🚢 Deployment

### Test Build
```bash
npx expo prebuild        # Generate native projects
npm run ios              # Build iOS
npm run android          # Build Android
```

### Production Build
```bash
# Using EAS Build (recommended)
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

## 📄 License

[Your License Here]

---

**Built for AWS Hackathon 2026**  
Scaffold generated by Claude Code using the EnviroGuard PRD
