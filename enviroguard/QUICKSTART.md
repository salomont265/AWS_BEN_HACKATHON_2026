# EnviroGuard - Quick Start Guide

## 🚀 Running the App Right Now

### Step 1: Start the Development Server

```bash
cd enviroguard
npm start
```

This will open Expo DevTools in your browser.

### Step 2: Choose a Platform

You have 3 options:

**Option A: iOS Simulator (Mac only)**
```bash
# Press 'i' in the terminal, or click "Run on iOS simulator" in browser
npm run ios
```

**Option B: Android Emulator**
```bash
# Press 'a' in the terminal, or click "Run on Android emulator" in browser
npm run android
```

**Option C: Web Browser (Easiest!)**
```bash
# Press 'w' in the terminal, or click "Run in web browser"
npm run web
```

**Option D: Your Phone**
1. Install "Expo Go" app from App Store or Play Store
2. Scan the QR code shown in terminal/browser
3. App will load on your phone

### Step 3: Explore the App

Once running, you'll see:
- **5 tabs at the bottom**: Map, Health, Report, Community, Profile
- **Placeholder UI** showing what each tab will contain
- **Sample data** demonstrating the design

## 📱 What You'll See

### Tab 1: Map
- Placeholder for map view
- Info about upcoming features (heatmap, layers, zones)

### Tab 2: Health
- Forecast timeline placeholder
- AI risk briefing placeholder
- Alert history placeholder

### Tab 3: Report
- Sample hazard reports
- Floating action button (+) for new reports
- Info about Claude Vision AI integration

### Tab 4: Community
- Letter generator card (Claude AI feature)
- Sample community post
- Sample event
- Info about upcoming features

### Tab 5: Profile
- User avatar and info
- Health conditions (sample)
- Alert thresholds (sample)
- Saved location (sample)

## 🎨 Current State

**What Works:**
✅ Navigation between all 5 tabs
✅ Tab bar at bottom
✅ Placeholder UI showing app structure
✅ Design system (colors, spacing, typography)
✅ All screens render without errors

**What's Placeholder:**
⚠️ All data is hardcoded/fake
⚠️ Buttons don't do anything yet
⚠️ No camera integration yet
⚠️ No Claude AI integration yet (needs API key)
⚠️ No map view yet (needs Mapbox token)

## 🔧 Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org/

### "Metro bundler failed to start"
```bash
# Clear cache and restart
npm start --reset-cache
```

### "Invariant Violation" or navigation errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

### "iOS build failed"
```bash
# Clean iOS build
cd ios && pod install && cd ..
npm run ios
```

### Can't see tabs on web
The web version might have some layout issues. Try iOS/Android simulator or physical device for best experience.

## 📸 Screenshots

*Note: Since this is a scaffold, UI is intentionally basic. Each tab shows placeholder content indicating what will be built.*

## ⏭️ Next Steps

This is a **functional scaffold**. To continue development:

1. **Read README.md** - Full documentation
2. **Read SCAFFOLD_NOTES.md** - Implementation details
3. **Check STATUS.md** - See what's complete and what's next
4. **Start with Phase 3** - Build shared components
5. **Then Phase 4** - Add fake data files
6. **Then Phase 5-9** - Build out each tab's real functionality

## 💡 Development Tips

### Hot Reload
Changes to files auto-reload in the app. Just save and see updates!

### Debugging
- Shake device/press Cmd+D (iOS) or Cmd+M (Android) for dev menu
- Enable "Remote JS Debugging" to use Chrome DevTools
- Check terminal for errors and warnings

### Modifying Screens
Screen files are in `src/screens/`:
- `src/screens/map/MapScreen.tsx`
- `src/screens/health/HealthScreen.tsx`
- `src/screens/report/ReportScreen.tsx`
- `src/screens/community/CommunityScreen.tsx`
- `src/screens/profile/ProfileScreen.tsx`

Edit any of these to change what you see in the app!

### Design System
Colors, spacing, and typography are in:
- `src/theme/tokens.ts`
- `src/theme/utils.ts`

Change colors there to theme the entire app.

## 🎉 Success!

If you can see all 5 tabs and navigate between them, **the scaffold is working!**

This is the foundation. Now you can build features on top of this structure.

---

**Questions?** Check README.md or SCAFFOLD_NOTES.md
