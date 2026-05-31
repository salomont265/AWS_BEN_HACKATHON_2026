# Frontend Implementation Plan - EnviroGuard

**Purpose:** Complete guide for implementing all frontend screens with API integration  
**Date:** 2026-05-31  
**API Base URL:** `https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2`

---

## Table of Contents
1. [Authentication Flow](#authentication-flow)
2. [Map Screen](#map-screen)
3. [Health Screen](#health-screen)
4. [Report Screen](#report-screen)
5. [Community Screen](#community-screen)
6. [Profile Screen](#profile-screen)
7. [API Reference](#api-reference)
8. [Database Tables](#database-tables)

---

## Authentication Flow

### Login/Register Screen

**Location:** `src/screens/auth/LoginScreen.tsx` (create if doesn't exist)

**UI Components:**
- Email input field
- Password input field
- "Sign Up" button
- "Login" button (if user exists)
- Error message display area

**Flow:**

1. **New User Registration:**
   ```typescript
   // When user clicks "Sign Up"
   POST /users
   Body: {
     email: "user@example.com",
     password: "password123"
   }
   
   // Response:
   {
     user_id: "u_abc123",
     email: "user@example.com",
     token: "eyJhbGc..."
   }
   
   // Save token to SecureStore
   await SecureStore.setItemAsync('jwt_token', response.token);
   await SecureStore.setItemAsync('user_id', response.user_id);
   
   // Navigate to main app
   ```

2. **Existing User Login:**
   ```typescript
   // Login endpoint doesn't exist yet - use registration for now
   // If email exists, will return 409 error
   // TODO: Add POST /login endpoint to users-fn
   ```

**Database Impact:**
- **Table:** `users`
- **Operation:** Creates new user record with default health profile, thresholds, and notification preferences

---

## Map Screen

**Location:** `src/screens/MapScreen.tsx` (already exists)

### UI Components Needed:

1. **Map View** (MapView from react-native-maps)
   - Center on user location
   - Display neighborhood boundaries
   - Show color-coded regions based on composite scores

2. **Floating Action Buttons:**
   - "My Location" button (bottom right)
   - "Toggle ML/API Mode" button (top right)

3. **Bottom Sheet Panel (appears when tapping map):**
   - Neighborhood name
   - Composite score (0-100)
   - Severity indicator (Low/Medium/High)
   - Layer breakdown cards:
     - Air Quality (AQI, PM2.5, O3)
     - Noise Level (predicted dB or community reports)
     - Pollen Index (grass, tree, weed counts)
     - Litter Reports (count, avg severity)
   - "View Posts" button → navigates to Community tab filtered by this neighborhood
   - "Report Issue" button → navigates to Report tab with location pre-filled

### API Calls:

**1. Load Map Data for Visible Region**
```typescript
GET /map-data?lat={lat}&lng={lng}&mode={api|community}

// Request triggered: On map load, on map move (debounced)
// Parameters:
// - lat, lng: center of visible map region
// - mode: "api" for real-time data, "community" for user reports

// Response:
{
  neighborhood_id: "40.713_-74.006",
  name: "Downtown",
  lat: 40.7128,
  lng: -74.006,
  composite_score: 45,
  severity: "medium",
  mode: "api",
  confidence: "high",
  last_updated: "2026-05-31T12:00:00Z",
  layers: {
    noise: { index: 0, complaint_count_24h: 0 },
    air: { aqi: 31, pm25: 3.08, health_category: "Good" },
    litter: { complaint_count_24h: 0, avg_severity: 3 },
    pollen: { grass: 0, tree: 0, weed: 0, total_index: 0 },
    general: { report_count_24h: 0 }
  }
}

// Color-code map regions:
// composite_score 0-30: green (#22c55e)
// composite_score 31-60: yellow (#eab308)
// composite_score 61-100: red (#ef4444)
```

**2. Get Real-Time Environmental Data**
```typescript
GET /air-quality?lat={lat}&lng={lng}
GET /pollen?lat={lat}&lng={lng}
GET /weather?lat={lat}&lng={lng}

// Use to populate bottom sheet details
```

**3. Get ML Predictions (when in ML mode)**
```typescript
GET /predict-noise/{neighborhood}?mode=ml
GET /predict-aqi/{neighborhood}?mode=ml
GET /predict-litter/{neighborhood}?mode=ml
GET /predict-pollen/{neighborhood}?mode=ml

// Returns 24h predictions
// Display as line charts in bottom sheet
```

### Database Impact:
- **No writes** - Map screen is read-only
- **Reads from:** `posts` table (via map-data aggregation)

### User Flow:
1. User opens app → Map screen loads with user location
2. Map fetches data for visible neighborhoods
3. User taps a region → Bottom sheet slides up with details
4. User can:
   - Switch between "API Mode" (real sensors) and "Community Mode" (user reports)
   - View 24h predictions
   - Navigate to report an issue
   - See related community posts

---

## Health Screen

**Location:** `src/screens/HealthScreen.tsx`

### UI Components Needed:

1. **Health Profile Section:**
   - "Edit Health Profile" button at top
   - Display current conditions:
     - Asthma (Yes/No toggle)
     - COPD (Yes/No toggle)
     - Pollen Allergy (Yes/No toggle)
     - Noise Sensitivity (Yes/No toggle)
     - Age Group (dropdown: child/adult/senior)

2. **Alert Thresholds Section:**
   - "Edit Thresholds" button
   - Display current thresholds:
     - AQI threshold (slider 0-500)
     - Noise dB threshold (slider 0-120)
     - Pollen index threshold (slider 0-1000)

3. **Notification Preferences Section:**
   - Toggle switches:
     - Noise alerts (ON/OFF)
     - Air quality alerts (ON/OFF)
     - Litter alerts (ON/OFF)
     - Pollen alerts (ON/OFF)
     - General alerts (ON/OFF)
   - Quiet Hours selector:
     - Start time picker
     - End time picker

4. **Personalized Risk Score Card:**
   - Large number (0-100)
   - Color-coded severity
   - Breakdown of risk factors
   - "Why this score?" info button

### API Calls:

**1. Get User Profile**
```typescript
GET /users/{user_id}
Headers: { Authorization: "Bearer {token}" }

// Response:
{
  user_id: "u_abc123",
  email: "user@example.com",
  health: {
    asthma: false,
    copd: false,
    pollen_allergy: false,
    noise_sensitivity: false,
    age_group: "adult"
  },
  thresholds: {
    aqi: 100,
    noise_db: 75,
    pollen_index: 200
  },
  neighborhoods: ["downtown", "midtown"],
  notification_prefs: {
    noise: true,
    air: true,
    litter: false,
    pollen: true,
    general: true,
    quiet_hours: { start: "22:00", end: "07:00" }
  },
  created_at: "2026-05-01T10:00:00Z"
}
```

**2. Update User Profile**
```typescript
PUT /users/{user_id}
Headers: { Authorization: "Bearer {token}" }
Body: {
  health: {
    asthma: true,
    copd: false,
    pollen_allergy: true,
    noise_sensitivity: false,
    age_group: "adult"
  },
  thresholds: {
    aqi: 75,
    noise_db: 80,
    pollen_index: 150
  },
  notification_prefs: {
    noise: true,
    air: true,
    litter: false,
    pollen: true,
    general: true,
    quiet_hours: { start: "23:00", end: "08:00" }
  }
}

// Response:
{
  user_id: "u_abc123",
  updated: true
}
```

**3. Get Personalized Risk Score**
```typescript
GET /risk-score/{neighborhood}?user_id={user_id}&mode={api|ml}
Headers: { Authorization: "Bearer {token}" }

// Response:
{
  neighborhood: "downtown",
  composite_score: 45,
  user_risk_score: 62,  // Adjusted for user's health profile
  risk_factors: [
    { category: "air", base_index: 45, adjusted: 70, reason: "Asthma increases sensitivity to poor air quality" },
    { category: "pollen", base_index: 30, adjusted: 55, reason: "Pollen allergy detected" }
  ],
  recommendations: [
    "Consider limiting outdoor activity between 2pm-5pm",
    "Carry rescue inhaler due to moderate AQI"
  ],
  alerts: [
    { type: "air", message: "AQI approaching your threshold of 75", severity: "warning" }
  ]
}
```

### Database Impact:
- **Table:** `users`
- **Operations:**
  - Read user profile on screen load
  - Update user profile when user saves changes
- **No new records created** - only updates existing user

### User Flow:
1. Screen loads → Fetch user profile from `/users/{user_id}`
2. Display current health settings
3. User taps "Edit Health Profile" → Show edit modal
4. User changes settings → PUT to `/users/{user_id}`
5. Screen refreshes with updated data
6. Risk score updates based on new health profile

---

## Report Screen

**Location:** `src/screens/ReportScreen.tsx`

### UI Components Needed:

1. **Issue Type Selector:**
   - Radio buttons or segmented control:
     - Noise 🔊
     - Air Quality 🌫️
     - Litter 🗑️
     - Pollen 🌿
     - General 📋

2. **Location Section:**
   - "Use Current Location" button (default)
   - "Choose on Map" button
   - Display selected address/coordinates

3. **Details Section:**
   - Description text area (multi-line)
   - Severity slider (1-5):
     - 1: Minimal
     - 2: Minor
     - 3: Moderate
     - 4: Serious
     - 5: Severe

4. **Photo Upload:**
   - "Add Photo" button
   - Image preview if photo selected
   - "Remove Photo" button

5. **AI Analysis (if photo uploaded):**
   - Loading spinner while Claude Vision analyzes
   - Display AI suggestions:
     - Detected category
     - Suggested severity
     - AI-generated description
   - "Use AI Suggestions" button

6. **Submit Button:**
   - Large primary button "Submit Report"
   - Shows loading state while submitting

### API Calls:

**1. Create Post**
```typescript
POST /posts
Headers: { Authorization: "Bearer {token}" }
Body: {
  user_id: "u_abc123",
  category: "noise",  // noise|air|litter|pollen|general
  lat: 40.7128,
  lng: -74.006,
  neighborhood_id: "downtown",
  description: "Loud construction noise at night",
  severity: 4,
  photo_url: "https://s3.amazonaws.com/photos/abc123.jpg"  // Optional
}

// Response:
{
  post_id: "p_xyz789",
  user_id: "u_abc123",
  category: "noise",
  description: "Loud construction noise at night",
  photo_url: "https://...",
  severity: 4,
  lat: 40.7128,
  lng: -74.006,
  neighborhood_id: "downtown",
  agreement_count: 0,
  petition_ready: false,
  created_at: "2026-05-31T14:30:00Z",
  claude_vision: {  // Only if photo uploaded
    confirmed_category: "noise",
    severity: 4,
    description: "Construction equipment operating during evening hours"
  }
}
```

**2. Upload Photo (if using S3)**
```typescript
// TODO: Add S3 pre-signed URL endpoint or use expo-image-picker
// For now, can use base64 or public image URLs for testing
```

**3. Get User's Location**
```typescript
// Use expo-location
import * as Location from 'expo-location';

const location = await Location.getCurrentPositionAsync({});
const { latitude, longitude } = location.coords;

// Reverse geocode to get neighborhood
const address = await Location.reverseGeocodeAsync({
  latitude,
  longitude
});
```

### Database Impact:
- **Table:** `posts`
- **Operation:** Creates new post record
- **Fields populated:**
  - post_id (auto-generated: `p_` + random)
  - user_id (from JWT)
  - category (user selected)
  - description (user entered)
  - photo_url (if uploaded)
  - severity (user selected)
  - lat, lng (from location)
  - neighborhood_id (computed from lat/lng)
  - agreement_count (starts at 0)
  - petition_ready (starts at false)
  - created_at (auto timestamp)
  - claude_vision (optional, if photo uploaded)

### User Flow:
1. User taps "Report" tab
2. Select issue type (noise/air/litter/pollen/general)
3. Location auto-fills with current location (or user chooses on map)
4. User enters description
5. User sets severity (1-5)
6. (Optional) User adds photo:
   - Photo uploads
   - Claude Vision analyzes image
   - Suggests category, severity, description
   - User can accept or override
7. User taps "Submit Report"
8. POST to `/posts` creates the post
9. Success message: "Report submitted! Thank you for keeping our community informed."
10. Navigate to Community tab to show the new post

---

## Community Screen

**Location:** `src/screens/CommunityScreen.tsx`

### UI Components Needed:

1. **Top Tab Navigator:**
   - "Feed" tab (default)
   - "My Reports" tab
   - "Petitions" tab

2. **Feed Tab:**
   - Filter bar:
     - Neighborhood selector (dropdown)
     - Category filter chips (All, Noise, Air, Litter, Pollen, General)
     - Sort options: Recent | Most Agreed
   - Post list (FlatList):
     - Each post card shows:
       - User avatar (generic icon)
       - Category icon + badge
       - Description (truncated to 2 lines)
       - Photo thumbnail (if present)
       - Location/neighborhood
       - Timestamp (relative: "2h ago")
       - Agreement count + "I Agree" button
       - Severity indicator (colored bar)
       - "View Details" button
   - Pull to refresh

3. **My Reports Tab:**
   - List of user's own posts
   - Same card layout as Feed
   - Empty state: "You haven't reported anything yet"

4. **Petitions Tab:**
   - List of active petitions
   - Each petition card shows:
     - Original post info
     - Signature count / threshold (e.g., "23 / 25 signatures")
     - Progress bar
     - "Sign Petition" button
     - Status badge (Gathering Signatures | Ready | Submitted)
   - Filter: Active | Completed

5. **Post Detail Screen:**
   - Full post information
   - Large photo (if present)
   - Full description
   - AI analysis (if present)
   - Location on mini-map
   - Agreement section:
     - "I Agree" button (large, primary)
     - List of agreers (user count)
     - "You agreed" indicator if user already agreed
   - Petition section (if agreement_count >= 10):
     - "Create Petition" button
     - Shows threshold reached message
   - Comments section (future feature)

### API Calls:

**1. Get Posts Feed**
```typescript
GET /posts?neighborhood={neighborhood}&category={category}&sort={recent|agreements}&limit=20
Headers: { Authorization: "Bearer {token}" }

// Response:
{
  posts: [
    {
      post_id: "p_xyz789",
      user_id: "u_abc123",
      category: "noise",
      description: "Loud construction...",
      photo_url: "https://...",
      severity: 4,
      lat: 40.7128,
      lng: -74.006,
      neighborhood_id: "downtown",
      agreement_count: 7,
      petition_ready: false,
      created_at: "2026-05-31T14:30:00Z",
      claude_vision: { ... }
    },
    ...
  ],
  lastKey: "base64encodedkey",  // For pagination
  total_returned: 20
}

// For next page:
GET /posts?neighborhood={neighborhood}&lastKey={lastKey}
```

**2. Get User's Own Posts**
```typescript
GET /posts?user_id={user_id}&limit=20
Headers: { Authorization: "Bearer {token}" }

// Same response format as above
```

**3. Get Single Post Details**
```typescript
GET /posts/{post_id}
Headers: { Authorization: "Bearer {token}" }

// Response:
{
  post_id: "p_xyz789",
  user_id: "u_abc123",
  category: "noise",
  description: "Loud construction...",
  photo_url: "https://...",
  severity: 4,
  lat: 40.7128,
  lng: -74.006,
  neighborhood_id: "downtown",
  agreement_count: 7,
  petition_ready: false,
  created_at: "2026-05-31T14:30:00Z",
  agreers: ["u_abc123", "u_def456", ...],  // List of user IDs who agreed
  claude_vision: { ... }
}
```

**4. Agree with Post**
```typescript
POST /agree/{post_id}
Headers: { Authorization: "Bearer {token}" }
Body: {
  user_id: "u_abc123"
}

// Response:
{
  post_id: "p_xyz789",
  agreement_count: 8,
  user_has_agreed: true,
  petition_ready: false  // or true if count >= 10
}

// If petition_ready becomes true:
// Show toast: "This issue now has enough support to create a petition!"
```

**5. Check if User Has Agreed**
```typescript
GET /agree/{post_id}?userId={user_id}

// Response:
{
  post_id: "p_xyz789",
  agreement_count: 8,
  user_has_agreed: true,
  petition_ready: false
}
```

**6. Get Petitions List**
```typescript
GET /petitions?status={active|completed}
Headers: { Authorization: "Bearer {token}" }

// Note: This endpoint doesn't exist yet in petitions-fn
// TODO: Add GET /petitions list handler

// Expected response:
{
  petitions: [
    {
      petition_id: "pet_123",
      post_id: "p_xyz789",
      neighborhood: "downtown",
      category: "noise",
      petition_text: "We petition the city...",
      signature_count: 23,
      threshold: 25,
      status: "active",
      official: {
        name: "Jane Doe",
        email: "jane@city.gov",
        role: "Noise Control Commissioner"
      },
      created_at: "2026-05-30T10:00:00Z",
      submitted_at: null,
      meetup_thread_id: null
    },
    ...
  ]
}
```

**7. Create Petition**
```typescript
POST /petitions
Headers: { Authorization: "Bearer {token}" }
Body: {
  post_id: "p_xyz789",
  neighborhood: "downtown",
  category: "noise",
  official: {
    name: "Jane Doe",
    email: "jane@city.gov",
    role: "Noise Control Commissioner"
  }
}

// Response:
{
  petition_id: "pet_123",
  post_id: "p_xyz789",
  neighborhood: "downtown",
  category: "noise",
  petition_text: "We, the undersigned residents...",
  signature_count: 10,  // Inherits agreers from post
  threshold: 25,
  status: "active",
  official: { ... },
  created_at: "2026-05-31T15:00:00Z"
}
```

**8. Sign Petition**
```typescript
POST /petitions/{petition_id}/sign
Headers: { Authorization: "Bearer {token}" }
Body: {
  user_id: "u_abc123"
}

// Response:
{
  petition_id: "pet_123",
  signature_count: 24,
  user_has_signed: true,
  meetup_ready: false  // true if count >= 25
}

// If meetup_ready becomes true:
// - SNS notification sent to all signers
// - Meetup thread auto-created (if messages-fn working)
```

**9. Get Petition Details**
```typescript
GET /petitions/{petition_id}
Headers: { Authorization: "Bearer {token}" }

// Response:
{
  petition_id: "pet_123",
  post_id: "p_xyz789",
  post_details: { ... },  // Full post object
  neighborhood: "downtown",
  category: "noise",
  petition_text: "We, the undersigned...",
  signature_count: 24,
  threshold: 25,
  status: "active",
  official: {
    name: "Jane Doe",
    email: "jane@city.gov",
    role: "Noise Control Commissioner"
  },
  signers: ["u_abc123", "u_def456", ...],
  created_at: "2026-05-30T10:00:00Z",
  submitted_at: null,
  meetup_thread_id: null
}
```

**10. Submit Petition to Official**
```typescript
POST /petitions/{petition_id}/submit
Headers: { Authorization: "Bearer {token}" }
Body: {} // No body needed

// Response:
{
  petition_id: "pet_123",
  status: "submitted",
  submitted_at: "2026-05-31T16:00:00Z",
  email_sent: true  // if SES configured
}

// Backend sends email via SES to official.email
// SNS notification to all signers
```

### Database Impact:

**For Posts:**
- **Table:** `posts`
- **Reads:** Listing, filtering, individual post details

**For Agreements:**
- **Table:** `agreement` (singular!)
- **Write:** When user clicks "I Agree"
  - Creates record: `{ post_id, user_id, agreed_at }`
  - Updates `posts.agreement_count` (atomic increment)
  - Updates `posts.petition_ready` if count >= 10

**For Petitions:**
- **Table:** `petitions`
- **Write:** When user creates petition
  - Creates record with all petition details
  - Copies agreers from `agreement` table to `signatures` table

**For Signatures:**
- **Table:** `signatures`
- **Write:** When user signs petition
  - Creates record: `{ petition_id, user_id, signed_at }`
  - Updates `petitions.signature_count` (atomic increment)
  - If count >= 25: triggers SNS notification + creates meetup thread

### User Flow:

**Flow 1: Browse and Agree**
1. User opens Community tab → Feed
2. Select neighborhood filter (e.g., "Downtown")
3. Browse posts, swipe to load more
4. User sees post about construction noise
5. Taps "I Agree" button
6. POST to `/agree/{post_id}` → agreement_count increases
7. Button changes to "You Agreed" (disabled)
8. If this was the 10th agreement:
   - Post badge updates: "Petition Ready!"
   - SNS sends notification to all agreers

**Flow 2: Create Petition**
1. User sees post with "Petition Ready" badge
2. Taps post → Opens detail screen
3. "Create Petition" button visible (agreement_count >= 10)
4. User taps button → Shows petition creation modal
5. Modal pre-fills:
   - Issue description (from post)
   - Suggested official (based on category + neighborhood lookup)
6. User can edit petition text or keep auto-generated
7. User taps "Create Petition"
8. POST to `/petitions` → Creates petition
9. Success message: "Petition created! You need 25 signatures to submit."
10. Navigate to Petitions tab to show new petition

**Flow 3: Sign Petition**
1. User browses Petitions tab
2. Sees petition with 23/25 signatures
3. Taps "Sign Petition" button
4. POST to `/petitions/{id}/sign` → signature_count increases
5. If this was the 25th signature:
   - Backend sends SNS notification to all signers
   - Backend creates meetup thread (if messages-fn working)
   - Petition status updates to "Ready to Submit"

**Flow 4: Submit Petition**
1. Petition organizer (creator) sees "Submit to Official" button (unlocked at 25 sigs)
2. User taps button → Confirmation dialog
3. Dialog shows:
   - Official name, role, email
   - Final petition text
   - Signature count
   - "Are you sure? This cannot be undone."
4. User confirms
5. POST to `/petitions/{id}/submit` → Backend sends email via SES
6. Success message: "Petition submitted to Jane Doe!"
7. Petition status changes to "Submitted"
8. All signers get SNS notification

---

## Profile Screen

**Location:** `src/screens/ProfileScreen.tsx`

### UI Components Needed:

1. **User Info Section:**
   - Email display
   - Account creation date
   - "Edit Email" button (future feature)

2. **My Neighborhoods Section:**
   - List of followed neighborhoods
   - "+ Add Neighborhood" button
   - Each neighborhood shows:
     - Name
     - Current composite score
     - "Remove" button

3. **Statistics Section:**
   - Total posts created
   - Total agreements received on your posts
   - Total petitions you've signed
   - Total petitions created

4. **Settings Section:**
   - "Health Profile" → Links to Health screen
   - "Notification Settings" → Links to Health screen
   - "Privacy Policy" → External link
   - "Terms of Service" → External link

5. **Logout Button:**
   - At bottom
   - Clears SecureStore and returns to login

### API Calls:

**1. Get User Profile**
```typescript
GET /users/{user_id}
Headers: { Authorization: "Bearer {token}" }

// Same response as Health screen
```

**2. Update Neighborhoods**
```typescript
PUT /users/{user_id}
Headers: { Authorization: "Bearer {token}" }
Body: {
  neighborhoods: ["downtown", "midtown", "uptown"]
}

// Response:
{
  user_id: "u_abc123",
  updated: true
}
```

**3. Get User Statistics**
```typescript
// These endpoints don't exist yet
// TODO: Add to posts-fn and petitions-fn

GET /posts?user_id={user_id}
// Count total_returned for posts created

GET /posts?user_id={user_id}
// Sum agreement_count for agreements received

GET /petitions?signer={user_id}
// Count petitions signed

GET /petitions?creator={user_id}
// Count petitions created
```

### Database Impact:
- **Table:** `users`
- **Operations:**
  - Read profile on load
  - Update neighborhoods list

### User Flow:
1. User opens Profile tab
2. Screen loads user info from `/users/{user_id}`
3. Display email, stats, neighborhoods
4. User can:
   - Add/remove neighborhoods (updates via PUT)
   - Navigate to Health settings
   - Logout (clears tokens, returns to login)

---

## API Reference

### Base URL
```
https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2
```

### Authentication
All authenticated endpoints require:
```
Headers: {
  "Authorization": "Bearer {jwt_token}",
  "Content-Type": "application/json"
}
```

### Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/users` | POST | No | Create user account |
| `/users/{id}` | GET | Yes | Get user profile |
| `/users/{id}` | PUT | Yes | Update user profile |
| `/posts` | POST | Yes | Create post |
| `/posts` | GET | Yes | List posts (with filters) |
| `/posts/{id}` | GET | Yes | Get post details |
| `/agree/{post_id}` | POST | Yes | Agree with post |
| `/agree/{post_id}` | GET | No | Check agreement status |
| `/petitions` | POST | Yes | Create petition |
| `/petitions/{id}` | GET | Yes | Get petition details |
| `/petitions/{id}/sign` | POST | Yes | Sign petition |
| `/petitions/{id}/submit` | POST | Yes | Submit to official |
| `/map-data` | GET | No | Get neighborhood data |
| `/air-quality` | GET | No | Get air quality |
| `/pollen` | GET | No | Get pollen data |
| `/weather` | GET | No | Get weather |
| `/predict-noise/{nbhd}` | GET | No | ML noise prediction |
| `/predict-aqi/{nbhd}` | GET | No | ML AQI prediction |
| `/predict-litter/{nbhd}` | GET | No | ML litter prediction |
| `/predict-pollen/{nbhd}` | GET | No | ML pollen prediction |
| `/risk-score/{nbhd}` | GET | Yes | Personalized risk |

---

## Database Tables

### 1. users
```javascript
{
  user_id: "u_abc123",              // PK, String
  email: "user@example.com",        // String, unique (GSI: email-index)
  password_hash: "sha256hash",      // String
  health: {
    asthma: false,
    copd: false,
    pollen_allergy: false,
    noise_sensitivity: false,
    age_group: "adult"
  },
  thresholds: {
    aqi: 100,
    noise_db: 75,
    pollen_index: 200
  },
  neighborhoods: ["downtown"],       // List of Strings
  push_token: "ExponentPushToken",   // String (Expo push token)
  notification_prefs: {
    noise: true,
    air: true,
    litter: false,
    pollen: true,
    general: true,
    quiet_hours: { start: "22:00", end: "07:00" }
  },
  created_at: "2026-05-01T10:00:00Z" // String (ISO timestamp)
}
```

### 2. posts
```javascript
{
  post_id: "p_xyz789",               // PK, String
  user_id: "u_abc123",               // String
  category: "noise",                 // String (noise|air|litter|pollen|general)
  description: "Construction noise", // String
  photo_url: "https://...",          // String (optional)
  severity: 4,                       // Number (1-5)
  lat: 40.7128,                      // Number
  lng: -74.006,                      // Number
  neighborhood_id: "downtown",       // String (GSI: neighborhood)
  agreement_count: 7,                // Number
  petition_ready: false,             // Boolean
  created_at: "2026-05-31T14:00:00Z", // String (ISO timestamp)
  claude_vision: {                   // Map (optional)
    confirmed_category: "noise",
    severity: 4,
    description: "AI-detected: Construction equipment"
  }
}
```

### 3. agreement (singular!)
```javascript
{
  post_id: "p_xyz789",               // PK, String
  user_id: "u_abc123",               // SK, String
  agreed_at: "2026-05-31T14:30:00Z"  // String (ISO timestamp)
}
```

### 4. petitions
```javascript
{
  petition_id: "pet_123",            // PK, String
  post_id: "p_xyz789",               // String
  neighborhood: "downtown",          // String
  category: "noise",                 // String
  petition_text: "We petition...",   // String (auto-generated or custom)
  signature_count: 23,               // Number
  threshold: 25,                     // Number (meetup threshold)
  status: "active",                  // String (active|submitted)
  official: {
    name: "Jane Doe",
    email: "jane@city.gov",
    role: "Noise Control Commissioner"
  },
  created_at: "2026-05-30T10:00:00Z", // String
  submitted_at: null,                // String (optional)
  meetup_thread_id: null             // String (optional, when signatures >= 25)
}
```

### 5. signatures
```javascript
{
  petition_id: "pet_123",            // PK, String
  user_id: "u_abc123",               // SK, String
  signed_at: "2026-05-31T15:00:00Z"  // String (ISO timestamp)
}
```

### 6. threads (BROKEN - needs Eugene)
```javascript
{
  thread_id: "th_abc123",            // PK, String
  petition_id: "pet_123",            // String (optional, for meetup threads)
  neighborhood_id: "downtown",       // String
  title: "Meetup: Construction Noise Petition", // String
  user_ids: ["u_abc123", "u_def456"], // List (BROKEN: index expects String not List)
  created_at: "2026-05-31T16:00:00Z", // String
  last_message_at: "2026-05-31T17:00:00Z" // String
}
```

### 7. messages (BROKEN - needs Eugene)
```javascript
{
  thread_id: "th_abc123",            // PK, String
  message_id: "msg_xyz789",          // SK, String
  user_id: "u_abc123",               // String
  content: "Hello everyone!",        // String
  timestamp: "2026-05-31T16:05:00Z"  // String (ISO timestamp)
}
```

---

## Implementation Checklist

### Phase 1: Authentication (Day 1)
- [ ] Create LoginScreen.tsx
- [ ] Implement POST /users (registration)
- [ ] Save JWT token to SecureStore
- [ ] Create ProtectedRoute wrapper
- [ ] Add logout functionality

### Phase 2: Map Screen (Day 1-2)
- [ ] Implement MapView with react-native-maps
- [ ] Get user location permission
- [ ] Call GET /map-data on map load
- [ ] Color-code regions by composite_score
- [ ] Create bottom sheet component
- [ ] Display air/noise/pollen/litter data
- [ ] Add ML/API mode toggle
- [ ] Implement prediction charts

### Phase 3: Report Screen (Day 2)
- [ ] Create issue type selector UI
- [ ] Implement location picker
- [ ] Add photo upload (expo-image-picker)
- [ ] Integrate Claude Vision analysis
- [ ] Create severity slider
- [ ] Implement POST /posts
- [ ] Add success feedback

### Phase 4: Community Screen (Day 3-4)
- [ ] Create tab navigator (Feed/My Reports/Petitions)
- [ ] Implement post feed with FlatList
- [ ] Add filters (neighborhood, category, sort)
- [ ] Create post card component
- [ ] Implement GET /posts with pagination
- [ ] Create post detail screen
- [ ] Implement POST /agree
- [ ] Add agreement UI feedback
- [ ] Create petition list
- [ ] Implement petition creation flow
- [ ] Add signature functionality
- [ ] Implement submit to official

### Phase 5: Health Screen (Day 2)
- [ ] Create health profile form
- [ ] Implement threshold sliders
- [ ] Add notification toggles
- [ ] Implement quiet hours picker
- [ ] Call GET /users on load
- [ ] Implement PUT /users on save
- [ ] Display personalized risk score
- [ ] Add risk factors breakdown

### Phase 6: Profile Screen (Day 1)
- [ ] Display user info
- [ ] Show statistics
- [ ] Implement neighborhood management
- [ ] Add settings links
- [ ] Create logout functionality

### Phase 7: Polish & Testing (Day 5)
- [ ] Error handling for all API calls
- [ ] Loading states
- [ ] Empty states
- [ ] Pull-to-refresh on lists
- [ ] Animations and transitions
- [ ] Toast notifications
- [ ] Offline handling
- [ ] Test all user flows end-to-end

---

## Common Patterns

### Making API Calls
```typescript
// src/utils/api.ts
import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_GATEWAY_URL;

async function getToken() {
  return await SecureStore.getItemAsync('jwt_token');
}

export async function apiGet<T = any>(
  path: string, 
  params?: Record<string, string>
): Promise<T> {
  const token = await getToken();
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${BASE}${path}${qs}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export async function apiPost<T = any>(
  path: string, 
  body: object
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

// Similar for apiPut, apiDelete
```

### Using in Components
```typescript
import { apiGet, apiPost } from '@/utils/api';

// In component:
const [posts, setPosts] = useState([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  loadPosts();
}, []);

async function loadPosts() {
  try {
    setLoading(true);
    const data = await apiGet('/posts', { 
      neighborhood: 'downtown',
      limit: '20'
    });
    setPosts(data.posts);
  } catch (error) {
    Alert.alert('Error', error.message);
  } finally {
    setLoading(false);
  }
}

async function agreeWithPost(postId: string) {
  try {
    const userId = await SecureStore.getItemAsync('user_id');
    const result = await apiPost(`/agree/${postId}`, { user_id: userId });
    // Update local state
    setPosts(posts.map(p => 
      p.post_id === postId 
        ? { ...p, agreement_count: result.agreement_count }
        : p
    ));
  } catch (error) {
    Alert.alert('Error', error.message);
  }
}
```

---

## Known Issues & Limitations

1. **messages-fn BROKEN** - threads table index issue
   - Can't implement messaging until Eugene fixes
   - Meetup threads won't be created at 25 signatures

2. **SNS Not Configured** - Push notifications won't work
   - Users won't get notified when:
     - Post reaches 10 agreements
     - Petition reaches 25 signatures
     - Petition submitted to official

3. **SES Not Configured** - Email delivery won't work
   - Petitions can't actually be emailed to officials
   - "Submit" will succeed but no email sent

4. **Missing Endpoints:**
   - GET /petitions (list)
   - POST /login (use POST /users for now)
   - GET /posts statistics by user
   - GET /petitions by signer

5. **CORS Fixed** - But only for 5 functions
   - messages-fn not uploaded with CORS headers

---

## Next Steps for Implementation

1. **Start with Authentication** - Get login/register working first
2. **Build Report Screen** - Core user action, simple flow
3. **Build Community Feed** - Most complex, but central to app
4. **Add Map Screen** - Visualization, read-only
5. **Add Health & Profile** - Settings screens, lower priority
6. **Polish and Test** - Error handling, loading states, animations

**Estimated Timeline:** 5-7 days for full implementation (1 developer)

---

## Contact & Support

- **API Gateway:** `https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/v2`
- **Test Screen:** Available in app under "Test" tab
- **Admin Tasks:** See `TODO_REMAINING_TASKS.md` for Eugene

**Questions?** Check:
1. This document
2. API test screen output
3. CloudWatch logs for Lambda functions
4. Original PRD documents

**Good luck!** 🚀
