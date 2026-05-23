# EnviroGuard Frontend API Integration

Complete implementation of the EnviroGuard v2 Frontend API Integration PRD.

## Architecture Overview

```
Screens → Services → API Gateway / Anthropic API
              ↓
        Fake Data (when USE_FAKE_DATA=true)
```

### Key Principles

1. **Screens never call `fetch()` directly** - All API calls go through service functions
2. **Single source of truth** - All fetches use `src/utils/api.ts` helpers
3. **Fake data mode** - Toggle `USE_FAKE_DATA` to work without backend
4. **Type safety** - All services export TypeScript interfaces

## File Structure

```
src/
├── constants/
│   └── env.ts              # Environment variable exports
├── utils/
│   └── api.ts              # Base API helpers (apiGet, apiPost, apiPut)
├── services/               # One file per domain
│   ├── mapService.ts       # Map data & risk scores
│   ├── forecastService.ts  # 24h predictions (4 parallel calls)
│   ├── postsService.ts     # Social feed, reports, agreements
│   ├── petitionsService.ts # Create, sign, submit petitions
│   ├── usersService.ts     # User profile, auth, notifications
│   ├── messagesService.ts  # Threads, messages, polling
│   ├── photoService.ts     # Photo picker & S3 upload
│   ├── claudeService.ts    # Direct Anthropic API calls
│   └── index.ts            # Barrel export
├── context/
│   └── AuthContext.tsx     # User state provider
└── data/fake/              # Fake data for development
    ├── fakeMapData.ts
    ├── fakeForecastData.ts
    ├── fakePosts.ts
    ├── fakeUser.ts
    └── fakeThreads.ts
```

## Services

### 1. Base Layer - `api.ts`

All API calls use these three functions:

```typescript
import { apiGet, apiPost, apiPut } from '../utils/api';

// Automatically adds base URL and JWT token
const data = await apiGet<ResponseType>('/endpoint', { param: 'value' });
const result = await apiPost<ResponseType>('/endpoint', { body: 'data' });
const updated = await apiPut<ResponseType>('/endpoint', { updates: 'here' });
```

**Never call `fetch()` directly in screens.**

### 2. Map Service - `mapService.ts`

Used by: MapScreen (on mount + every 15 min), bottom sheet Claude summary.

```typescript
import { fetchMapData, fetchRiskScore } from '../services/mapService';

// Primary map call - ALWAYS use this, never call /posts directly
const zones = await fetchMapData(lat, lng, mode); // mode: 'api' | 'community'

// Risk score for bottom sheet
const score = await fetchRiskScore(neighborhoodId, mode);
```

**Important**: `mode='api'` calls external APIs (AirNow, OpenWeather, Ambee, 311) via Lambda. `mode='community'` aggregates posts table. Same endpoint, Lambda handles the difference.

### 3. Forecast Service - `forecastService.ts`

Used by: ForecastScreen (on mount + mode change).

```typescript
import { fetchAllForecasts } from '../services/forecastService';

// Fires 4 prediction endpoints in parallel - do NOT await sequentially
const forecast = await fetchAllForecasts(neighborhoodId, mode);
// Returns: { noise[], aqi[], litter[], pollen[] }
```

### 4. Posts Service - `postsService.ts`

Used by: SocialFeedScreen, MapScreen (markers), SubmitReportScreen, PostDetailScreen, MyReportsScreen.

```typescript
import { 
  fetchFeed, 
  fetchMapReports, 
  fetchPost, 
  createPost,
  agreePost 
} from '../services/postsService';

// Social feed with pagination
const { posts, lastKey } = await fetchFeed(neighborhood, category, sort, lastKey);

// Create a new report
const post = await createPost({
  user_id, category, description, photo_url, 
  severity, lat, lng, neighborhood_id
});

// Agree with a post
const { agreement_count, user_has_agreed, petition_ready } = await agreePost(postId, userId);
```

### 5. Petitions Service - `petitionsService.ts`

Used by: PostDetailScreen (create), PetitionScreen (view, sign, submit).

```typescript
import { 
  createPetition, 
  fetchPetition, 
  signPetition, 
  submitPetition 
} from '../services/petitionsService';

// Start a petition from a post
const petition = await createPetition({ post_id, neighborhood, category, official });

// Sign a petition
const { signature_count, meetup_thread_created } = await signPetition(petitionId, userId);

// Submit to government
const { status, submitted_at, sent_to } = await submitPetition(petitionId, userId);
```

### 6. Users Service - `usersService.ts`

Used by: AuthContext (on launch), ProfileScreen (load + save), OnboardingScreen.

```typescript
import { 
  fetchProfile, 
  createUser, 
  updateProfile, 
  savePushToken 
} from '../services/usersService';

// Load user profile
const profile = await fetchProfile(userId);

// Create new user (signup)
const { user_id, token } = await createUser(email, password);
// Token and user_id automatically saved to SecureStore

// Update profile (partial updates)
await updateProfile(userId, { health: { asthma: true } });
```

### 7. Messages Service - `messagesService.ts`

Used by: ThreadListScreen, ThreadDetailScreen.

```typescript
import { 
  fetchThreads, 
  fetchMessages, 
  sendMessage, 
  startMessagePolling 
} from '../services/messagesService';

// Get all threads
const threads = await fetchThreads(userId);

// Get messages (with optional since timestamp for polling)
const messages = await fetchMessages(threadId, since);

// Send a message
const message = await sendMessage(threadId, senderId, content);

// Start polling for new messages
const cleanup = startMessagePolling(threadId, lastTimestamp, (newMsgs) => {
  setMessages(prev => [...prev, ...newMsgs]);
});
```

