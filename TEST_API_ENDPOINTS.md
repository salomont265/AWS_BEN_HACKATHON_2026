# API Testing Commands

Your API Gateway: `https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1`

## Step 1: Create Test User (Get JWT Token)

```bash
curl -X POST https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"tyler-test@example.com","password":"pass123"}'
```

**Expected:** `{"user_id":"u_xxxxx","email":"tyler-test@example.com","token":"eyJ..."}`

Save the token!

## Step 2: Test GET /posts with user_id filter

```bash
TOKEN="<paste token from step 1>"

curl "https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/posts?user_id=u_xxxxx&aggregate=false" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** `{"posts":[],"lastKey":null,"total_returned":0}` (empty if no posts yet)

## Step 3: Create a test post

```bash
curl -X POST https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"u_xxxxx",
    "category":"noise",
    "description":"Testing from frontend",
    "severity":3,
    "lat":40.7128,
    "lng":-74.006,
    "neighborhood_id":"downtown"
  }' | jq '.'
```

## Step 4: Test GET /posts with user_id again

```bash
curl "https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/posts?user_id=u_xxxxx&aggregate=false" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** Should return the post you just created

## Step 5: Test GET /agree/{post_id}

```bash
POST_ID="<post_id from step 3>"

curl "https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/agree/$POST_ID?userId=u_xxxxx" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Expected:** `{"post_id":"p_xxx","agreement_count":0,"user_has_agreed":false,"petition_ready":false}`

## Frontend Testing

Once API tests pass, start the Expo app:

```bash
cd /Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/enviroguard
npx expo start
```

Then:
1. Press `w` to open in web browser
2. Or scan QR code with Expo Go app on phone
3. Sign up with a test account
4. Try creating a post
5. Try viewing community feed
