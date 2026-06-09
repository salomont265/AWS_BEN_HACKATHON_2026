is # API Gateway Setup Guide - Complete Routing Configuration

Based on: EnviroGuard PRD, ML PRD, Frontend API Integration v2 PRD, and actual Lambda functions built.

## Your Lambda Functions (What You Actually Built)

1. **users-fn** - User auth, profile management
2. **posts-fn** - Community posts, agreements
3. **petitions-fn** - Petition creation, signing, submission
4. **ml-proxy-fn** - ML predictions (proxies to EC2)
5. **env-data-fn** - Environmental data from external APIs
6. **messages-fn** - ❌ BROKEN (threads index issue)

---

## API Gateway Configuration

API ID: `w8r6o4jej0`  
Stage: `test1`  
Base URL: `https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1`

---

## Step-by-Step Setup in API Gateway Console

### 1. users-fn Routes

**Create Resource: `/users`**
- Actions → Create Resource
- Resource Name: `users`
- Resource Path: `/users`
- ✅ Enable CORS
- Create Resource

**Add Method: `ANY`**
- Select `/users` resource
- Actions → Create Method → `ANY`
- Integration type: **Lambda Function**
- Lambda Function: `users-fn`
- Use Lambda Proxy integration: ✅
- Save → OK

**Create Child Resource: `/users/{proxy+}`**
- Select `/users` resource
- Actions → Create Resource
- ✅ Check "Configure as proxy resource"
- Resource Path: `{proxy+}`
- Create Resource
- Integration type: **Lambda Function**
- Lambda Function: `users-fn`
- Save → OK

**Create Resource: `/push-token`**
- Actions → Create Resource
- Resource Name: `push-token`
- Resource Path: `/push-token`
- Create Resource
- Add Method: `ANY` → Lambda: `users-fn`

---

### 2. posts-fn Routes

**Create Resource: `/posts`**
- Resource Name: `posts`
- Resource Path: `/posts`
- Add Method: `ANY` → Lambda: `posts-fn`

**Create Child Resource: `/posts/{proxy+}`**
- Select `/posts`
- ✅ Configure as proxy resource
- Lambda: `posts-fn`

**Create Resource: `/agree`**
- Resource Name: `agree`
- Resource Path: `/agree`
- Add Method: `ANY` → Lambda: `posts-fn`

**Create Child Resource: `/agree/{proxy+}`**
- Select `/agree`
- ✅ Configure as proxy resource
- Lambda: `posts-fn`

---

### 3. petitions-fn Routes

**Create Resource: `/petitions`**
- Resource Name: `petitions`
- Resource Path: `/petitions`
- Add Method: `ANY` → Lambda: `petitions-fn`

**Create Child Resource: `/petitions/{proxy+}`**
- Select `/petitions`
- ✅ Configure as proxy resource
- Lambda: `petitions-fn`

---

### 4. ml-proxy-fn Routes

**Create Resources (5 total):**

**A. `/predict-noise`**
- Resource Name: `predict-noise`
- Add Method: `ANY` → Lambda: `ml-proxy-fn`
- Create Child: `/predict-noise/{proxy+}` → Lambda: `ml-proxy-fn`

**B. `/predict-aqi`**
- Resource Name: `predict-aqi`
- Add Method: `ANY` → Lambda: `ml-proxy-fn`
- Create Child: `/predict-aqi/{proxy+}` → Lambda: `ml-proxy-fn`

**C. `/predict-litter`**
- Resource Name: `predict-litter`
- Add Method: `ANY` → Lambda: `ml-proxy-fn`
- Create Child: `/predict-litter/{proxy+}` → Lambda: `ml-proxy-fn`

**D. `/predict-pollen`**
- Resource Name: `predict-pollen`
- Add Method: `ANY` → Lambda: `ml-proxy-fn`
- Create Child: `/predict-pollen/{proxy+}` → Lambda: `ml-proxy-fn`

**E. `/risk-score`**
- Resource Name: `risk-score`
- Add Method: `ANY` → Lambda: `ml-proxy-fn`
- Create Child: `/risk-score/{proxy+}` → Lambda: `ml-proxy-fn`

---

### 5. env-data-fn Routes

**Create Resources (6 total):**

**A. `/map-data`**
- Resource Name: `map-data`
- Add Method: `ANY` → Lambda: `env-data-fn`

**B. `/air-quality`**
- Resource Name: `air-quality`
- Add Method: `ANY` → Lambda: `env-data-fn`

