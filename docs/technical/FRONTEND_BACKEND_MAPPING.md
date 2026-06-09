# Frontend ↔ Backend API Mapping

## ✅ MATCHING ENDPOINTS

### Users Service
| Frontend Call | Lambda Function | Status |
|--------------|----------------|--------|
| `POST /users` | users-fn | ✅ Match |
| `GET /users/{id}` | users-fn | ✅ Match |
| `PUT /users/{id}` | users-fn | ✅ Match |
| `POST /push-token` | users-fn | ✅ Match |

### Posts Service  
| Frontend Call | Lambda Function | Status |
|--------------|----------------|--------|
| `GET /posts?neighborhood=X&aggregate=false` | posts-fn | ⚠️ **MISSING** |
| `POST /posts` | posts-fn | ✅ Match |
| `GET /posts/{id}` | posts-fn | ✅ Match |
| `GET /agree/{id}?userId=X` | posts-fn | ⚠️ **MISSING** |
| `POST /agree/{id}` | posts-fn | ✅ Match |

**Issues:**
- Tyler's frontend expects `GET /posts` with query params (neighborhood, aggregate, sort, category, user_id)
- Our posts-fn only has `GET /posts` without proper query handling for feed
- Tyler expects `GET /agree/{id}` to check if user already agreed - we don't have this
- Our posts-fn has `POST /agree/{id}` but frontend needs GET first to check status

### Petitions Service
| Frontend Call | Lambda Function | Status |
|--------------|----------------|--------|
| `POST /petitions` | petitions-fn | ✅ Match |
| `GET /petitions` | petitions-fn | ✅ Match (added yesterday) |
| `GET /petitions/{id}` | petitions-fn | ✅ Match |
| `POST /petitions/{id}/sign` | petitions-fn | ✅ Match |
| `POST /petitions/{id}/submit` | petitions-fn | ✅ Match |

### ML Predictions Service
| Frontend Call | Lambda Function | Status |
|--------------|----------------|--------|
| `GET /predict-noise/{neighborhood}?mode=X` | ml-proxy-fn | ✅ Match |
| `GET /predict-aqi/{neighborhood}?mode=X` | ml-proxy-fn | ✅ Match |
| `GET /predict-litter/{neighborhood}?mode=X` | ml-proxy-fn | ✅ Match |
| `GET /predict-pollen/{neighborhood}?mode=X` | ml-proxy-fn | ✅ Match |
| `GET /risk-score/{neighborhood}?mode=X` | ml-proxy-fn | ✅ Match |

### Environmental Data Service
| Frontend Call | Lambda Function | Status |
|--------------|----------------|--------|
| `GET /map-data?lat=X&lng=Y&mode=Z` | env-data-fn | ✅ Match |
| `GET /air-quality?lat=X&lng=Y` | env-data-fn | ✅ Match |
| `GET /pollen?lat=X&lng=Y` | env-data-fn | ✅ Match |
| `GET /weather?lat=X&lng=Y` | env-data-fn | ✅ Match |
| `GET /noise-history?neighborhood=X` | env-data-fn | ✅ Match |
| `GET /litter-history?neighborhood=X` | env-data-fn | ✅ Match |

---

## 🔴 CRITICAL ISSUES TO FIX

### 1. posts-fn Missing `GET /posts` with Query Filters
**Frontend expects:**
```typescript
GET /posts?neighborhood=downtown&aggregate=false&sort=recent&category=noise
GET /posts?user_id=u_123&aggregate=false  // User's own posts
```

**Current Lambda:** Only returns single post by ID, no list/feed endpoint

**Fix needed:** Add `getPosts()` handler that:
- Queries posts by neighborhood (using `neighborhood` GSI)
- Filters by category if provided
- Filters by user_id if provided
- Sorts by created_at (recent) or agreement_count (agreements)
- Returns `{ posts: [...], lastKey: null }` format
- Supports pagination with lastKey

### 2. posts-fn Missing `GET /agree/{id}`
**Frontend expects:**
```typescript
GET /agree/{post_id}?userId=u_123
// Returns: { agreement_count: 3, user_has_agreed: false, petition_ready: false }
```

**Current Lambda:** Only has `POST /agree/{id}` to add agreement, no GET to check status

**Fix needed:** Add `getAgree()` handler that:
- Gets post agreement_count from posts table
- Queries agreement table to check if user already agreed
- Returns agreement status without modifying data

---

## 📊 SUMMARY

**Total endpoints:** 23
**Working:** 19 (83%)
**Missing:** 2 (9%)
**Blocked (admin):** 2 (8% - messages-fn endpoints not listed)

**Priority:**
1. Add `GET /posts` list/feed handler to posts-fn (HIGH - core feature)
2. Add `GET /agree/{id}` check handler to posts-fn (HIGH - prevents duplicate agreements)
3. Fix messages-fn threads index (ADMIN REQUIRED)
4. Configure SNS and SES (ADMIN REQUIRED)
