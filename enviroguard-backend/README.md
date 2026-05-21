# EnviroGuard Backend

AWS Lambda functions and infrastructure for the EnviroGuard mobile app.

**Status:** Infrastructure Complete - Ready for Deployment  
**API Specification:** See [API_SPEC.md](API_SPEC.md)

---

## 📁 Project Structure

```
enviroguard-backend/
├── API_SPEC.md                 # Complete API documentation (13 endpoints)
├── README.md                   # This file
├── .env.example                # Environment variables template
│
├── lambdas/                    # Lambda function code
│   ├── getStations/            # ✅ GET /stations
│   │   ├── index.js
│   │   └── package.json
│   ├── getReadings/            # GET /readings/{station_id}
│   ├── getPredictions/         # ✅ POST /predict (ML integration)
│   │   ├── index.js
│   │   └── package.json
│   ├── submitReport/           # ✅ POST /reports (Claude Vision)
│   │   ├── index.js
│   │   └── package.json
│   └── generateLetter/         # POST /generate-letter (Claude Streaming)
│
├── shared/                     # Shared utilities (future)
│   ├── dynamodb-client.js
│   ├── ml-client.js
│   └── bedrock-client.js
│
└── infrastructure/             # IaC templates
    ├── iam-policy.json         # ✅ Lambda execution role policy
    ├── cloudformation.yaml     # DynamoDB + API Gateway (TODO)
    └── deploy.sh               # Deployment script (TODO)
```

---

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with credentials
- Node.js 18+ installed
- AWS account with permissions for Lambda, DynamoDB, API Gateway, S3, Bedrock

### 1. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your AWS account details
```

### 2. Deploy Lambda Functions

```bash
# Install dependencies for each Lambda
cd lambdas/getStations && npm install && cd ../..
cd lambdas/getPredictions && npm install && cd ../..
cd lambdas/submitReport && npm install && cd ../..

# Create deployment packages
cd lambdas/getStations
zip -r function.zip index.js node_modules/
aws lambda create-function \
  --function-name enviroguard-getStations \
  --runtime nodejs18.x \
  --handler index.handler \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/enviroguard-lambda-role \
  --zip-file fileb://function.zip \
  --environment Variables="{DYNAMODB_TABLE_STATIONS=enviroguard-stations,AWS_REGION=us-east-1}"

cd ../..
```

### 3. Create IAM Role

```bash
# Create IAM role with policy from infrastructure/iam-policy.json
aws iam create-role \
  --role-name enviroguard-lambda-role \
  --assume-role-policy-document file://infrastructure/trust-policy.json

aws iam put-role-policy \
  --role-name enviroguard-lambda-role \
  --policy-name enviroguard-lambda-policy \
  --policy-document file://infrastructure/iam-policy.json
```

---

## 📋 Implemented Lambda Functions

### ✅ getStations
**Endpoint:** `GET /stations`  
**Purpose:** Returns all sensor stations for map display  
**Integration:** DynamoDB (enviroguard-stations)  
**Status:** ✅ Complete

**Features:**
- Bounding box filtering
- Status filtering (active/inactive/maintenance)
- CORS enabled

**Test:**
```bash
aws lambda invoke \
  --function-name enviroguard-getStations \
  --payload '{"queryStringParameters":{"status":"active"}}' \
  response.json
```

---

### ✅ getPredictions
**Endpoint:** `POST /predict`  
**Purpose:** Returns 24-hour environmental predictions from ML models  
**Integration:** ML Backend (Prophet models on EC2)  
**Status:** ✅ Complete

**Features:**
- Calls 4 ML models (Noise 96.7%, Pollen 85.8%, Litter 78.8%, AQI 59.2%)
- Timeout handling (10 seconds)
- Composite risk calculation
- Error handling for ML backend unavailability

**Environment Variables:**
- `ML_API_URL` - EC2 instance URL (e.g., http://10.0.1.50:8000)
- `ML_API_TIMEOUT` - Request timeout in ms (default: 10000)

**Test:**
```bash
aws lambda invoke \
  --function-name enviroguard-getPredictions \
  --payload '{
    "body": "{\"stationId\":\"station-001\",\"hoursAhead\":24,\"environmentalContext\":{\"temperature\":72,\"humidity\":60}}"
  }' \
  response.json
