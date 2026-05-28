# EnviroGuard Backend API Specification

**Version:** 1.0  
**Last Updated:** 2026-05-21  
**Status:** Design Phase - Ready for Implementation

---

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Endpoints](#endpoints)
   - [Stations & Sensors](#1-stations--sensors)
   - [Predictions & Alerts](#2-predictions--alerts)
   - [Reports](#3-reports)
   - [Community](#4-community)
   - [Users](#5-users)
6. [ML Backend Integration](#ml-backend-integration)
7. [DynamoDB Schema Summary](#dynamodb-schema-summary)
8. [Rate Limiting](#rate-limiting)

---

## Overview

**Base URL:** `https://api.enviroguard.com/v1` (Production)  
**Base URL:** `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod` (AWS API Gateway)

**Architecture:**
```
Mobile App → API Gateway → Lambda Functions → DynamoDB
                                ↓
                          ML Backend API (Prophet models)
                                ↓
                          Bedrock (Claude Vision/Streaming)
```

**Total Endpoints:** 13  
**Authentication:** JWT tokens via AWS Cognito  
**Data Format:** JSON (application/json)

---

## Authentication

### Required Header
```http
Authorization: Bearer <jwt_token>
```

### Public Endpoints (No Auth Required)
- `GET /stations` - Public station data
- `GET /posts` - Public community feed

### Protected Endpoints (Auth Required)
All other endpoints require valid JWT token from AWS Cognito.

### Token Acquisition
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-123",
  "expiresIn": 3600
}
```

---

## Response Format

### Success Response
```json
{
  "data": { /* response data */ },
  "message": "Success message (optional)"
}
```

### Error Response
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### Pagination (for list endpoints)
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

## Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | BadRequest | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User lacks permission |
| 404 | NotFound | Resource not found |
| 409 | Conflict | Resource already exists |
| 422 | ValidationError | Request validation failed |
| 429 | RateLimitExceeded | Too many requests |
| 500 | InternalServerError | Server error |
| 503 | ServiceUnavailable | ML backend unavailable |

---

## Endpoints

---

## 1. Stations & Sensors

### 1.1 List All Stations

**Endpoint:** `GET /stations`  
**Auth:** Public  
**DynamoDB Table:** `enviroguard-stations`  
**Lambda:** `getStations`

**Description:** Returns all active sensor stations for map display.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `bbox` | string | No | Bounding box: `{minLat},{minLng},{maxLat},{maxLng}` |
| `status` | string | No | Filter by status: `active`, `inactive`, `maintenance` |

**Request Example:**
```http
GET /stations?bbox=40.7,-74.1,40.8,-73.9&status=active
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "station-001",
      "name": "Main St Station",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "address": "123 Main St, New York, NY 10001",
      "status": "active",
      "installedAt": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

### 1.2 Get Latest Sensor Readings

**Endpoint:** `GET /readings/{station_id}`  
**Auth:** Public  
**DynamoDB Table:** `enviroguard-sensor_readings`  
**Lambda:** `getReadings`

**Description:** Returns the most recent sensor readings for a station.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `station_id` | string | Yes | Station identifier |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hours` | number | No | Number of hours of historical data (default: 1, max: 24) |

**Request Example:**
```http
GET /readings/station-001?hours=6
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "reading-12345",
      "stationId": "station-001",
      "timestamp": "2026-05-21T14:30:00Z",
      "noise": {
        "db": 68.5,
        "contributors": ["traffic", "construction"]
      },
      "trash": {
        "fillPercent": 72.3,
        "severity": 3
      },
      "hazards": {
        "type": "none",
        "severity": 1
      }
    }
  ]
}
```

---

## 2. Predictions & Alerts

### 2.1 Get Environmental Predictions

**Endpoint:** `POST /predict`  
**Auth:** Required  
**ML Backend Integration:** YES - Calls Prophet models  
**Lambda:** `getPredictions`

**Description:** Returns 24-hour predictions for noise, pollen, litter, and AQI using ML models.

**Request Body:**
```json
{
  "stationId": "station-001",
  "metrics": ["noise", "pollen", "litter", "aqi"],
  "hoursAhead": 24,
  "environmentalContext": {
    "temperature": 72,
    "humidity": 60,
    "windSpeed": 8,
    "grassPollen": 25,
    "treePollen": 15,
    "weedPollen": 5
  }
}
```

**ML Backend Call:**
```python
# Lambda calls enviroguard-ml unified_api.py
predictor = EnvironmentalPredictor(mode='api')
predictions = predictor.predict_all(
    hours_ahead=24,
    temperature=72,
    humidity=60,
    wind_speed=8,
    complaint_count=3,
    grass_pollen=25,
    tree_pollen=15,
    weed_pollen=5
)
```

**Response (200 OK):**
```json
{
  "data": {
    "stationId": "station-001",
    "generatedAt": "2026-05-21T14:30:00Z",
    "predictions": {
      "noise": {
        "forecast": [
          {
            "hour": "2026-05-21T15:00:00Z",
            "predicted": 68.5,
            "confidence": 0.92,
            "min": 62.1,
            "max": 74.9
          }
          // ... 23 more hours
        ],
        "summary": {
          "peakHour": "2026-05-21T18:00:00Z",
          "peakValue": 78.2,
          "avgValue": 69.3
        },
        "accuracy": 96.7
      },
      "pollen": {
        "forecast": [ /* similar structure */ ],
        "summary": { /* similar structure */ },
        "accuracy": 85.8
      },
      "litter": {
        "forecast": [ /* similar structure */ ],
        "summary": { /* similar structure */ },
        "accuracy": 78.8
      },
      "aqi": {
        "forecast": [ /* similar structure */ ],
        "summary": { /* similar structure */ },
        "accuracy": 59.2
      }
    },
    "compositeRisk": {
      "score": 67.5,
      "level": "medium",
      "primaryConcern": "noise"
    }
  }
}
```

**Error Response (503):**
```json
{
  "error": "ServiceUnavailable",
  "message": "ML backend is currently unavailable. Please try again later.",
  "statusCode": 503
}
```

---

### 2.2 Get User Alert History

**Endpoint:** `GET /alerts`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-alerts`  
**Lambda:** `getAlerts`

**Description:** Returns alert history for authenticated user.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20, max: 100) |
| `resolved` | boolean | No | Filter by resolved status |
| `startDate` | string | No | ISO 8601 date (e.g., `2026-05-01T00:00:00Z`) |

**Request Example:**
```http
GET /alerts?page=1&limit=20&resolved=false
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "alert-12345",
      "userId": "user-123",
      "timestamp": "2026-05-21T14:30:00Z",
      "type": "noise",
      "severity": "high",
      "station": {
        "id": "station-001",
        "name": "Main St Station"
      },
      "message": "Noise level exceeds your threshold of 70 dB. Current: 78 dB.",
      "actionTaken": "notification_sent",
      "resolved": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "hasMore": true
  }
}
```

---

### 2.3 Create Manual Alert

**Endpoint:** `POST /alerts`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-alerts`  
**Lambda:** `createAlert`

**Description:** Creates a manual alert subscription for a specific station/metric.

**Request Body:**
```json
{
  "stationId": "station-001",
  "type": "noise",
  "threshold": 70,
  "notificationMethod": "push"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "alert-subscription-456",
    "userId": "user-123",
    "stationId": "station-001",
    "type": "noise",
    "threshold": 70,
    "active": true,
    "createdAt": "2026-05-21T14:30:00Z"
  },
  "message": "Alert subscription created successfully"
}
```

---

## 3. Reports

### 3.1 Get Nearby Reports

**Endpoint:** `GET /reports`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-hazard_reports`  
**Lambda:** `getReports`

**Description:** Returns hazard reports near a location.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lng` | number | Yes | Longitude |
| `radius` | number | No | Search radius in meters (default: 1000, max: 5000) |
| `status` | string | No | Filter by status: `pending`, `verified`, `resolved` |
| `type` | string | No | Filter by type: `air_pollution`, `water_contamination`, etc. |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20) |

**Request Example:**
```http
GET /reports?lat=40.7128&lng=-74.0060&radius=500&status=verified
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "report-12345",
      "userId": "user-123",
      "type": "air_pollution",
      "title": "Smoke from construction site",
      "description": "Heavy smoke visible from nearby construction",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "address": "456 Park Ave, New York, NY",
      "photos": [
        "https://s3.amazonaws.com/enviroguard/photos/photo1.jpg"
      ],
      "createdAt": "2026-05-21T10:00:00Z",
      "status": "verified",
      "severity": 3,
      "claudeAnalysis": {
        "type": "air_pollution",
        "severity": 3,
        "description": "Image shows visible smoke emissions from active construction. Moderate air quality concern.",
        "confidence": 0.87
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "hasMore": false
  }
}
```

---

### 3.2 Submit New Report

**Endpoint:** `POST /reports`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-hazard_reports`  
**Lambda:** `submitReport`  
**Bedrock Integration:** YES - Claude Vision for photo analysis

**Description:** Submits a new hazard report with optional photo analysis via Claude Vision.

**Request Body (multipart/form-data):**
```
POST /reports
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "type": "air_pollution",
  "title": "Smoke from construction site",
  "description": "Heavy smoke visible",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "456 Park Ave, New York, NY",
  "photo": <file>
}
```

**Lambda Processing:**
1. Upload photo to S3
2. Call Bedrock Claude Vision API for analysis
3. Store report in DynamoDB with Claude analysis
4. Return report with AI insights

**Claude Vision Call:**
```python
# Inside Lambda
import boto3
bedrock = boto3.client('bedrock-runtime')

response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1024,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {"type": "base64", "data": base64_image}
                },
                {
                    "type": "text",
                    "text": "Analyze this environmental hazard photo. Identify the type (air_pollution, water_contamination, hazardous_waste, noise_pollution, other), severity (1-5), and provide a brief description."
                }
            ]
        }]
    })
)
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "report-12345",
    "userId": "user-123",
    "type": "air_pollution",
    "title": "Smoke from construction site",
    "description": "Heavy smoke visible",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "address": "456 Park Ave, New York, NY",
    "photos": [
      "https://s3.amazonaws.com/enviroguard/photos/report-12345-1.jpg"
    ],
    "createdAt": "2026-05-21T14:30:00Z",
    "status": "pending",
    "severity": 3,
    "claudeAnalysis": {
      "type": "air_pollution",
      "severity": 3,
      "description": "Image shows visible smoke emissions from active construction. Moderate air quality concern. Appears to be dust and particulate matter from demolition activities.",
      "confidence": 0.87
    }
  },
  "message": "Report submitted successfully. AI analysis completed."
}
```

---

### 3.3 Get Report Details

**Endpoint:** `GET /reports/{report_id}`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-hazard_reports`  
**Lambda:** `getReportDetails`

**Description:** Returns full details for a specific report.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `report_id` | string | Yes | Report identifier |

**Request Example:**
```http
GET /reports/report-12345
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "id": "report-12345",
    "userId": "user-123",
    "userName": "John Doe",
    "type": "air_pollution",
    "title": "Smoke from construction site",
    "description": "Heavy smoke visible from nearby construction",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "address": "456 Park Ave, New York, NY",
    "photos": [
      "https://s3.amazonaws.com/enviroguard/photos/report-12345-1.jpg"
    ],
    "createdAt": "2026-05-21T10:00:00Z",
    "updatedAt": "2026-05-21T12:00:00Z",
    "status": "verified",
    "severity": 3,
    "claudeAnalysis": {
      "type": "air_pollution",
      "severity": 3,
      "description": "Image shows visible smoke emissions from active construction. Moderate air quality concern.",
      "confidence": 0.87
    },
    "comments": [
      {
        "userId": "user-456",
        "userName": "Jane Smith",
        "comment": "I noticed this too! Thanks for reporting.",
        "createdAt": "2026-05-21T11:00:00Z"
      }
    ]
  }
}
```

---

## 4. Community

### 4.1 Get Community Feed

**Endpoint:** `GET /posts`  
**Auth:** Public  
**DynamoDB Table:** `enviroguard-posts`  
**Lambda:** `getPosts`

**Description:** Returns community posts and events near a location.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `lat` | number | No | Latitude (for location-based feed) |
| `lng` | number | No | Longitude (for location-based feed) |
| `type` | string | No | Filter by type: `post`, `event` |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Results per page (default: 20) |

**Request Example:**
```http
GET /posts?lat=40.7128&lng=-74.0060&page=1&limit=20
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "post-12345",
      "type": "post",
      "userId": "user-123",
      "userName": "John Doe",
      "userAvatar": "https://s3.amazonaws.com/enviroguard/avatars/user-123.jpg",
      "content": "Great to see our neighborhood air quality improving!",
      "images": [],
      "createdAt": "2026-05-21T10:00:00Z",
      "likes": 15,
      "commentsCount": 3
    },
    {
      "id": "event-67890",
      "type": "event",
      "userId": "user-456",
      "userName": "Jane Smith",
      "userAvatar": "https://s3.amazonaws.com/enviroguard/avatars/user-456.jpg",
      "content": "Community cleanup this Saturday!",
      "eventDate": "2026-05-25T10:00:00Z",
      "eventLocation": "Central Park",
      "attendees": 24,
      "createdAt": "2026-05-20T14:00:00Z",
      "likes": 32,
      "commentsCount": 8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 87,
    "hasMore": true
  }
}
```

---

### 4.2 Create Post or Event

**Endpoint:** `POST /posts`  
**Auth:** Required  
**DynamoDB Table:** `enviroguard-posts`  
**Lambda:** `createPost`

**Description:** Creates a new community post or event.

**Request Body:**
```json
{
  "type": "event",
  "content": "Community cleanup this Saturday! Bring gloves and bags.",
  "eventDate": "2026-05-25T10:00:00Z",
  "eventLocation": "Central Park, NY"
}
```

**Response (201 Created):**
```json
{
  "data": {
    "id": "event-67890",
    "type": "event",
    "userId": "user-456",
    "userName": "Jane Smith",
    "userAvatar": "https://s3.amazonaws.com/enviroguard/avatars/user-456.jpg",
    "content": "Community cleanup this Saturday! Bring gloves and bags.",
    "eventDate": "2026-05-25T10:00:00Z",
    "eventLocation": "Central Park, NY",
    "attendees": 0,
    "createdAt": "2026-05-21T14:30:00Z",
    "likes": 0,
    "commentsCount": 0
  },
  "message": "Post created successfully"
}
```

---

### 4.3 Generate Advocacy Letter

**Endpoint:** `POST /generate-letter`  
**Auth:** Required  
**Bedrock Integration:** YES - Claude Streaming for letter generation  
**Lambda:** `generateLetter`

**Description:** Generates an advocacy letter using Claude AI based on sensor data and location.

**Request Body:**
```json
{
  "stationId": "station-001",
  "recipient": "NYC Department of Environmental Protection",
  "concernType": "noise_pollution",
  "userContext": {
    "healthConditions": ["asthma", "sleep disorder"],
    "residentialAddress": "123 Main St, New York, NY"
  }
}
```

**Lambda Processing:**
1. Fetch recent sensor readings for station
2. Call Bedrock Claude Streaming API
3. Stream response back to client

**Claude Streaming Call:**
```python
# Inside Lambda - Streaming response
bedrock = boto3.client('bedrock-runtime')

