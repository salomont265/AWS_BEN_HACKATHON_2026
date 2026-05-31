# EnviroGuard Lambda Functions - Final Status Report
**Date:** 2026-05-29  
**Account:** YOUR_AWS_ACCOUNT_ID (us-east-1)  
**API Gateway:** https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1

---

## ✅ WORKING (5/6 Functions)

### 1. users-fn
- **Status:** ✅ Fully operational
- **Endpoints:** POST /users, GET /users/{id}
- **Test:**
```bash
curl -X POST https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

### 2. posts-fn
- **Status:** ✅ Fully operational
- **Endpoints:** POST /posts, GET /posts, GET /posts/{id}, POST /agree/{id}
- **Test:**
```bash
curl -X POST https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/posts \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"u_xxx","category":"noise","lat":40.7128,"lng":-74.006,"neighborhood_id":"downtown","description":"Test","severity":3}'
```

### 3. petitions-fn
- **Status:** ✅ Fully operational (includes new list endpoint)
- **Endpoints:** GET /petitions, POST /petitions, GET /petitions/{id}, POST /petitions/{id}/sign, POST /petitions/{id}/submit
- **Test:**
```bash
curl https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/petitions \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. ml-proxy-fn
- **Status:** ✅ Fully operational
- **EC2 Server:** http://44.204.121.129:8000 (Flask server running)
- **Endpoints:** /predict-noise/{neighborhood}, /predict-aqi/{neighborhood}, /predict-litter/{neighborhood}, /predict-pollen/{neighborhood}, /risk-score/{neighborhood}
- **Test:**
```bash
curl "https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/predict-noise/downtown?mode=real-time"
```

### 5. env-data-fn
- **Status:** ✅ Fully operational (external APIs working)
- **Endpoints:** /air-quality, /weather, /pollen, /noise-history, /litter-history, /map-data
- **Test:**
```bash
curl "https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/air-quality?lat=40.7128&lng=-74.006"
```

---

## 🔴 BROKEN (1/6 Functions)

### 6. messages-fn
- **Status:** ❌ DynamoDB schema issue
- **Problem:** threads table has `usersIds` index expecting String, but code uses List
- **Error:** `Type mismatch for Index Key user_ids Expected: S Actual: L`
- **Fix Required:** Delete `usersIds` index from threads table (requires admin)

---

## 🔴 MISSING FEATURES (Admin Required)

### SNS Notifications
- **Current:** All functions have blank/dummy SNS_TOPIC_ARN
- **Impact:** No push notifications work
- **Fix Needed:**
  1. Create SNS topic: `enviroguard-alerts`
  2. Update env vars in posts-fn, petitions-fn, messages-fn
  3. Add SNS:Publish permission to those roles

### SES Email
- **Current:** petitions-fn has blank SES_FROM_EMAIL
- **Impact:** Can't email petitions to officials
- **Fix Needed:**
  1. Verify email in SES
  2. Update SES_FROM_EMAIL in petitions-fn
  3. Add SES:SendEmail permission to petitions-fn role
  4. Request SES production access

---

## 🎯 CONFIGURATION

### Environment Variables (All Functions)
```
JWT_SECRET: mySecretKey12345EnviroGuard2026
```

**Function-Specific:**
- ml-proxy-fn: `EC2_ML_URL=http://44.204.121.129:8000`
- env-data-fn: `AIRNOW_API_KEY`, `OPENWEATHER_API_KEY`, `AMBEE_API_KEY` (set)
- posts-fn: `ANTHROPIC_API_KEY` (set), `SNS_TOPIC_ARN` (blank)
- petitions-fn: `ANTHROPIC_API_KEY` (set), `SNS_TOPIC_ARN` (blank), `SES_FROM_EMAIL` (blank)
- messages-fn: `SNS_TOPIC_ARN` (blank)

### DynamoDB Tables
All tables exist with correct schemas:
- ✅ users (partition: user_id, index: email-index)
- ✅ posts (partition: post_id, index: neighborhood)
- ✅ petitions (partition: petition_id)
- ✅ messages (partition: thread_id, sort: timestamp)
- ✅ threads (partition: thread_id, ⚠️ has problematic usersIds index)
- ✅ agreement (partition: post_id, sort: user_id)
- ✅ env_readings (partition: neighborhood_id, sort: timestamp)

---

## 📧 EMAIL TO SEND EUGENE

```
Subject: EnviroGuard Lambda - 3 Admin Tasks Needed

Hi Eugene,

Great news - 5 out of 6 Lambda functions are working! Just need your help with 3 things:

CRITICAL:
1. threads table: Delete the "usersIds" index (type mismatch error)
2. SNS: Create topic "enviroguard-alerts" + add Publish permissions to posts-fn, petitions-fn, messages-fn roles
3. SES: Verify noreply@enviroguard.app + add SendEmail permission to petitions-fn role

These will unblock messaging and notifications.

Thanks!
```

---

## 🧪 END-TO-END TEST FLOW

Once admin tasks complete, test full flow:

```bash
# 1. Create 10 users
for i in {1..10}; do
  curl -X POST .../users -d "{\"email\":\"user$i@test.com\",\"password\":\"pass\"}"
done

# 2. Create post (save post_id)
curl -X POST .../posts -H "Authorization: Bearer {TOKEN}" -d '{...}'

# 3. Have 10 users agree on post
for token in $TOKENS; do
  curl -X POST .../agree/{post_id} -H "Authorization: Bearer $token" -d '{...}'
done

# 4. Create petition (should work now that threshold met)
curl -X POST .../petitions -H "Authorization: Bearer {TOKEN}" -d '{...}'

# 5. Have users sign petition
# 6. Submit to official (triggers SES email)
```

---

## 📂 FILES LOCATION

- Lambda code: `/path/to/repo/{function}-fn/index.js`
- Zip files: `/path/to/repo/lambda-zips/{function}-fn.zip`
- Layer: `/path/to/repo/lambda-zips/dependencies-layer.zip`
- Setup notes: `/path/to/repo/.SETUP_NOTES.md`

---

## 🚀 CONVERT TO PDF

```bash
# Using pandoc (if installed)
pandoc FINAL_STATUS.md -o FINAL_STATUS.pdf

# Or paste into Google Docs and export as PDF
```