```

---

### ✅ submitReport
**Endpoint:** `POST /reports`  
**Purpose:** Submits hazard report with AI photo analysis  
**Integration:** S3 (photo storage) + Bedrock (Claude Vision) + DynamoDB  
**Status:** ✅ Complete

**Features:**
- Uploads photo to S3
- Analyzes photo with Claude Vision (Bedrock)
- Extracts type, severity, description, confidence
- Stores report with AI insights in DynamoDB
- Handles Claude API failures gracefully

**Environment Variables:**
- `S3_BUCKET_PHOTOS` - S3 bucket for photo storage
- `BEDROCK_REGION` - AWS region for Bedrock (us-east-1)
- `BEDROCK_MODEL_ID` - Claude model ID (anthropic.claude-3-sonnet-20240229-v1:0)
- `DYNAMODB_TABLE_REPORTS` - DynamoDB table name

**Bedrock Permissions Required:**
```json
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel"],
  "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-*"
}
```

**Test:**
```bash
# Encode test image
base64 test-photo.jpg > photo.b64

aws lambda invoke \
  --function-name enviroguard-submitReport \
  --payload '{
    "body": "{\"type\":\"air_pollution\",\"title\":\"Test Report\",\"latitude\":40.7128,\"longitude\":-74.0060,\"photo\":\"'$(cat photo.b64)'\"}"
  }' \
  response.json
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

### Required for All Lambdas
```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```

### DynamoDB Tables
```bash
DYNAMODB_TABLE_STATIONS=enviroguard-stations
DYNAMODB_TABLE_READINGS=enviroguard-sensor_readings
DYNAMODB_TABLE_REPORTS=enviroguard-hazard_reports
DYNAMODB_TABLE_USERS=enviroguard-users
DYNAMODB_TABLE_POSTS=enviroguard-posts
DYNAMODB_TABLE_ALERTS=enviroguard-alerts
```

### S3 Buckets
```bash
S3_BUCKET_PHOTOS=enviroguard-photos
S3_BUCKET_AVATARS=enviroguard-avatars
```

### ML Backend (for getPredictions)
```bash
ML_API_URL=http://10.0.1.50:8000
ML_API_TIMEOUT=10000
```

### Bedrock/Claude (for submitReport, generateLetter)
```bash
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_MAX_TOKENS=2048
```

---

## 🗄️ DynamoDB Setup

### Create Tables

**Option 1: AWS Console**
- Create tables manually following [API_SPEC.md](API_SPEC.md) schemas

**Option 2: AWS CLI (Quick)**
```bash
# Example: Create stations table
aws dynamodb create-table \
  --table-name enviroguard-stations \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

**Option 3: CloudFormation (Recommended - TODO)**
```bash
aws cloudformation create-stack \
  --stack-name enviroguard-dynamodb \
  --template-body file://infrastructure/cloudformation.yaml
```

### Tables Needed
1. `enviroguard-stations` - Sensor station locations
2. `enviroguard-sensor_readings` - Time-series sensor data
3. `enviroguard-hazard_reports` - User-submitted reports
4. `enviroguard-users` - User profiles and settings
5. `enviroguard-posts` - Community posts and events
6. `enviroguard-alerts` - Alert history

---

## 🔐 IAM Setup

### 1. Create Trust Policy

Create `infrastructure/trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 2. Create Role
```bash
aws iam create-role \
  --role-name enviroguard-lambda-role \
  --assume-role-policy-document file://infrastructure/trust-policy.json
```

### 3. Attach Policy
```bash
aws iam put-role-policy \
  --role-name enviroguard-lambda-role \
  --policy-name enviroguard-lambda-policy \
  --policy-document file://infrastructure/iam-policy.json
```

### 4. Get Role ARN
```bash
aws iam get-role --role-name enviroguard-lambda-role --query 'Role.Arn'
```