prompt = f"""Generate a professional advocacy letter to {recipient} addressing {concernType} 
based on the following sensor data:
- Station: {station_name}
- Location: {address}
- Recent noise levels: {readings}
- User health concerns: {health_conditions}

The letter should be formal, cite specific data, and request action."""

response = bedrock.invoke_model_with_response_stream(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 2048,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    })
)

# Stream chunks back to client
for event in response['body']:
    chunk = json.loads(event['chunk']['bytes'])
    yield chunk
```

**Response (200 OK - Server-Sent Events):**
```
Content-Type: text/event-stream

data: {"type": "content_block_delta", "delta": {"text": "Dear NYC Department"}}
data: {"type": "content_block_delta", "delta": {"text": " of Environmental Protection,\n\n"}}
data: {"type": "content_block_delta", "delta": {"text": "I am writing to express"}}
...
data: {"type": "message_stop"}
```

---

## 5. Users

### 5.1 Get User Profile

**Endpoint:** `GET /users/{user_id}`  
**Auth:** Required (must match user_id or admin)  
**DynamoDB Table:** `enviroguard-users`  
**Lambda:** `getUserProfile`

**Description:** Returns user profile with health settings and alert thresholds.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User identifier (or `me` for authenticated user) |

**Request Example:**
```http
GET /users/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "data": {
    "userId": "user-123",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "avatar": "https://s3.amazonaws.com/enviroguard/avatars/user-123.jpg",
    "healthConditions": ["asthma", "COPD"],
    "alertThresholds": {
      "noisedB": 70,
      "binFillPercent": 80,
      "hazardRadiusM": 500
    },
    "savedLocations": [
      {
        "type": "Home",
        "address": "123 Main St, New York, NY 10001",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        }
      },
      {
        "type": "Work",
        "address": "456 Park Ave, New York, NY 10022",
        "coordinates": {
          "latitude": 40.7614,
          "longitude": -73.9776
        }
      }
    ],
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedAt": "2026-05-21T14:30:00Z"
  }
}
```

---

### 5.2 Update User Profile

**Endpoint:** `PUT /users/{user_id}`  
**Auth:** Required (must match user_id)  
**DynamoDB Table:** `enviroguard-users`  
**Lambda:** `updateUserProfile`

**Description:** Updates user profile settings.

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `user_id` | string | Yes | User identifier (or `me` for authenticated user) |

**Request Body:**
```json
{
  "name": "John Doe",
  "healthConditions": ["asthma", "COPD", "allergies"],
  "alertThresholds": {
    "noisedB": 65,
    "binFillPercent": 75,
    "hazardRadiusM": 1000
  },
  "savedLocations": [
    {
      "type": "Home",
      "address": "123 Main St, New York, NY 10001",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      }
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "data": {
    "userId": "user-123",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "healthConditions": ["asthma", "COPD", "allergies"],
    "alertThresholds": {
      "noisedB": 65,
      "binFillPercent": 75,
      "hazardRadiusM": 1000
    },
    "savedLocations": [
      {
        "type": "Home",
        "address": "123 Main St, New York, NY 10001",
        "coordinates": {
          "latitude": 40.7128,
          "longitude": -74.0060
        }
      }
    ],
    "updatedAt": "2026-05-21T14:35:00Z"
  },
  "message": "Profile updated successfully"
}
```

---

## ML Backend Integration

### ML API Connection

**ML Backend URL:** `http://<ec2-ip>:8000` (or internal VPC endpoint)  
**Lambda Environment Variable:** `ML_API_URL`

### Available ML Models

| Model | Endpoint | Accuracy | Status |
|-------|----------|----------|--------|
| Noise | `/predict-noise` | 96.7% | ✅ Production |
| Pollen | `/predict-pollen` | 85.8% | ✅ Production |
| Litter | `/predict-litter` | 78.8% | ✅ Production |
| AQI | `/predict-aqi` | 59.2% | ⚠️ Below target (usable) |

### Unified Prediction Call

**From Lambda:**
```python
import requests

ML_API_URL = os.environ['ML_API_URL']

response = requests.post(
    f"{ML_API_URL}/predict",
    json={
        "hours_ahead": 24,
        "temperature": 72,
        "humidity": 60,
        "wind_speed": 8,
        "complaint_count": 3,
        "grass_pollen": 25,
        "tree_pollen": 15,
        "weed_pollen": 5
    },
    timeout=10
)

predictions = response.json()
```

### Error Handling

```python
try:
    response = requests.post(ML_API_URL, json=data, timeout=10)
    response.raise_for_status()
    return response.json()
except requests.Timeout:
    return {"error": "ML backend timeout", "statusCode": 504}
except requests.RequestException as e:
    return {"error": "ML backend unavailable", "statusCode": 503}
```

---

## DynamoDB Schema Summary

### 1. enviroguard-stations
```
Partition Key: id (String)
Attributes:
  - name (String)
  - location (Map: {latitude: Number, longitude: Number})
  - address (String)
  - status (String)
  - installedAt (String)

Indexes:
  - GSI1: status-installedAt-index
```

### 2. enviroguard-sensor_readings
```
Partition Key: stationId (String)
Sort Key: timestamp (String)
Attributes:
  - id (String)
  - noise (Map)
  - trash (Map)
  - hazards (Map)

Indexes:
  - GSI1: timestamp-index (for time-range queries)
TTL: 90 days
```

### 3. enviroguard-hazard_reports
```
Partition Key: id (String)
Sort Key: createdAt (String)
Attributes:
  - userId (String)
  - type (String)
  - title (String)
  - description (String)
  - location (Map)
  - photos (List<String>)
  - status (String)
  - severity (Number)
  - claudeAnalysis (Map)

Indexes:
  - GSI1: location-index (for geo queries)
  - GSI2: userId-createdAt-index
  - GSI3: status-createdAt-index
```

### 4. enviroguard-users
```
Partition Key: userId (String)
Attributes:
  - email (String)
  - name (String)
  - avatar (String)
  - healthConditions (List<String>)
  - alertThresholds (Map)
  - savedLocations (List<Map>)
  - createdAt (String)
  - updatedAt (String)

Indexes:
  - GSI1: email-index (for login lookup)
```

### 5. enviroguard-posts
```
Partition Key: id (String)
Sort Key: createdAt (String)
Attributes:
  - type (String)
  - userId (String)
  - content (String)
  - eventDate (String)
  - eventLocation (String)
  - likes (Number)
  - commentsCount (Number)

Indexes:
  - GSI1: type-createdAt-index
  - GSI2: userId-createdAt-index
```

### 6. enviroguard-alerts
```
Partition Key: userId (String)
Sort Key: timestamp (String)
Attributes:
  - id (String)
  - type (String)
  - severity (String)
  - stationId (String)
  - message (String)
  - resolved (Boolean)
  - actionTaken (String)

Indexes:
  - GSI1: resolved-timestamp-index
TTL: 30 days
```

---

## Rate Limiting

### Default Limits (Per API Key)
- **Authenticated endpoints:** 1000 requests/hour
- **Public endpoints:** 100 requests/hour
- **ML prediction endpoints:** 50 requests/hour (computationally expensive)
- **Claude endpoints (photo/letter):** 20 requests/hour (high cost)

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1621436400
```

### Rate Limit Exceeded Response
```json
{
  "error": "RateLimitExceeded",
  "message": "You have exceeded your rate limit. Please try again in 15 minutes.",
  "statusCode": 429,
  "retryAfter": 900
}
```

---

## CORS Configuration

### Allowed Origins
- Production: `https://enviroguard.app`
- Development: `http://localhost:*`
- Expo: `exp://192.168.*`

### Allowed Headers
```
Authorization
Content-Type
X-Requested-With
```

### Allowed Methods
```
GET, POST, PUT, DELETE, OPTIONS
```

---

## Implementation Checklist

### Phase 1: Infrastructure Setup
- [ ] Create API Gateway REST API
- [ ] Set up AWS Lambda function templates
- [ ] Create DynamoDB tables with indexes
- [ ] Configure IAM roles and policies
- [ ] Set up CloudWatch logging

### Phase 2: Core Endpoints
- [ ] Implement GET /stations
- [ ] Implement GET /readings/{station_id}
- [ ] Implement GET /users/{user_id}
- [ ] Implement PUT /users/{user_id}
- [ ] Test with mobile app

### Phase 3: ML Integration
- [ ] Deploy ML backend to EC2
- [ ] Implement POST /predict endpoint
- [ ] Configure Lambda → ML API connection
- [ ] Test predictions with real data

### Phase 4: Claude Integration
- [ ] Configure Bedrock access
- [ ] Implement POST /reports (with Vision)
- [ ] Implement POST /generate-letter (with Streaming)
- [ ] Test Claude API calls

### Phase 5: Community Features
- [ ] Implement GET /reports
- [ ] Implement GET /posts
- [ ] Implement POST /posts
- [ ] Implement GET /alerts
- [ ] Implement POST /alerts

### Phase 6: Production Readiness
- [ ] Add authentication (Cognito)
- [ ] Configure rate limiting
- [ ] Add request validation
- [ ] Set up monitoring and alarms
- [ ] Load testing
- [ ] Security audit

---

## Notes for Developers

### Lambda Function Structure
```
enviroguard-backend/
├── lambdas/
│   ├── getStations/
│   │   ├── index.js
│   │   └── package.json
│   ├── getReadings/
│   ├── getPredictions/
│   ├── submitReport/
│   └── ... (9 more)
├── shared/
│   ├── dynamodb-client.js
│   ├── ml-client.js
│   └── bedrock-client.js
└── infrastructure/
    ├── cloudformation.yaml
    └── terraform/ (if using Terraform)
```

### Environment Variables (per Lambda)
```bash
ML_API_URL=http://<ec2-ip>:8000
DYNAMO_TABLE_STATIONS=enviroguard-stations
DYNAMO_TABLE_READINGS=enviroguard-sensor_readings
DYNAMO_TABLE_REPORTS=enviroguard-hazard_reports
DYNAMO_TABLE_USERS=enviroguard-users
DYNAMO_TABLE_POSTS=enviroguard-posts
DYNAMO_TABLE_ALERTS=enviroguard-alerts
S3_BUCKET_PHOTOS=enviroguard-photos
AWS_REGION=us-east-1
```

### Testing Strategy
1. **Unit tests:** Test Lambda functions in isolation
2. **Integration tests:** Test Lambda → DynamoDB/ML API
3. **E2E tests:** Test mobile app → API Gateway → Lambda
4. **Load tests:** Apache JMeter or Artillery

---

**Last Updated:** 2026-05-21  
**Status:** ✅ Ready for Implementation  
**Next Step:** Create Lambda function templates (Task 3)
