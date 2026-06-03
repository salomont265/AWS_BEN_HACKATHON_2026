# EnviroGuard Frontend - Complete Guide

Beautiful, modern React Native app for environmental health monitoring in NYC.

## 🎨 Features

### Screens
- **🏠 Home Dashboard** - Overview of current environmental conditions with quick actions
- **🗺️ Map** - Interactive environmental risk zones with layer toggles
- **📊 Health & Alerts** - 24-hour forecasts with detailed visualizations
- **📝 Reports** - Submit and view community environmental reports
- **👤 Profile** - Manage health conditions, alert thresholds, and preferences

### UI Components
- **MetricCard** - Environmental metrics with severity indicators
- **Card** - Reusable card container with elevation options
- **Button** - Multi-variant button (primary, secondary, danger, outline)
- **Enhanced Charts** - Interactive bar charts for forecast data
- **Risk Indicators** - Color-coded severity badges

### Design System
- **Color Palette** - Teal primary (#0F6E56) with semantic colors
- **Typography** - System fonts with 4 size scales
- **Spacing** - 8px base unit for consistent rhythm
- **Accessibility** - 44px minimum touch targets

## 🚀 Quick Start

### Prerequisites
```bash
node --version  # 18+ required
npm --version   # 8+ required
```

### Installation

1. **Install dependencies**
```bash
cd enviroguard
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Start development server**
```bash
npm start
```

4. **Run on device**
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Project Structure

```
enviroguard/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── MetricCard.tsx
│   │   └── index.ts
│   │
│   ├── screens/              # Screen components
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── health/
│   │   │   └── HealthScreen.tsx
│   │   ├── map/
│   │   │   └── MapScreen.tsx
│   │   ├── report/
│   │   │   └── ReportScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   ├── community/
│   │   │   └── CommunityScreen.tsx
│   │   └── WelcomeScreen.tsx
│   │
│   ├── navigation/           # Navigation setup
│   │   ├── MainNavigator.tsx
│   │   └── types.ts
│   │
│   ├── services/             # API clients
│   │   ├── forecastService.ts
│   │   ├── mapService.ts
│   │   ├── postsService.ts
│   │   └── usersService.ts
│   │
│   ├── theme/                # Design system
│   │   ├── tokens.ts         # Colors, spacing, typography
│   │   └── utils.ts
│   │
│   └── types/
│       └── models.ts         # TypeScript types
│
├── assets/                   # Images, fonts
├── App.tsx                   # Entry point
└── package.json
```

## 🎨 Design Tokens

### Colors
```typescript
primary: '#0F6E56'      // Teal - CTAs, active states
primaryMid: '#1D9E75'   // Secondary actions
primaryLight: '#E1F5EE' // Backgrounds

danger: '#D85A30'       // High risk alerts
warning: '#EF9F27'      // Medium risk
safe: '#639922'         // Low risk

textPrimary: '#2C2C2A'  // Body text
textSecondary: '#888780' // Metadata
border: '#D3D1C7'       // Borders
background: '#F1EFE8'   // App background
surface: '#FFFFFF'      // Card surfaces
```

### Typography
```typescript
title: { fontSize: 20, fontWeight: '600' }     // Screen titles
subtitle: { fontSize: 16, fontWeight: '500' }  // Section headings
body: { fontSize: 14, fontWeight: '400' }      // Body text
caption: { fontSize: 12, fontWeight: '400' }   // Metadata
```

### Spacing
```typescript
Spacing.unit(1)  // 8px
Spacing.unit(2)  // 16px
Spacing.unit(3)  // 24px
Spacing.screenPadding  // 16px horizontal padding
```

## 🧩 Component Usage

### Button
```tsx
import { Button } from '@/components';

<Button
  title="Get Started"
  onPress={() => {}}
  variant="primary"      // primary | secondary | danger | outline
  size="large"           // small | medium | large
  icon="🚀"
  fullWidth
  loading={false}
  disabled={false}
/>
```

### MetricCard
```tsx
import { MetricCard } from '@/components';

<MetricCard
  icon="🔊"
  title="Noise Level"
  value={85}
  unit="dB"
  severity="high"        // low | moderate | high | very_high
  trend="up"             // up | down | stable
  subtitle="Peak at 6 PM"
/>
```

### Card
```tsx
import { Card } from '@/components';

<Card elevated noBorder padding={24}>
  <Text>Content here</Text>
</Card>
```

## 🔌 API Integration

### Forecast Service
```tsx
import { fetchAllForecasts } from '@/services/forecastService';

const forecast = await fetchAllForecasts('williamsburg', 'api');
// Returns: { noise, aqi, pollen, litter, mode, confidence }
```

### Map Service
```tsx
import { fetchMapData } from '@/services/mapService';

const zones = await fetchMapData(40.7081, -73.9571, 'api');
// Returns: Array of MapZone objects
```

### User Service
```tsx
import { fetchProfile } from '@/services/usersService';

const profile = await fetchProfile('user_001');
// Returns: UserProfile with health, thresholds, neighborhoods
```

## 📱 Screen Details

### Home Dashboard
- Current conditions with MetricCards
- Quick action buttons
- Recent alerts feed
- Daily health tip

### Health & Alerts
- Peak predictions summary
- Metric selector (Noise, AQI, Pollen, Litter)
- 24-hour interactive chart
- Health recommendations

### Map
- Environmental risk zones
- API/Community mode toggle
- Zone cards with metrics
- MapBox placeholder (ready for integration)

### Reports
- User's submitted reports
- Floating action button for new reports
- Report cards with severity indicators
- Agreement counts

### Profile
- User info with avatar
- Health conditions chips
- Alert thresholds
- Saved neighborhoods
- Notification preferences

## 🛠️ Development

### Adding a New Screen

1. **Create screen file**
```bash
touch src/screens/myscreen/MyScreen.tsx
```

2. **Import design tokens**
```tsx
import { Colors, Typography, Spacing } from '@/theme/tokens';
```

3. **Add to navigation**
```tsx
// src/navigation/MainNavigator.tsx
<Tab.Screen name="MyTab" component={MyScreen} />
```

### Creating a Component

1. **Create component file**
```bash
touch src/components/MyComponent.tsx
```

2. **Export from index**
```tsx
// src/components/index.ts
export { default as MyComponent } from './MyComponent';
```

3. **Use with path alias**
```tsx
import { MyComponent } from '@/components';
```

## 🎯 Performance Tips

- Use `React.memo()` for expensive components
- Implement `FlatList` for long lists
- Optimize images with proper dimensions
- Use `useCallback` for event handlers
- Lazy load heavy screens

## 🐛 Troubleshooting

### Metro bundler cache issues
```bash
npm start -- --reset-cache
```

### iOS build issues
```bash
cd ios && pod install && cd ..
npm run ios
```

### Android build issues
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

### TypeScript errors
```bash
npx tsc --noEmit
```

## 📦 Building for Production

### iOS
```bash
cd ios
xcodebuild -workspace EnviroGuard.xcworkspace \
  -scheme EnviroGuard \
  -configuration Release \
  -archivePath build/EnviroGuard.xcarchive \
  archive
```

### Android
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Web
```bash
npm run web
npm run build  # If build script is configured
```

## 🌐 Environment Variables

```bash
# .env
USE_FAKE_DATA=true              # Use fake data (true) or real backend (false)
API_BASE_URL=https://api.enviroguard.com
ANTHROPIC_API_KEY=your_key      # For Claude features
DEBUG=false
```

## 📚 Resources

- **React Native Docs**: https://reactnavigation.org/
- **Expo Docs**: https://docs.expo.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Design System**: See `src/theme/tokens.ts`

## 🎨 Design Philosophy

1. **Mobile-First** - Optimized for touch interactions
2. **Accessible** - WCAG AA compliant colors and touch targets
3. **Consistent** - Unified design language via tokens
4. **Performant** - Optimized rendering and data loading
5. **User-Focused** - Health-driven features and alerts

## 🚢 Deployment

### TestFlight (iOS)
1. Archive build in Xcode
2. Upload to App Store Connect
3. Add testers in TestFlight

### Google Play (Android)
1. Generate signed AAB
2. Upload to Play Console
3. Create internal testing release

### Expo (Web)
```bash
expo build:web
# Deploy to Netlify/Vercel
```

## 📄 License

MIT License - See LICENSE file for details

---

**Status**: Frontend Complete ✅  
**Last Updated**: 2026-06-02  
**Maintained By**: AWS BEN Hackathon Team