Use this ARN when creating Lambda functions.

---

## 🌐 API Gateway Setup (TODO)

### Create REST API
```bash
aws apigateway create-rest-api \
  --name enviroguard-api \
  --description "EnviroGuard Backend API" \
  --endpoint-configuration types=REGIONAL
```

### Connect Lambda Functions
For each endpoint in [API_SPEC.md](API_SPEC.md):
1. Create resource
2. Create method (GET/POST/PUT)
3. Set Lambda integration
4. Deploy to stage

**Detailed instructions:** Coming soon in `infrastructure/api-gateway-setup.md`

---

## 📊 Monitoring

### CloudWatch Logs
All Lambda functions log to:
```
/aws/lambda/enviroguard-<function-name>
```

### View Logs
```bash
aws logs tail /aws/lambda/enviroguard-getStations --follow
```

### Metrics
- Invocations
- Duration
- Errors
- Throttles

**CloudWatch Dashboard:** TODO

---

## 🧪 Testing

### Unit Tests (TODO)
```bash
cd lambdas/getStations
npm test
```

### Integration Tests
```bash
# Test Lambda directly
aws lambda invoke \
  --function-name enviroguard-getStations \
  --payload '{}' \
  response.json

cat response.json
```

### Load Testing (TODO)
```bash
# Use Artillery or Apache JMeter
artillery run load-test.yml
```

---

## 🚀 Deployment

### Manual Deployment
```bash
# For each Lambda function:
cd lambdas/<function-name>
npm install --production
zip -r function.zip index.js node_modules/
aws lambda update-function-code \
  --function-name enviroguard-<function-name> \
  --zip-file fileb://function.zip
```

### Automated Deployment (TODO)
```bash
./infrastructure/deploy.sh
```

---

## 📝 TODO List

### Infrastructure
- [ ] Create CloudFormation template for DynamoDB tables
- [ ] Create CloudFormation template for API Gateway
- [ ] Create automated deployment script
- [ ] Set up CI/CD pipeline (GitHub Actions)

### Lambda Functions
- [x] getStations
- [ ] getReadings
- [x] getPredictions
- [ ] getAlerts
- [ ] createAlert
- [ ] getReports
- [x] submitReport
- [ ] getReportDetails
- [ ] getPosts
- [ ] createPost
- [ ] generateLetter
- [ ] getUserProfile
- [ ] updateUserProfile

### Additional Features
- [ ] Authentication (Cognito)
- [ ] Rate limiting
- [ ] Request validation
- [ ] Error boundaries
- [ ] Monitoring dashboard
- [ ] Automated tests

---

## 🐛 Troubleshooting

### Lambda Function Not Found
```bash
# List all functions
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `enviroguard`)].FunctionName'
```

### DynamoDB Access Denied
- Check IAM role has correct permissions
- Verify table names match environment variables
- Ensure tables exist in correct region

### ML Backend Timeout
- Check `ML_API_URL` is correct
- Verify EC2 instance is running
- Check security group allows Lambda → EC2 traffic
- Increase `ML_API_TIMEOUT` if needed

### Bedrock Access Denied
- Enable Bedrock in AWS Console (Model access page)
- Request access to Claude 3 Sonnet model
- Verify IAM role has `bedrock:InvokeModel` permission
- Check `BEDROCK_REGION` is correct (us-east-1 recommended)

---

## 📚 Resources

- **API Documentation:** [API_SPEC.md](API_SPEC.md)
- **Mobile App:** `../enviroguard/`
- **ML Backend:** `../enviroguard-ml/`
- **AWS Lambda Docs:** https://docs.aws.amazon.com/lambda/
- **AWS Bedrock Docs:** https://docs.aws.amazon.com/bedrock/
- **DynamoDB Docs:** https://docs.aws.amazon.com/dynamodb/

---

## 👥 Team

AWS BEN Hackathon 2026 Project

---

**Status:** 3/13 Lambda functions implemented  
**Next Steps:** Complete remaining Lambdas, set up API Gateway, deploy to AWS
