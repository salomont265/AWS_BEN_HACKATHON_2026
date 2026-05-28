# API Services - Quick Reference

One-page cheat sheet for all EnviroGuard API services.

## Setup

```typescript
// 1. Wrap app with AuthProvider
import { AuthProvider } from './src/context/AuthContext';

// 2. Use auth in screens
import { useAuth } from '../context/AuthContext';
const { userId, profile } = useAuth();
```

## Map

```typescript
import { fetchMapData, fetchRiskScore } from '../services/mapService';

// Get all zones
const zones = await fetchMapData(lat, lng, 'api'); // or 'community'

// Get risk score
const score = await fetchRiskScore('williamsburg', 'api');
```

## Forecast

```typescript
import { fetchAllForecasts } from '../services/forecastService';

// Get 24h predictions (4 parallel calls)
const forecast = await fetchAllForecasts('williamsburg', 'api');
// Returns: { noise[], aqi[], litter[], pollen[] }
```

## Posts

```typescript
import { 
  fetchFeed, 
  createPost, 
  agreePost 
} from '../services/postsService';

// Get feed
const { posts, lastKey } = await fetchFeed('williamsburg', 'noise', 'recent');

// Create post
const post = await createPost({
  user_id, category, description, photo_url: null,
  severity, lat, lng, neighborhood_id
});

// Agree
const { agreement_count, petition_ready } = await agreePost(postId, userId);
```

## Petitions

```typescript
import { 
  createPetition, 
  signPetition, 
  submitPetition 
} from '../services/petitionsService';

// Create
const petition = await createPetition({ 
  post_id, neighborhood, category, official 
});

// Sign
const { signature_count, meetup_thread_created } = 
  await signPetition(petitionId, userId);

// Submit
const { status, sent_to } = await submitPetition(petitionId, userId);
```

## Users

```typescript
import { 
  fetchProfile, 
  updateProfile 
} from '../services/usersService';

// Get profile
const profile = await fetchProfile(userId);

// Update (partial)
await updateProfile(userId, { 
  health: { asthma: true } 
});
```

## Messages

```typescript
import { 
  fetchThreads, 
  fetchMessages, 
  sendMessage,
  startMessagePolling
} from '../services/messagesService';

// Get threads
const threads = await fetchThreads(userId);

// Get messages
const messages = await fetchMessages(threadId);

// Send
const msg = await sendMessage(threadId, userId, 'Hello!');

// Poll for new messages
const cleanup = startMessagePolling(threadId, lastTimestamp, (newMsgs) => {
  setMessages(prev => [...prev, ...newMsgs]);
});
// Call cleanup() to stop polling
```

## Photos

```typescript
import { pickPhoto, uploadToS3 } from '../services/photoService';

// Pick photo
const photo = await pickPhoto(); // { uri, base64 }

// Create post with photo
const post = await createPost({ ...data, photo_url: null });

// Upload to S3
await uploadToS3(post.presigned_url, photo.uri);
```

## Claude (Direct Anthropic API)

```typescript
import { 
  getZoneSummary, 
  getForecastBriefing, 
  analyzePhoto, 
  draftPetition 
} from '../services/claudeService';

// Zone summary (non-streaming)
const summary = await getZoneSummary({
  name, noise_index, aqi, health_category, 
  pollen_index, litter_count, mode
});

// Forecast briefing (streaming)
await getForecastBriefing(forecast, health, mode, (token) => {
  setText(prev => prev + token);
});

// Photo analysis (non-streaming, returns JSON)
const { type, severity, description, health_impact, agency, action } = 
  await analyzePhoto(base64Image);

// Petition draft (streaming)
await draftPetition(petition, (token) => {
  setPetitionText(prev => prev + token);
});
```

## Common Patterns

### Polling

```typescript
useEffect(() => {
  fetchData().then(setData);
  
  const poll = setInterval(() => {
    fetchData().then(setData);
  }, 15 * 60 * 1000); // 15 min
  
  return () => clearInterval(poll);
}, [dependency]);
```

### Loading State

```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData()
    .then(setData)
    .finally(() => setLoading(false));
}, []);
```

### Error Handling

```typescript
try {
  const data = await fetchData();
  setData(data);
} catch (error) {
  console.error('Error:', error);
  Alert.alert('Error', 'Failed to load data');
}
```

### Streaming Text

```typescript
const [text, setText] = useState('');

await streamingFunction(data, (token) => {
  setText(prev => prev + token);
});
```

## Environment Variables

```bash
# .env
EXPO_PUBLIC_API_GATEWAY_URL=https://YOUR_API.amazonaws.com/v1
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-YOUR_KEY
EXPO_PUBLIC_USE_FAKE_DATA=true  # false for real backend
```

## Imports

```typescript
// Auth
import { useAuth } from '../context/AuthContext';

// Services (individual)
import { fetchMapData } from '../services/mapService';
import { fetchFeed } from '../services/postsService';

// Services (all)
import { 
  fetchMapData, 
  fetchFeed, 
  fetchProfile 
} from '../services';
```

## Types

```typescript
import { MapZone, RiskScore } from '../services/mapService';
import { Post, FeedResponse } from '../services/postsService';
import { UserProfile } from '../services/usersService';
import { Thread, Message } from '../services/messagesService';
import { Petition } from '../services/petitionsService';
import { ForecastData } from '../services/forecastService';
```

---

**Full docs**: See `API_INTEGRATION.md`
