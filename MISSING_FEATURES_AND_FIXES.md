# Missing Features & Required Fixes - June 3, 2026

## Status: Frontend Working with Real API Data ✅
## Remaining: Deploy Lambda Updates + Missing UI Features

---

## 🔴 CRITICAL - MUST DEPLOY (App Won't Work Without These)

### 1. **Deploy 6 Updated Lambda Functions**
**Location:** `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/`

All Lambda .zip files are updated with CORS fix and login endpoint. Upload these to AWS Lambda Console:

- `ml-proxy-fn/ml-proxy-fn.zip` (1.4K)
- `posts-fn/posts-fn.zip` (4.7K)
- `petitions-fn/petitions-fn.zip` (3.8K)
- `users-fn/users-fn.zip` (2.7K) ← **NEW: POST /login endpoint**
- `messages-fn/messages-fn.zip` (2.8K)
- `env-data-fn/env-data-fn.zip` (4.4K)

**What's Fixed:**
- All 6 functions now handle OPTIONS requests (CORS preflight)
- users-fn has new POST /login endpoint for authentication

**Why Critical:**
- CORS still broken in production until deployed
- Login won't work (only signup works currently)

---

### 2. **Add POST /login Route to API Gateway**
After deploying users-fn.zip:
1. Go to API Gateway console
2. Find your API (v2 stage)
3. Add route: `POST /login`
4. Integration: Lambda function → `users-fn`
5. Enable CORS (same as other routes)
6. Deploy API to v2 stage

**Why Critical:** Login endpoint doesn't exist in API Gateway yet

---

## 🟡 HIGH PRIORITY - Features Broken

### 3. **Create SNS Topic for Push Notifications**
```bash
aws sns create-topic --name enviroguard-alerts
# Returns: arn:aws:sns:us-east-1:xxxxx:enviroguard-alerts
```

Then update Lambda environment variables:
- posts-fn: Set `SNS_TOPIC_ARN`
- petitions-fn: Set `SNS_TOPIC_ARN`
- messages-fn: Set `SNS_TOPIC_ARN`

Add IAM permission to Lambda roles: `sns:Publish`

**Impact:** No push notifications work without this

---

### 4. **Configure SES for Petition Emails**
```bash
# 1. Verify sender email
aws ses verify-email-identity --email-address noreply@enviroguard.app

# 2. Update petitions-fn environment variable
aws lambda update-function-configuration \
  --function-name petitions-fn \
  --environment Variables="{SES_FROM_EMAIL=noreply@enviroguard.app,SNS_TOPIC_ARN=arn:aws:sns:...}"
```

Add IAM permission to petitions-fn role: `ses:SendEmail`

**Impact:** Petitions can't be emailed to government officials

---

### 5. **Fix threads Table Index (Admin/Eugene)**
**Problem:** threads table has `usersIds` index expecting String but code uses List

**Error:** `Type mismatch for Index Key user_ids Expected: S Actual: L`

**Fix:** Delete the `usersIds` index from threads table in DynamoDB console

**Impact:** messages-fn is completely broken (from FINAL_STATUS.md)

---

## 🚨 MAJOR MISSING FEATURES - Built But Hidden

### 6. **Community/Social Feed Tab NOT SHOWN**

**Status:** ✅ Fully built ❌ Not in navigation

**File:** `src/screens/community/CommunityScreenNew.tsx` (693 lines)

**Features Include:**
- Instagram-like feed of community posts
- "My Reports" tab showing user's submissions
- "Petitions" tab with signature progress bars
- Like/agree buttons with counts
- Comment & share actions
- Filter by category (noise, air, litter, pollen)
- Pull-to-refresh
- Empty states

**Why It's Hidden:**
```typescript
// MainNavigator.tsx imports it:
import CommunityStack from './CommunityStack';

// But never uses it! Only 5 tabs shown:
// Home, Map, Health, Report, Profile
```

**To Fix:**
Replace ProfileTab with CommunityTab in `src/navigation/MainNavigator.tsx`:

```typescript
// Change from:
<Tab.Screen
  name="ProfileTab"
  component={ProfileStack}
  options={{
    tabBarLabel: '👤 Profile',
  }}
/>

// To:
<Tab.Screen
  name="CommunityTab"
  component={CommunityStack}
  options={{
    tabBarLabel: '👥 Community',
  }}
/>
```

Or add as 6th tab if you want both.

---

### 7. **Weather Data Not Displayed**

**Status:** ✅ Backend working ❌ Not shown in frontend

**Available:**
- `env-data-fn` has GET /weather endpoint working
- Returns: temperature, humidity, conditions, wind

**Currently Shown:**
- HomeScreen: Noise, AQI, Pollen, Litter
- HealthScreen: Same 4 metrics

**Missing:** Weather card/widget

**To Add:**
Add weather card to HomeScreen.tsx:
```typescript
<MetricCard
  icon="🌡️"
  title="Temperature"
  value={weather.temp}
  unit="°F"
  severity="low"
/>
```

---

### 8. **Claude Vision Photo Analysis - Mocked in Frontend**

**Status:** ✅ Backend implemented ❌ Frontend mocked

**Backend (posts-fn):**
```javascript
// Line 109-235: analyzePhotoWithClaude function
// ANTHROPIC_API_KEY is SET ✅
// Uses Claude Vision API to analyze report photos
// Returns: confirmed_category, severity, description
```