**C. `/pollen`**
- Resource Name: `pollen`
- Add Method: `ANY` → Lambda: `env-data-fn`

**D. `/weather`**
- Resource Name: `weather`
- Add Method: `ANY` → Lambda: `env-data-fn`

**E. `/noise-history`**
- Resource Name: `noise-history`
- Add Method: `ANY` → Lambda: `env-data-fn`

**F. `/litter-history`**
- Resource Name: `litter-history`
- Add Method: `ANY` → Lambda: `env-data-fn`

---

### 6. messages-fn Routes (SKIP FOR NOW - BROKEN)

**DO NOT SET UP** until Eugene fixes the threads table index issue.

Once fixed, create:
- `/threads` → `messages-fn`
- `/threads/{proxy+}` → `messages-fn`
- `/messages` → `messages-fn`
- `/messages/{proxy+}` → `messages-fn`

---

## Final Step: Deploy API

1. Click **Actions** → **Deploy API**
2. Deployment stage: **test1**
3. Click **Deploy**

Your API will be live at:
```
https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1
```

---

## Complete Route Summary

| Path | Method | Lambda Function | Status |
|------|--------|-----------------|--------|
| `/users` | ANY | users-fn | ✅ Setup |
| `/users/{proxy+}` | ANY | users-fn | ✅ Setup |
| `/push-token` | ANY | users-fn | ✅ Setup |
| `/posts` | ANY | posts-fn | ✅ Setup |
| `/posts/{proxy+}` | ANY | posts-fn | ✅ Setup |
| `/agree` | ANY | posts-fn | ✅ Setup |
| `/agree/{proxy+}` | ANY | posts-fn | ✅ Setup |
| `/petitions` | ANY | petitions-fn | ✅ Setup |
| `/petitions/{proxy+}` | ANY | petitions-fn | ✅ Setup |
| `/predict-noise` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-noise/{proxy+}` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-aqi` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-aqi/{proxy+}` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-litter` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-litter/{proxy+}` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-pollen` | ANY | ml-proxy-fn | ✅ Setup |
| `/predict-pollen/{proxy+}` | ANY | ml-proxy-fn | ✅ Setup |
| `/risk-score` | ANY | ml-proxy-fn | ✅ Setup |
| `/risk-score/{proxy+}` | ANY | ml-proxy-fn | ✅ Setup |
| `/map-data` | ANY | env-data-fn | ✅ Setup |
| `/air-quality` | ANY | env-data-fn | ✅ Setup |
| `/pollen` | ANY | env-data-fn | ✅ Setup |
| `/weather` | ANY | env-data-fn | ✅ Setup |
| `/noise-history` | ANY | env-data-fn | ✅ Setup |
| `/litter-history` | ANY | env-data-fn | ✅ Setup |
| `/threads` | ANY | messages-fn | ⛔ SKIP |
| `/threads/{proxy+}` | ANY | messages-fn | ⛔ SKIP |
| `/messages` | ANY | messages-fn | ⛔ SKIP |
| `/messages/{proxy+}` | ANY | messages-fn | ⛔ SKIP |

**Total routes to configure: 26 (skip 4 messages routes)**

---

## Why Use `{proxy+}` (Proxy Resources)?

The `{proxy+}` catches all sub-paths under a resource. For example:
- `/users/{proxy+}` handles `/users/u_123`, `/users/u_456/profile`, etc.
- `/petitions/{proxy+}` handles `/petitions/pet_123`, `/petitions/pet_123/sign`, `/petitions/pet_123/submit`

Your Lambda functions have internal routers that parse the path and route to the correct handler.

---

## Testing After Setup

```bash
# Test users endpoint
curl -X POST https://w8r6o4jej0.execute-api.us-east-1.amazonaws.com/test1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Should return: {"user_id":"u_xxxxx","email":"test@example.com","token":"eyJ..."}
```

If you get `{"message":"Missing Authentication Token"}`, the route isn't configured in API Gateway.

If you get `{"error":"..."}`, the route works but Lambda has an error.

---

## Notes

- **ALL routes use `ANY` method** - Lambda functions handle GET/POST/PUT internally
- **Enable CORS** if frontend will run on different domain
- **Use Lambda Proxy integration** - checked by default
- **Deploy after every change** - changes don't go live until deployed
- **Messages routes** - SKIP until Eugene fixes threads table
