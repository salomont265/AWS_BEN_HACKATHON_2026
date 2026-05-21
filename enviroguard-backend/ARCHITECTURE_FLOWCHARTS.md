# EnviroGuard Architecture Flowcharts

Visual diagrams explaining the system architecture and data flows.

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "Mobile App Layer"
        A[React Native App<br/>enviroguard/]
    end
    
    subgraph "API Layer"
        B[API Gateway<br/>https://api.enviroguard.com]
    end
    
    subgraph "Compute Layer - Lambda Functions"
        C1[getStations]
        C2[getPredictions]
        C3[submitReport]
        C4[getReports]
        C5[generateLetter]
        C6[getUserProfile]
        C7[... 7 more]
    end
    
    subgraph "Data Layer"
        D1[(DynamoDB<br/>6 Tables)]
        D2[S3<br/>Photo Storage]
    end
    
    subgraph "External Services"
        E1[ML Backend<br/>Prophet Models<br/>EC2]
        E2[Bedrock<br/>Claude AI]
    end
    
    A -->|HTTPS Requests| B
    B -->|Route| C1
    B -->|Route| C2
    B -->|Route| C3
    B -->|Route| C4
    B -->|Route| C5
    B -->|Route| C6
    B -->|Route| C7
    
    C1 -->|Query| D1
    C2 -->|HTTP| E1
    C3 -->|Store| D2
    C3 -->|Analyze| E2
    C3 -->|Save| D1
    C4 -->|Query| D1
    C5 -->|Generate| E2
    C6 -->|Query| D1
    C7 -->|CRUD| D1
    
    style A fill:#e1f5ff
    style B fill:#ffe1f5
    style C2 fill:#fff4e1
    style C3 fill:#fff4e1
    style D1 fill:#e1ffe1
    style E1 fill:#ffe1e1
    style E2 fill:#ffe1e1
```

---

## 2. Request Flow: GET /stations

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Gateway as API Gateway
    participant Lambda as getStations Lambda
    participant DynamoDB as DynamoDB
    
    App->>Gateway: GET /stations?status=active
    Note over App,Gateway: HTTP Request
    
    Gateway->>Gateway: Check CORS
    Gateway->>Gateway: Rate Limit Check
    
    Gateway->>Lambda: Invoke function
    Note over Gateway,Lambda: Event: {queryStringParameters}
    
    Lambda->>Lambda: Parse query params
    Lambda->>Lambda: Build DynamoDB query
    
    Lambda->>DynamoDB: Scan(TableName, FilterExpression)
    Note over Lambda,DynamoDB: Query: status = 'active'
    
    DynamoDB-->>Lambda: Items[]
    Note over DynamoDB,Lambda: Result: 5 stations
    
    Lambda->>Lambda: Format response
    Lambda->>Lambda: Add CORS headers
    
    Lambda-->>Gateway: {statusCode: 200, body: {...}}
    Gateway-->>App: JSON Response
    
    Note over App: Display stations on map
```

**Time: ~100-300ms**

---

## 3. Request Flow: POST /predict (ML Integration)

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Gateway as API Gateway
    participant Lambda as getPredictions Lambda
    participant ML as ML Backend (EC2)
    
    App->>Gateway: POST /predict
    Note over App,Gateway: Body: {stationId, hoursAhead, context}
    
    Gateway->>Gateway: Validate JWT token
    Gateway->>Lambda: Invoke function
    
    Lambda->>Lambda: Parse request body
    Lambda->>Lambda: Validate stationId
    
    Lambda->>ML: HTTP POST /predict
    Note over Lambda,ML: Data: {temperature, humidity, etc}
    
    alt ML Backend Available
        ML->>ML: Run Prophet models
        Note over ML: 4 models:<br/>Noise (96.7%)<br/>Pollen (85.8%)<br/>Litter (78.8%)<br/>AQI (59.2%)
        
        ML-->>Lambda: Predictions JSON
        Lambda->>Lambda: Calculate composite risk
        Lambda-->>Gateway: Success response
        Gateway-->>App: Predictions + risk score
        
    else ML Backend Timeout/Error
        ML--xLambda: Timeout (10s)
        Lambda->>Lambda: Log error
        Lambda-->>Gateway: 503 Service Unavailable
        Gateway-->>App: Error response
        Note over App: Show cached data<br/>or error message
    end
```

**Time: ~2-10 seconds** (ML computation is expensive)

---

## 4. Request Flow: POST /reports (Photo + Claude Vision)

```mermaid
flowchart TD
    A[Mobile App] -->|POST /reports<br/>with photo| B{API Gateway}
    B -->|Validate JWT| C[submitReport Lambda]
    
    C --> D{Parse Request}
    D -->|Extract| E[Photo base64<br/>Location<br/>Type<br/>Description]
    
    E --> F[Generate UUID<br/>reportId = abc-123]
    
    F --> G[Upload to S3]
    G -->|PUT Object| H[S3 Bucket<br/>reports/abc-123/photo.jpg]
    H -->|Return URL| I[Photo URL saved]
    
    I --> J[Call Bedrock Claude Vision]
    J -->|Send base64 image<br/>+ prompt| K{Bedrock}
    
    K --> L[Claude analyzes photo]
    L --> M{Claude Response}
    
    M -->|Success| N[Parse JSON response<br/>type, severity,<br/>description, confidence]
    M -->|Failure| O[Use defaults<br/>type: unknown<br/>severity: 0]
    
    N --> P[Create Report Object]
    O --> P
    
    P --> Q{Store in DynamoDB}
    Q -->|PutItem| R[(hazard_reports table)]
    
    R -->|Success| S[Return 201 Created]
    S --> T[App shows report<br/>with AI analysis]
    
    Q -->|Failure| U[Return 500 Error]
    U --> V[App shows error]
    
    style G fill:#ffe1e1
    style K fill:#ffe1e1
    style R fill:#e1ffe1
    style S fill:#e1f5ff
```

**Time: ~3-8 seconds** (Claude Vision analysis takes time)

---

## 5. Database Structure (DynamoDB Tables)

```mermaid
graph LR
    subgraph "DynamoDB Tables"
        T1[(stations<br/>PK: id)]
        T2[(sensor_readings<br/>PK: stationId<br/>SK: timestamp<br/>TTL: 90d)]
        T3[(hazard_reports<br/>PK: id<br/>SK: createdAt)]
        T4[(users<br/>PK: userId)]
        T5[(posts<br/>PK: id<br/>SK: createdAt)]
        T6[(alerts<br/>PK: userId<br/>SK: timestamp<br/>TTL: 30d)]
    end
    
    subgraph "Global Secondary Indexes"
        G1[status-installedAt-index]
        G2[timestamp-index]
        G3[userId-createdAt-index]
        G4[status-createdAt-index]
        G5[email-index]
        G6[type-createdAt-index]
        G7[userId-createdAt-index]
        G8[resolved-timestamp-index]
    end
    
    T1 -.->|GSI| G1
    T2 -.->|GSI| G2
    T3 -.->|GSI| G3
    T3 -.->|GSI| G4
    T4 -.->|GSI| G5
    T5 -.->|GSI| G6
    T5 -.->|GSI| G7
    T6 -.->|GSI| G8
    
    style T2 fill:#ffe1e1
    style T6 fill:#ffe1e1
    style T4 fill:#fff4e1
```

**Note:** Red = TTL enabled, Yellow = Contains PII

---

## 6. Lambda Function Internal Flow

```mermaid
flowchart TD
    A[API Gateway invokes Lambda] --> B[exports.handler receives event]
    
    B --> C{Parse Input}
    C -->|Query params| D1[event.queryStringParameters]
    C -->|Body| D2[JSON.parse event.body]
    C -->|Path params| D3[event.pathParameters]
    C -->|Headers| D4[event.headers]
    
    D1 --> E{Validate Input}
    D2 --> E
    D3 --> E
    D4 --> E
    
    E -->|Invalid| F[Return 400 Bad Request]
    E -->|Valid| G[Process Request]
    
    G --> H{What operation?}
    
    H -->|Database| I[DynamoDB Query/Scan/Put]
    H -->|External API| J[HTTP Request to ML/Claude]
    H -->|File| K[S3 Upload/Download]
    
    I --> L{Success?}
    J --> L
    K --> L
    
    L -->|Yes| M[Format Response]
    L -->|No| N[Handle Error]
    
    M --> O[Add CORS Headers]
    N --> P[Log Error]
    P --> Q[Format Error Response]
    
    O --> R[Return 200/201]
    Q --> S[Return 400/500/503]
    
    R --> T[API Gateway returns to App]
    S --> T
    
    style F fill:#ffe1e1
    style S fill:#ffe1e1
    style R fill:#e1ffe1
```

---

## 7. CloudFormation Deployment Flow

```mermaid
flowchart TD
    A[Developer runs:<br/>aws cloudformation create-stack] --> B[CloudFormation receives template]
    
    B --> C{Parse YAML}
    C --> D[Extract Parameters<br/>Environment, BillingMode]
    
    D --> E[Build dependency graph]
    E --> F{What resources to create?}
    
    F --> G1[Create stations table]
    F --> G2[Create sensor_readings table]
    F --> G3[Create hazard_reports table]
    F --> G4[Create users table]
    F --> G5[Create posts table]
    F --> G6[Create alerts table]
    
    G1 --> H1{Create GSI:<br/>status-installedAt-index}
    G2 --> H2{Create GSI:<br/>timestamp-index}
    G3 --> H3{Create GSIs:<br/>userId, status}
    G4 --> H4{Create GSI:<br/>email-index}
    G5 --> H5{Create GSIs:<br/>type, userId}
    G6 --> H6{Create GSI:<br/>resolved-timestamp}
    
    H1 --> I[Configure TTL]
    H2 --> I
    H3 --> I
    H4 --> I
    H5 --> I
    H6 --> I
    
    I --> J{All resources created?}
    
    J -->|Yes| K[Stack Status:<br/>CREATE_COMPLETE]
    J -->|No| L[Stack Status:<br/>CREATE_FAILED]
    
    K --> M[Export Outputs<br/>Table names, ARNs]
    L --> N[Rollback<br/>Delete partial resources]
    
    M --> O[Ready for Lambda integration]
    N --> P[Fix template and retry]
    
    style K fill:#e1ffe1
    style L fill:#ffe1e1
    style O fill:#e1f5ff
```

**Time: ~5 minutes** to create all 6 tables + indexes

---

## 8. Authentication Flow (Future)

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant Cognito as AWS Cognito
    participant Gateway as API Gateway
    participant Lambda as Lambda Function
    participant DB as DynamoDB
    
    App->>App: User enters email/password
    App->>Cognito: Login request
    
    Cognito->>Cognito: Verify credentials
    
    alt Valid credentials
        Cognito-->>App: JWT Token
        Note over Cognito,App: Token expires in 1 hour
        
        App->>Gateway: GET /users/me<br/>Header: Authorization: Bearer <token>
        
        Gateway->>Gateway: Validate JWT signature
        Gateway->>Gateway: Extract userId from token
        
        Gateway->>Lambda: Invoke with userId in context
        Note over Gateway,Lambda: requestContext.authorizer.claims.sub
        
        Lambda->>DB: Query users table
        DB-->>Lambda: User profile
        Lambda-->>Gateway: User data
        Gateway-->>App: User profile
        
    else Invalid credentials
        Cognito-->>App: 401 Unauthorized
        App->>App: Show login error
    end
```

---

## 9. Error Handling Flow

```mermaid
flowchart TD
    A[Request arrives] --> B{Input validation}
    
    B -->|Invalid| C[Return 400<br/>BadRequest]
    B -->|Valid| D{Auth check}
    
    D -->|No token| E[Return 401<br/>Unauthorized]
    D -->|Valid token| F{Rate limit check}
    
    F -->|Exceeded| G[Return 429<br/>RateLimitExceeded]
    F -->|OK| H[Process request]
    
    H --> I{DynamoDB operation}
    
    I -->|Table not found| J[Return 500<br/>InternalServerError]
    I -->|Access denied| K[Return 403<br/>Forbidden]
    I -->|Success| L{ML/Claude API?}
    
    L -->|Timeout| M[Return 503<br/>ServiceUnavailable]
    L -->|Success| N[Return 200/201<br/>Success]
    L -->|Not needed| N
    
    style C fill:#ffe1e1
    style E fill:#ffe1e1
    style G fill:#ffd4e1
    style J fill:#ffe1e1
    style K fill:#ffe1e1
    style M fill:#ffd4e1
    style N fill:#e1ffe1
```

---

## 10. Data Flow: Complete User Journey

```mermaid
flowchart TB
    START[User opens app] --> A1[App loads]
    
    A1 --> B1{User logged in?}
    B1 -->|No| C1[Show login screen]
    B1 -->|Yes| D1[Load user profile<br/>GET /users/me]
    
    C1 --> C2[User logs in]
    C2 --> D1
    
    D1 --> E1[Load saved locations<br/>from profile]
    
    E1 --> F1[Display Map tab]
    F1 --> F2[GET /stations<br/>for map area]
    F2 --> F3[Show stations<br/>as markers]
    
    F3 --> G1{User clicks station}
    G1 --> G2[GET /readings/station-001]
    G2 --> G3[Show sensor data<br/>in bottom sheet]
    
    G3 --> H1{User switches to<br/>Health tab}
    H1 --> H2[POST /predict<br/>Get 24h predictions]
    H2 --> H3[Call ML Backend<br/>Prophet models]
    H3 --> H4[Display forecast<br/>timeline]
    
    H4 --> I1{Prediction > threshold?}
    I1 -->|Yes| I2[Create alert<br/>POST /alerts]
    I1 -->|No| I3[No action]
    
    I2 --> J1[Send push notification]
    I3 --> K1{User switches to<br/>Report tab}
    J1 --> K1
    
    K1 --> K2[GET /reports<br/>nearby reports]
    K2 --> K3[Display report cards]
    
    K3 --> L1{User taps<br/>+ button}
    L1 --> L2[Open camera]
    L2 --> L3[User takes photo]
    L3 --> L4[POST /reports<br/>with photo]
    
    L4 --> L5[Upload to S3]
    L5 --> L6[Claude Vision analysis]
    L6 --> L7[Store in DynamoDB]
    L7 --> L8[Show report<br/>with AI insights]
    
    L8 --> M1{User switches to<br/>Community tab}
    M1 --> M2[GET /posts<br/>community feed]
    M2 --> M3[Display posts & events]
    
    M3 --> N1{User taps<br/>Generate Letter}
    N1 --> N2[Select station<br/>& recipient]
    N2 --> N3[POST /generate-letter]
    N3 --> N4[Claude Streaming<br/>generates letter]
    N4 --> N5[User edits & exports PDF]
    
    style F3 fill:#e1f5ff
    style H4 fill:#e1ffe1
    style I2 fill:#ffd4e1
    style L8 fill:#fff4e1
    style N5 fill:#e1f5ff
```

---

## ASCII Version (For Terminal/Plain Text)

### Overall Architecture (Simplified)

```
┌─────────────────────────────────────────────────────┐
│                 Mobile App (React Native)           │
│              enviroguard/ (25% complete)            │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│              API Gateway (AWS)                      │
│         https://api.enviroguard.com/v1              │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬───────┘
   │      │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐
│ L1  ││ L2  ││ L3  ││ L4  ││ L5  ││ L6  ││ ... │  Lambda
│get  ││get  ││sub  ││get  ││gen  ││get  ││(13) │  Functions
│Stn  ││Pred ││Rpt  ││Rpts ││Ltr  ││User ││     │
└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└──┬──┘└─────┘
   │      │      │      │      │      │
   ▼      ▼      ▼      ▼      ▼      ▼
┌──────────────────────────────────────────────┐
│           DynamoDB (6 Tables)                │
│  stations, readings, reports, users,         │
│  posts, alerts                               │
└──────────────────────────────────────────────┘

   L2 ──────► ML Backend (EC2 - Prophet Models)
   L3 ──────► Bedrock (Claude Vision)
   L5 ──────► Bedrock (Claude Streaming)
```

### Request Flow Example

```
User Action                  System Response
───────────                  ───────────────

1. Open Health tab
       │
       ▼
2. Tap "Get Predictions"
       │
       ▼
3. App sends:               ┌──────────────────┐
   POST /predict            │  API Gateway     │
   {stationId: "001",       │  Receives request│
    hoursAhead: 24}         └────────┬─────────┘
       │                             │
       ▼                             ▼
4. Gateway routes           ┌──────────────────┐
   to Lambda                │ getPredictions   │
       │                    │ Lambda           │
       ▼                    └────────┬─────────┘
5. Lambda calls ML API               │
       │                             ▼
       ▼                    ┌──────────────────┐
6. ML runs 4 Prophet        │ ML Backend (EC2) │
   models                   │ - Noise: 96.7%   │
       │                    │ - Pollen: 85.8%  │
       ▼                    │ - Litter: 78.8%  │
7. Returns predictions      │ - AQI: 59.2%     │
       │                    └────────┬─────────┘
       ▼                             │
8. Lambda formats                    ▼
   response                 ┌──────────────────┐
       │                    │ Calculate        │
       ▼                    │ composite risk   │
9. Returns to app           └────────┬─────────┘
       │                             │
       ▼                             ▼
10. Display forecast        ┌──────────────────┐
    timeline with           │ Return JSON:     │
    predictions             │ {predictions,    │
                            │  compositeRisk}  │
                            └──────────────────┘

Total time: 2-10 seconds (ML computation)
```

### Database Relationships

```
┌─────────────────────┐
│   STATIONS          │
│ ─────────────────── │
│ PK: id              │◄─────┐
│ name                │      │ References
│ location            │      │
│ status              │      │
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│  SENSOR_READINGS    │      │
│ ─────────────────── │      │
│ PK: stationId       │──────┘
│ SK: timestamp       │
│ noise, trash, etc   │
│ TTL: 90 days        │
└─────────────────────┘

┌─────────────────────┐
│   USERS             │
│ ─────────────────── │
│ PK: userId          │◄─────┐
│ email               │      │
│ healthConditions    │      │
│ alertThresholds     │      │
└─────────────────────┘      │
                             │
┌─────────────────────┐      │
│   HAZARD_REPORTS    │      │ References
│ ─────────────────── │      │
│ PK: id              │      │
│ SK: createdAt       │      │
│ userId              │──────┘
│ location            │
│ photos              │
│ claudeAnalysis      │
└─────────────────────┘

┌─────────────────────┐      ┌─────────────────────┐
│   POSTS             │      │   ALERTS            │
│ ─────────────────── │      │ ─────────────────── │
│ PK: id              │      │ PK: userId          │
│ SK: createdAt       │      │ SK: timestamp       │
│ type (post/event)   │      │ type (noise/etc)    │
│ content             │      │ severity            │
│ likes               │      │ resolved            │
└─────────────────────┘      │ TTL: 30 days        │
                             └─────────────────────┘

PK = Partition Key (Hash Key)
SK = Sort Key (Range Key)
```

---

## Key Insights from Flowcharts

### 1. **Layered Architecture**
- Each layer has single responsibility
- Layers are independent (loose coupling)
- Can replace/upgrade one without affecting others

### 2. **Asynchronous Operations**
- Most operations happen in parallel
- Lambda functions are stateless
- Database queries are concurrent

### 3. **Error Handling at Every Layer**
- Input validation (early failure)
- Graceful degradation (continue without ML if it fails)
- Clear error messages (actionable for user)

### 4. **Scalability**
- API Gateway: Auto-scales
- Lambda: Auto-scales (1 to 1,000,000 concurrent)
- DynamoDB: Auto-scales (on-demand billing)

### 5. **Data Flow**
```
User Input → Validation → Processing → Storage → Response
```
Like a pipeline in physics experiments.

---

## Math/Physics Analogies

### State Transitions
```
σ(state, event) → new_state

Example:
σ(app_idle, "tap_predict_button") → fetching_predictions
σ(fetching_predictions, "ml_success") → showing_forecast
σ(fetching_predictions, "ml_timeout") → error_state
```

### Data Partitioning (DynamoDB)
```
hash(userId) mod N → partition_number

Where N = number of partitions (auto-managed by AWS)
```
Like distributing particles across detector elements.

### Lambda Parallelization
```
If n requests arrive simultaneously:
- Spawn n Lambda instances
- Process in parallel
- Merge results

Similar to parallel computing in physics simulations
```

---

**View these flowcharts on GitHub for better rendering!**