**Frontend (ReportScreenNew.tsx):**
```typescript
// Line 78-95: analyzePhoto function
// Currently just sleeps 2 seconds and returns mock data
// Comment says: "In real implementation, this would call POST /reports with photo"
```

**To Fix:**
ReportScreen should:
1. Upload photo to S3 first (get photo_url)
2. Call POST /posts with photo_url
3. Backend analyzes with Claude Vision
4. Display real AI suggestions

**Current Behavior:**
- User uploads photo
- Fake "AI analyzing..." spinner for 2 seconds
- Shows hardcoded suggestion

**Real Behavior:**
- Upload photo → S3
- Submit to backend with photo_url
- Backend calls Claude Vision API
- Returns actual AI analysis

---

## 📋 DynamoDB Tables Status

From FINAL_STATUS.md, all tables exist:

✅ **Tables Created:**
1. users (partition: user_id, index: email-index)
2. posts (partition: post_id, index: neighborhood)
3. petitions (partition: petition_id)
4. messages (partition: thread_id, sort: timestamp)
5. threads (partition: thread_id, ⚠️ has problematic usersIds index)
6. agreement (partition: post_id, sort: user_id)
7. env_readings (partition: neighborhood_id, sort: timestamp)
8. alerts (partition: userId, sort: timestamp) - **No Lambda endpoint yet**

❌ **Missing Endpoints:**
- GET /alerts (list user alerts) - Lambda not implemented
- POST /alerts (create alert subscription) - Lambda not implemented

---

## 🎯 Current Tab Structure

**Bottom Navigation (5 tabs):**
1. 🏠 Home - Dashboard with current conditions
2. 🗺️ Map - Risk zones map (web shows placeholder)
3. 📊 Health - 24-hour forecasts with charts
4. 📝 Report - Submit new environmental report
5. 👤 Profile - User settings and health info

**Hidden But Built:**
6. 👥 Community - Social feed with posts/petitions (exists but not shown)

---

## 📊 What's Working Right Now

### ✅ Frontend
- Real ML prediction data loading (noise, AQI, pollen, litter)
- Navigation between tabs
- Home dashboard with risk calculations
- Health forecasts with interactive charts
- Report submission form (needs backend testing)
- Profile screen (needs auth to test)
- Cross-platform storage (web + mobile)

### ✅ Backend (from FINAL_STATUS.md May 29)
- users-fn: POST /users (signup), GET /users/{id}
- posts-fn: All endpoints working
- petitions-fn: All endpoints working
- ml-proxy-fn: All ML predictions working
- env-data-fn: External APIs working

### ❌ Backend (Broken)
- messages-fn: DynamoDB schema mismatch (threads index)

### ⚠️ Backend (Not Configured)
- SNS notifications (blank ARN)
- SES emails (blank from address)

---

## 🧪 Testing Checklist

After deploying Lambda updates:

**Authentication:**
- [ ] Signup with new email
- [ ] Login with existing email
- [ ] JWT token stored
- [ ] Profile loads user data

**Data Display:**
- [ ] Home shows real ML predictions
- [ ] Health shows 24h forecast charts
- [ ] Refresh button updates data
- [ ] No CORS errors in console

**Community (if tab added):**
- [ ] Feed shows posts
- [ ] Can agree with posts
- [ ] Can view petitions
- [ ] Can sign petitions

**Reports:**
- [ ] Can submit report without photo
- [ ] Can submit report with photo
- [ ] Backend analyzes photo with Claude Vision
- [ ] Post appears in community feed

**Notifications (after SNS/SES):**
- [ ] Push notifications on new posts
- [ ] Petition emails sent to officials
- [ ] Message notifications work

---

## 🚀 Deployment Priority

**Do First (App won't work):**
1. Deploy 6 Lambda .zip files
2. Add POST /login to API Gateway
3. Test signup/login flow

**Do Second (Enable features):**
4. Create SNS topic + set ARN
5. Configure SES email
6. Add IAM permissions

**Do Third (Fix broken features):**
7. Fix threads table index
8. Add Community tab to navigation
9. Test messaging flow

**Do Later (Nice to have):**
10. Add weather display
11. Connect real Claude Vision analysis
12. Implement GET/POST /alerts endpoints
13. Request SES production access

---

## 📝 Files Ready to Deploy

All Lambda functions zipped and ready at:
```
/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/
├── ml-proxy-fn/ml-proxy-fn.zip
├── posts-fn/posts-fn.zip
├── petitions-fn/petitions-fn.zip
├── users-fn/users-fn.zip         ← NEW: Has POST /login
├── messages-fn/messages-fn.zip
└── env-data-fn/env-data-fn.zip
```

---

## 🎉 Summary

**What Works:**
- Frontend displays real API data
- ML predictions accurate
- CORS fixed (needs deployment)
- Login endpoint coded (needs deployment)
- Community feed built (needs to be shown)

**What's Missing:**
- Lambda deployment (CORS + login)
- POST /login route in API Gateway
- SNS topic for notifications
- SES email for petitions
- Community tab in navigation
- Weather display
- Claude Vision frontend integration

**Total Deployment Time: ~30 minutes**
- 10 min: Upload 6 Lambda .zips
- 5 min: Add /login route to API Gateway
- 10 min: Create SNS topic + set env vars
- 5 min: Configure SES email

**Then the app is fully functional! 🚀**
