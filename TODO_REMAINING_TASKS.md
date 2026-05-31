# TODO - Remaining Tasks

**Date:** 2026-05-30  
**Status:** API Gateway deployed, 5/6 functions working

---

## 🔴 CRITICAL - Requires Eugene (Admin Access)

### 1. Fix threads table index (messages-fn broken)
**Problem:** threads table has `usersIds` index expecting String type, but code uses List  
**Error:** `Type mismatch for Index Key user_ids Expected: S Actual: L`  

**Fix:**
- Delete `usersIds` index from threads table
- OR recreate threads table without the index
- This is correct design (group chats need multiple users in array)

**Impact:** Messages/chat functionality completely broken until fixed

---

### 2. Configure SNS for push notifications
**Current:** All functions have blank/dummy `SNS_TOPIC_ARN`  
**Impact:** No push notifications work anywhere in app

**Fix:**
1. Create SNS topic: `enviroguard-alerts`
2. Update environment variables:
   - posts-fn: `SNS_TOPIC_ARN=arn:aws:sns:us-east-1:184976607466:enviroguard-alerts`
   - petitions-fn: `SNS_TOPIC_ARN=arn:aws:sns:us-east-1:184976607466:enviroguard-alerts`
   - messages-fn: `SNS_TOPIC_ARN=arn:aws:sns:us-east-1:184976607466:enviroguard-alerts`
3. Add IAM permissions to Lambda roles:
   ```json
   {
     "Effect": "Allow",
     "Action": "sns:Publish",
     "Resource": "arn:aws:sns:us-east-1:184976607466:enviroguard-alerts"
   }
   ```

**Notifications that will work once configured:**
- Post reaches 10 agreements (petition ready)
- Petition reaches 25 signatures (meetup thread created)
- Petition submitted to official

---

### 3. Configure SES for email delivery
**Current:** petitions-fn has blank `SES_FROM_EMAIL`  
**Impact:** Can't email petitions to government officials

**Fix:**
1. Verify sender email in SES: `noreply@enviroguard.app`
2. Update environment variable:
   - petitions-fn: `SES_FROM_EMAIL=noreply@enviroguard.app`
3. Add IAM permission to petitions-fn role:
   ```json
   {
     "Effect": "Allow",
     "Action": "ses:SendEmail",
     "Resource": "*"
   }
   ```
4. Request SES production access (currently in sandbox - can only send to verified emails)

**When this works:**
- Users can submit petitions to officials via email
- Email contains petition text + signature count

---

## 🟡 MEDIUM PRIORITY - Design Decisions Needed

### 4. Weather prediction strategy
**Question:** What do we want for weather predictions?

**Options:**

**A. Use OpenWeather API directly (current approach)**
- env-data-fn already calls OpenWeather API
- Returns current + 5-day forecast
- No ML prediction needed
- **Pro:** Simple, real data, already working
- **Con:** Not using our ML models

**B. Build Prophet weather model (new ML model)**
- Train Prophet on historical weather data
- Add to EC2 Flask server as 5th model
- Predict temperature/humidity/wind 24h ahead
- **Pro:** Consistent with other predictions (noise, AQI, litter, pollen)
- **Con:** Weather prediction is hard, OpenWeather is more accurate

**C. Hybrid approach**
- Use OpenWeather for current conditions
- Use Prophet to predict how weather affects other metrics (noise, AQI impact)
- **Pro:** Best of both - real weather + ML impact predictions
- **Con:** More complex

**DECISION NEEDED:** Which approach? Current setup uses Option A.

---

## 🟢 LOW PRIORITY - Nice to Have

### 5. Add user_id GSI to posts table
**Current:** Filtering by user_id uses Scan (slow)  
**Impact:** "My Reports" screen will be slow with many posts

**Fix:**
- Create GSI on posts table:
  - Index name: `user_id-index`
  - Partition key: `user_id` (String)
  - Sort key: `created_at` (String)
- Update posts-fn to use Query instead of Scan when user_id provided

**When to do:** After initial testing, before production launch

---

### 6. Clean up debug logging in posts-fn
**Current:** Extensive console.log statements in verifyJWT() for debugging JWT issues

**Fix:**
```javascript
// Remove these lines from posts-fn/index.js:
console.log("JWT_SECRET:", JSON.stringify(JWT_SECRET));
console.log("JWT_SECRET exists:", !!JWT_SECRET, "length:", JWT_SECRET?.length);
// etc...
```

**When to do:** After confirming JWT authentication works in production

---

### 7. Test full end-to-end petition flow
**Not yet tested:**
1. Create 10 users
2. Have all 10 agree on same post
3. Create petition (threshold met)
4. Have 25 users sign petition
5. Meetup thread auto-created
6. Submit petition to official (SES email sent)

**Blocked by:** SNS and SES configuration (tasks #2 and #3)

---

## 📝 EMAIL TO EUGENE

```
Subject: EnviroGuard - 3 Admin Tasks to Unblock

Hi Eugene,

API Gateway is deployed and 5/6 functions working! Need your help with 3 things:

CRITICAL:
1. threads table: Delete the "usersIds" index (type mismatch error blocking messages)
2. SNS: Create topic "enviroguard-alerts", add Publish permissions to posts-fn, petitions-fn, messages-fn
3. SES: Verify noreply@enviroguard.app, add SendEmail permission to petitions-fn

These will unblock:
- Messaging/chat (task #1)
- Push notifications (task #2)
- Email petitions to officials (task #3)

Let me know when done so we can test!

Thanks,
[Your name]
```

---

## Current Status Summary

**Working (5/6 functions):**
- ✅ users-fn (auth, profile)
- ✅ posts-fn (community posts, agreements)
- ✅ petitions-fn (create, sign, submit - email blocked)
- ✅ ml-proxy-fn (all ML predictions working)
- ✅ env-data-fn (all external APIs working)

**Broken (1/6 functions):**
- ❌ messages-fn (threads table index issue)

**Missing features:**
- ❌ Push notifications (SNS not configured)
- ❌ Email delivery (SES not configured)

**API Gateway:**
- ✅ Deployed to test1 stage
- ✅ All routes configured
- ✅ Frontend ready to connect
