# Deployment Instructions - Weather, Profile, Comments, Shares

## ✅ COMPLETED IMPLEMENTATION

All code has been written for:
1. **Weather Display** - 24h forecast in Health screen
2. **Profile Screen** - User info, notification settings
3. **Comments System** - Full backend + frontend
4. **Shares Enhancement** - Native APIs implemented

---

## 🔧 YOUR ACTION ITEMS (AWS Console)

### 1. Create DynamoDB Comments Table (15 min)

Go to AWS Console → DynamoDB → Create table:

- **Table name:** `comments`
- **Partition key:** `post_id` (String)
- **Sort key:** `comment_id` (String)
- **Settings:** On-demand capacity
- **GSI (Global Secondary Index):**
  - Index name: `post_id-created_at-index`
  - Partition key: `post_id` (String)
  - Sort key: `created_at` (String)
  - Projection: All attributes

Click **Create table**.

---

### 2. Deploy Lambda Functions (20 min)

#### A. Deploy posts-fn (with comments endpoints)

1. Go to AWS Console → Lambda → Functions
2. Find `posts-fn`
3. Click **Upload from** → `.zip file`
4. Upload: `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/posts-fn/posts-fn-new.zip`
5. Click **Save**
6. Wait for deployment to complete

#### B. Deploy env-data-fn (with weather forecast)

1. Go to AWS Console → Lambda → Functions
2. Find `env-data-fn`
3. Click **Upload from** → `.zip file`
4. Upload: `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/env-data-fn/env-data-fn-new.zip`
5. Click **Save**
6. Wait for deployment to complete

---

### 3. Add API Gateway Routes for Comments (10 min)

Go to AWS Console → API Gateway → Your API (w8r6o4jej0):

#### Route 1: POST /posts/{postId}/comments
- **Integration:** Lambda function `posts-fn`
- **Method:** POST

#### Route 2: GET /posts/{postId}/comments
- **Integration:** Lambda function `posts-fn`
- **Method:** GET

#### Route 3: DELETE /posts/{postId}/comments/{commentId}
- **Integration:** Lambda function `posts-fn`
- **Method:** DELETE

After adding routes:
- Click **Deploy API**
- Choose stage: `v2` (or your default stage)
- Click **Deploy**

---

## ✅ FRONTEND (Already Done)

All frontend code is complete:
- ✅ Weather service created
- ✅ Weather card added to Health screen
- ✅ Profile screen created
- ✅ Profile tab added to navigation
- ✅ Comments service created
- ✅ Comments modal added to Community screen
- ✅ Share button uses native APIs

**No deployment needed** - Expo dev server auto-reloads!

---

## 📋 WHAT EACH FEATURE DOES

### Weather Display
- Shows current temperature, feels-like, humidity, wind, UV index
- Displays 24-hour forecast in scrollable cards
- Data from OpenWeather API (80-95% accuracy)
- Located in Health screen above environmental forecasts

### Profile Screen
- Basic info: email (read-only), name (editable)
- Notification settings: enable/disable alerts
- Threshold configuration: noise, AQI, pollen levels
- Save button updates backend via users API

### Comments System
- **Backend:** DynamoDB table + 3 Lambda endpoints
- **Frontend:** Modal UI with comment list + input
- **Features:** Post comments, view comments, comment count updates
- Users can comment on any post in Community feed

### Shares Enhancement
- **Web:** Copies report details to clipboard
- **Mobile:** Opens native share sheet
- Includes category, severity, location, description

---

## 🧪 TESTING CHECKLIST

After deployment, test these flows:

### Weather
- [ ] Go to Health screen
- [ ] Weather card displays with current conditions
- [ ] 24 hourly forecast cards scroll horizontally
- [ ] All metrics show: temp, humidity, wind, UV

### Profile
- [ ] Go to Profile tab (new 6th tab)
- [ ] User email displays
- [ ] Edit name and save
- [ ] Toggle notifications on
- [ ] Edit thresholds and save
- [ ] Check success alert

### Comments
- [ ] Go to Community tab
- [ ] Click "Comment" button on any post
- [ ] Modal opens with comment list
- [ ] Type comment and click Send
- [ ] Comment appears in list
- [ ] Comment count increments on post
- [ ] Close modal

### Shares
- [ ] Click "Share" button on any post
- [ ] **Web:** Check clipboard has report details
- [ ] **Mobile:** Check native share sheet opens

---

## 🐛 TROUBLESHOOTING

### Comments not working?
- Check DynamoDB `comments` table exists
- Check API Gateway routes added and deployed
- Check `posts-fn` redeployed with new zip

### Weather not showing?
- Check `env-data-fn` redeployed with new zip
- Check browser console for API errors
- Verify OpenWeather API key is set in Lambda env vars

### Profile tab missing?
- Refresh browser/app completely
- Check MainNavigator.tsx includes ProfileTab

---

## ⏱️ TOTAL TIME ESTIMATE

- DynamoDB table: 15 min
- Lambda deployments: 20 min
- API Gateway routes: 10 min
- Testing: 15 min

**Total: ~60 minutes**

---

## 📦 FILES MODIFIED

### Backend
- `env-data-fn/index.js` - Extended fetchWeather to return forecast
- `posts-fn/index.js` - Added comment endpoints + comment_count field

### Frontend
- `enviroguard/src/services/weatherService.ts` - NEW
- `enviroguard/src/services/commentsService.ts` - NEW
- `enviroguard/src/screens/health/HealthScreen.tsx` - Added weather card
- `enviroguard/src/screens/profile/ProfileScreen.tsx` - NEW
- `enviroguard/src/navigation/ProfileStack.tsx` - NEW
- `enviroguard/src/navigation/MainNavigator.tsx` - Added ProfileTab
- `enviroguard/src/screens/community/CommunityScreenNew.tsx` - Added comments modal + native share

---

## 🎉 WHEN YOU'RE DONE

You'll have:
- **Weather forecasts** with 6 metrics in Health screen
- **Profile management** with notification settings
- **Comments** on all community posts
- **Native sharing** on web + mobile

The app will be **feature-complete** for demo! 🚀
