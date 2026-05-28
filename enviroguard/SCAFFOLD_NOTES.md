# EnviroGuard Scaffold Implementation Notes

This document provides detailed technical information for developers and AI tools working on this scaffold.

## 🎯 What is This Scaffold?

**Purpose:** A fully functional starting point with all navigation working, placeholder UI, and fake data that matches real API contracts exactly.

**Not Production:** This is intentionally incomplete. UI is basic, data is fake, no real backend connection.

**Migration Path:** Clear comments and documentation show exactly how to connect each part to real AWS backend.

## ✅ What's Production-Ready

These components are FINAL - no changes needed:

### Navigation (src/navigation/)
- **Type-safe routing** - All screen params typed
- **5 tab structure** - Map, Health, Report, Community, Profile
- **Stack navigation per tab** - Detail screens ready
- **Kiosk mode support** - Conditional rendering based on KIOSK_MODE env var
- **Auth flow** - Login/onboarding screens (placeholder)

### Design System (src/theme/)
- **Color palette** - From PRD page 8, brand-approved
- **Spacing system** - 8px base unit
- **Typography** - System fonts with defined hierarchy
- **Utility functions** - Severity colors, risk colors

### TypeScript Types (src/types/)
- **Data models** - All PRD entities defined
- **Navigation types** - Screen params for type safety
- **API contracts** - Request/response shapes

### Claude Integration (src/services/claude/)
- **Vision API** - Photo analysis WORKS NOW
- **Streaming API** - Letter generation WORKS NOW
- **Prompt templates** - Optimized for environmental analysis

## ⚠️ What's Scaffold-Only (Needs Backend)

### Fake Data Files (src/data/fake/)
**DELETE THIS ENTIRE DIRECTORY** when backend is ready.

Each file has:
- Comment block explaining real API endpoint
- Data structure matching DynamoDB schema
- Multiple scenarios for UI testing

**Migration:** Replace `require('@/data/fake/X.json')` with `fetch(API_URL/endpoint)`

### Service Layer (src/services/api/)
**Pattern in every service file:**

```typescript
async function getData() {
  // FAKE-DATA START
  if (ENV.enableFakeData) {
    return require('@/data/fake/data.json');
  }
  // FAKE-DATA END
  
  // REAL implementation (commented out, ready to use):
  // const response = await fetch(`${ENV.apiBaseUrl}/endpoint`);
  // if (!response.ok) throw new Error('API Error');
  // return response.json();
}
```

**To make real:**
1. Deploy AWS backend (API Gateway + Lambda + DynamoDB)
2. Set `EXPO_PUBLIC_ENABLE_FAKE_DATA=false` in .env
3. Uncomment real implementation
4. Delete fake block

### Storage (AsyncStorage)
**Current:** Profile data stored locally only  
**Future:** Sync to DynamoDB via GET/PUT /users/{id}

## ❌ What's Not Implemented

### Authentication
**Current:** Fake auth - always succeeds  
**Future:** AWS Cognito or JWT tokens

**Files to create:**
- `src/services/auth.ts` - Auth service
- `src/screens/auth/LoginScreen.tsx`
- `src/screens/auth/OnboardingScreen.tsx`

### Real-Time Updates
**Current:** Static data  
**Future:** WebSocket or polling

**Implementation:**
- API Gateway WebSocket API
- Or: Polling with React Query refetchInterval

### Error Handling
**Current:** Basic console.log  
**Future:** Error boundaries, retry logic, user-friendly messages

### Offline Support
**Current:** Requires network for Claude API  
**Future:** Cache data in AsyncStorage, queue failed requests

## 📝 Commenting Conventions

### Comment Tags

**`// FAKE-DATA`** - Marks code that returns placeholder data
```typescript
// FAKE-DATA START
if (ENV.enableFakeData) {
  return mockData;
}
// FAKE-DATA END
```

**`// TODO:`** - Action item with context
```typescript
// TODO: Replace with API Gateway endpoint
// Endpoint: GET /stations?bbox={bbox}
// Response: Array<Station>
```

**`// WHY:`** - Explains architectural decisions
```typescript
// WHY: Using 8px base unit for consistent spacing across all screens
```

**`// CHANGEABLE:`** - Can be modified for different needs
```typescript
// CHANGEABLE: Can adjust multiplier for accessibility requirements
```

**`// FIXED:`** - Should not be changed without approval
```typescript
// FIXED: Brand colors - requires design approval to change
```

**`// REAL:`** - Production-ready code (may be commented out)
```typescript
// REAL: Uncomment when API Gateway is deployed
// const response = await fetch(...);
```

**`// REQUIRES:`** - Lists prerequisites
```typescript
// REQUIRES: DynamoDB table 'enviroguard-stations'
// REQUIRES: IAM policy: dynamodb:Query
```

## 🗂️ File Naming Conventions

### Screens
- `XyzScreen.tsx` - Full screen component
- Located in `src/screens/{feature}/`
- Exports single default component

### Components
- `Xyz.tsx` - Reusable component
- Located in `src/components/{atoms|molecules|feature}/`
- Exports named component