### 8. Photo Service - `photoService.ts`

Used by: SubmitReportScreen.

```typescript
import { pickPhoto, uploadToS3 } from '../services/photoService';

// Step 1: Pick photo
const photo = await pickPhoto(); // { uri, base64 }

// Step 2: Create post (photo_url: null initially)
const post = await createPost({ ...data, photo_url: null });

// Step 3: Upload to S3 via presigned URL
await uploadToS3(post.presigned_url, photo.uri);

// Lambda already stored final S3 URL and Claude Vision result on post
```

### 9. Claude Service - `claudeService.ts`

**Direct Anthropic API calls** - do NOT go through API Gateway.

Used by: MapScreen (zone summary), ForecastScreen (briefing), SubmitReportScreen (photo analysis), PetitionScreen (drafting).

```typescript
import { 
  getZoneSummary, 
  getForecastBriefing, 
  analyzePhoto, 
  draftPetition 
} from '../services/claudeService';

// 1. Map zone summary (non-streaming)
const summary = await getZoneSummary({
  name, noise_index, aqi, health_category, pollen_index, litter_count, mode
});

// 2. Forecast briefing (streaming)
await getForecastBriefing(forecast, health, mode, (token) => {
  setText(prev => prev + token);
});

// 3. Photo analysis (non-streaming, returns JSON)
const analysis = await analyzePhoto(base64Image);
// { type, severity, description, health_impact, agency, action }

// 4. Petition drafting (streaming)
await draftPetition(petition, (token) => {
  setPetitionText(prev => prev + token);
});
```

### 10. Auth Context - `AuthContext.tsx`

Wraps entire app. Loads user profile on launch. Provides `userId` and `profile` to all screens.

```typescript
import { useAuth } from '../context/AuthContext';

function MyScreen() {
  const { userId, profile, isAuthenticated, logout, refreshProfile } = useAuth();
  
  // Pass userId to service calls
  const feed = await fetchFeed(profile.neighborhoods[0].id);
}
```

**Screens never read userId from SecureStore directly** - always use `useAuth()`.

## Environment Variables

Required in `.env`:

```bash
# API Gateway URL
EXPO_PUBLIC_API_GATEWAY_URL=https://abc123.execute-api.us-east-1.amazonaws.com/v1

# Claude API key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...

# Fake data mode
EXPO_PUBLIC_USE_FAKE_DATA=true  # false when backend is ready
```

## Fake Data Mode

When `USE_FAKE_DATA=true`:
- All service functions return local JSON data
- No API calls are made
- Allows full app development without backend
- Switch is one line per service function

## Usage Examples

### MapScreen with polling

```typescript
useEffect(() => {
  fetchMapData(location.lat, location.lng, mode).then(setMapData);
  
  const poll = setInterval(() =>
    fetchMapData(location.lat, location.lng, mode).then(setMapData),
    15 * 60 * 1000  // 15 minutes
  );
  
  return () => clearInterval(poll);
}, [mode]);

// Bottom sheet on zone tap
fetchRiskScore(zone.neighborhood_id, mode).then(setRiskScore);
```

### ForecastScreen

```typescript
useEffect(() => {
  setLoading(true);
  fetchAllForecasts(selectedNeighborhood, mode)
    .then(setForecast)
    .finally(() => setLoading(false));
}, [selectedNeighborhood, mode]);
```

### ThreadDetailScreen with polling

```typescript
useEffect(() => {
  const lastTs = messages[messages.length - 1]?.timestamp;
  if (!lastTs) return;
  
  return startMessagePolling(threadId, lastTs, (newMsgs) => {
    setMessages(prev => [...prev, ...newMsgs]);
  });
}, [messages.length]);
```

## Type Safety

All services export TypeScript interfaces. Import and use them:

```typescript
import { MapZone, RiskScore } from '../services/mapService';
import { Post, FeedResponse } from '../services/postsService';
import { UserProfile } from '../services/usersService';

const [zones, setZones] = useState<MapZone[]>([]);
const [posts, setPosts] = useState<Post[]>([]);
const [profile, setProfile] = useState<UserProfile | null>(null);
```

## Error Handling

API helpers throw errors on non-OK responses:

```typescript
try {
  const data = await fetchMapData(lat, lng, mode);
  setMapData(data);
} catch (error) {
  console.error('Failed to fetch map data:', error);
  Alert.alert('Error', 'Could not load map data');
}
```

## Testing

All services support fake data mode:

1. Set `EXPO_PUBLIC_USE_FAKE_DATA=true` in `.env`
2. Run app - all service calls return local data
3. Test UI without backend
4. Flip to `false` when backend is ready

## Next Steps

1. **Wire up screens** - Replace placeholder data fetches with service calls
2. **Add loading states** - Show spinners during API calls
3. **Implement error handling** - Show user-friendly error messages
4. **Test fake data mode** - Verify all screens work without backend
5. **Connect real backend** - Set `USE_FAKE_DATA=false` and update `API_GATEWAY_URL`

## Notes

- All JWT handling is automatic via `SecureStore` and `api.ts` helpers
- Push tokens are registered on app launch via `AuthContext`
- Map polling is every 15 minutes - configurable per screen
- Message polling is every 10 seconds - configurable per thread
- Claude API calls bypass API Gateway - they hit Anthropic directly
- Photo uploads go directly to S3 via presigned URLs