### Services
- `xyzService.ts` - API client or service
- Exports class or functions
- Contains fake→real transition code

### Data
- `xyz.json` - Fake data file
- Located in `src/data/fake/`
- Includes comment header explaining real source

## 🔄 Migration Workflow

### For Each API Endpoint

**Step 1:** Deploy backend
```bash
# Create API Gateway endpoint
# Create Lambda function
# Create DynamoDB table
# Test endpoint returns data
```

**Step 2:** Update .env
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
EXPO_PUBLIC_ENABLE_FAKE_DATA=false
```

**Step 3:** Update service file
```typescript
// Remove this:
// FAKE-DATA START
if (ENV.enableFakeData) {
  return require('@/data/fake/data.json');
}
// FAKE-DATA END

// Uncomment this:
const response = await fetch(`${ENV.apiBaseUrl}/endpoint`);
return response.json();
```

**Step 4:** Test
```bash
npm start
# Navigate to relevant screen
# Verify real data loads
```

**Step 5:** Clean up
```bash
# Delete fake data file
rm src/data/fake/xyz.json

# Update README status table
# Mark component as ✅ REAL
```

## 🎨 Component Documentation

### Every Component Should Have:

1. **JSDoc comment block**
```typescript
/**
 * Component Name
 * Brief description of what it does
 * 
 * @fixed Property that cannot change
 * @changeable Property that can be customized
 * 
 * @example
 * <ComponentName prop="value" />
 */
```

2. **Props interface** with descriptions
```typescript
interface Props {
  /** Current severity level (1-5) */
  severity: SeverityLevel;
  /** Optional click handler */
  onPress?: () => void;
}
```

3. **Inline comments** for non-obvious logic
```typescript
// WHY: Using tabular-nums prevents layout shift when numbers change
fontVariant: ['tabular-nums']
```

## 🧪 Testing Strategy

### Manual Testing Checklist
- [ ] All tabs render without crashing
- [ ] Navigation between screens works
- [ ] Camera picker opens (requires device/simulator)
- [ ] Claude API calls return results (if API key set)
- [ ] Fake data displays correctly
- [ ] Empty states show when appropriate
- [ ] Loading states show during async operations

### Unit Testing (Future)
- Component rendering tests
- Service layer tests with mocked fetch
- Utility function tests

### Integration Testing (Future)
- Navigation flow tests
- API integration tests with real backend
- Claude API integration tests

## 🚀 Performance Considerations

### Current State
- No optimization done
- All images are placeholders
- No code splitting
- No bundle size optimization

### Future Optimizations
- Image compression and lazy loading
- Code splitting by route
- Memoization for expensive computations
- FlatList optimization for large lists
- React Query caching strategies

## 🔐 Security Considerations

### Current State
- API key stored in env (client-side)
- No authentication
- No input validation
- No rate limiting

### Production Requirements
- Move sensitive operations to backend
- Implement JWT/Cognito auth
- Add input validation
- Add rate limiting
- Secure storage for tokens (expo-secure-store)

## 📊 AWS Architecture (Future)

```
┌─────────────┐
│ React Native│
│     App     │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   API Gateway│
│  (REST API) │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Lambda    │────→│  DynamoDB   │
│  Functions  │     │   Tables    │
└──────┬──────┘     └─────────────┘
       │
       │ Bedrock API
       ▼
┌─────────────┐
│   Claude    │
│  (Bedrock)  │
└─────────────┘
```

### DynamoDB Tables Needed
- `enviroguard-stations` - Station locations and metadata
- `enviroguard-sensor_readings` - Time-series sensor data
- `enviroguard-hazard_reports` - User-submitted reports
- `enviroguard-users` - User profiles and settings
- `enviroguard-posts` - Community posts and events
- `enviroguard-alerts` - Alert history

### Lambda Functions Needed
- `getStations` - List stations
- `getReadings` - Query sensor readings
- `predictNoise` / `predictFill` - Run Prophet forecasts
- `submitReport` - Handle report submissions
- `analyzePhoto` - Call Claude Vision via Bedrock
- `generateLetter` - Call Claude for letter generation
- `getProfile` / `updateProfile` - User CRUD

### IAM Policies Needed
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/enviroguard-*"
    },
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-*"
    }
  ]
}
```

## 🎓 Learning Resources

### React Native
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)

### AWS
- [API Gateway](https://aws.amazon.com/api-gateway/)
- [Lambda](https://aws.amazon.com/lambda/)
- [DynamoDB](https://aws.amazon.com/dynamodb/)
- [Bedrock](https://aws.amazon.com/bedrock/)

### Claude API
- [Anthropic Documentation](https://docs.anthropic.com/)
- [Claude Vision Guide](https://docs.anthropic.com/claude/docs/vision)
- [Streaming API](https://docs.anthropic.com/claude/reference/streaming)

---

**Last Updated:** 2026-05-14  
**Scaffold Version:** 1.0.0  
**Status:** Foundation Complete - Screens In Progress
