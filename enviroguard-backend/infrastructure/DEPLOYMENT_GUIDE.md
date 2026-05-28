# EnviroGuard Infrastructure Deployment Guide

Complete reference for deploying the entire backend infrastructure using CloudFormation.

## Table of Contents
1. [DynamoDB Tables](#dynamodb-deployment)
2. [API Gateway](#api-gateway-deployment)
3. [Complete Backend Setup](#complete-backend-setup)

---

# DynamoDB Deployment

## 🚀 Quick Deploy (Development)

Deploy all 6 DynamoDB tables with one command:

```bash
aws cloudformation create-stack \
  --stack-name enviroguard-dynamodb-dev \
  --template-body file://infrastructure/dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST \
  --region us-east-1
```

**Expected time:** ~5 minutes

---

## 📊 Monitor Deployment

```bash
# Watch stack creation progress
aws cloudformation describe-stacks \
  --stack-name enviroguard-dynamodb-dev \
  --query 'Stacks[0].StackStatus' \
  --output text

# Wait for completion (polls every 30 seconds)
aws cloudformation wait stack-create-complete \
  --stack-name enviroguard-dynamodb-dev
```

---

## ✅ Verify Tables Created

```bash
# List all tables
aws dynamodb list-tables \
  --query 'TableNames[?starts_with(@, `enviroguard`)]' \
  --output table

# Get table details
aws dynamodb describe-table \
  --table-name enviroguard-stations \
  --query 'Table.[TableName,TableStatus,ItemCount,TableSizeBytes]' \
  --output table
```

**Expected output:** 6 tables (all with status ACTIVE)
- enviroguard-stations
- enviroguard-sensor_readings
- enviroguard-hazard_reports
- enviroguard-users
- enviroguard-posts
- enviroguard-alerts

---

## 📋 Get Table Names for Lambda

```bash
# Export table names as environment variables
aws cloudformation describe-stacks \
  --stack-name enviroguard-dynamodb-dev \
  --query 'Stacks[0].Outputs' \
  --output table
```

Copy these values to your Lambda `.env` or CloudFormation parameters.

---

## 🔄 Update Stack

If you need to modify the schema:

```bash
aws cloudformation update-stack \
  --stack-name enviroguard-dynamodb-dev \
  --template-body file://infrastructure/dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=BillingMode,ParameterValue=PAY_PER_REQUEST
```

---

## 🗑️ Delete Stack (Development Only)

⚠️ **WARNING:** This deletes all tables and data!

```bash
aws cloudformation delete-stack \
  --stack-name enviroguard-dynamodb-dev

# Wait for deletion
aws cloudformation wait stack-delete-complete \
  --stack-name enviroguard-dynamodb-dev
```

---

## 🎯 Production Deployment

For production, enable point-in-time recovery and use better retention policies:

```bash
aws cloudformation create-stack \
  --stack-name enviroguard-dynamodb-prod \
  --template-body file://infrastructure/dynamodb.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=BillingMode,ParameterValue=PROVISIONED \
  --region us-east-1 \
  --tags \
    Key=Project,Value=EnviroGuard \
    Key=CostCenter,Value=YourCostCenter \
    Key=ManagedBy,Value=CloudFormation
```

**Production features:**
- ✅ Point-in-time recovery enabled
- ✅ Deletion protection (Retain policy)
- ✅ Users table always retained
- ✅ Better tagging for cost tracking

---

## 🔍 Troubleshooting

### Stack creation failed
```bash
# View events
aws cloudformation describe-stack-events \
  --stack-name enviroguard-dynamodb-dev \
  --max-items 10

# Common issues:
# - Table name already exists (delete old tables first)
# - IAM permissions (need cloudformation:*, dynamodb:*)
# - Region mismatch (check --region flag)
```

### Table not appearing
```bash
# Check region
aws configure get region

# List tables in specific region
aws dynamodb list-tables --region us-east-1
```

### Cannot delete stack
```bash
# If DeletionPolicy is Retain, manually delete tables first
aws dynamodb delete-table --table-name enviroguard-stations

# Then delete stack
aws cloudformation delete-stack --stack-name enviroguard-dynamodb-dev
```

---

## 📊 What Gets Created

### All Tables Include:
- ✅ Pay-per-request billing (no capacity planning)
- ✅ Global Secondary Indexes for query patterns
- ✅ Proper tags (Project, Environment)
- ✅ Point-in-time recovery (production only)

### Special Features:

**sensor_readings:**
- TTL: 90 days (automatic data expiration)
- Partition by stationId, sort by timestamp
- GSI for time-range queries

**alerts:**
- TTL: 30 days (automatic cleanup)
- Partition by userId
- GSI for resolved/unresolved filtering

**users:**
- Always retained (even if stack deleted)
- Email index for login
- Contains PII (tagged)

**hazard_reports:**
- Multiple GSIs (by user, by status)
- Supports geo queries (via application logic)

**posts:**
- Type index (post vs event)
- User index (user's posts)

**stations:**
- Status index (active/inactive)
- Installed date sorting

---

## 💰 Cost Estimation

### Development (PAY_PER_REQUEST):
- **First 2.5M reads/month:** Free tier
- **First 1M writes/month:** Free tier
- **Estimated cost:** $0-5/month for small traffic

### Production (PROVISIONED):
- Depends on RCU/WCU provisioned
- Can enable auto-scaling
- **Estimated cost:** $10-50/month for moderate traffic

### Storage:
- **First 25 GB:** Free tier
- **After:** $0.25/GB/month

---

## 🔗 Integration with Lambda

After deployment, update Lambda environment variables:

```bash
# Example for getStations Lambda
aws lambda update-function-configuration \
  --function-name enviroguard-getStations \
  --environment Variables="{
    DYNAMODB_TABLE_STATIONS=enviroguard-stations,
    AWS_REGION=us-east-1
  }"
```

Or reference outputs in Lambda CloudFormation:
```yaml
Environment:
  Variables:
    DYNAMODB_TABLE_STATIONS: !GetAtt StationsTable.Name
```

---

## ✅ Post-Deployment Checklist

- [ ] All 6 tables show status ACTIVE
- [ ] Table names match `.env.example`
- [ ] GSIs are active
- [ ] TTL enabled for sensor_readings and alerts
- [ ] Point-in-time recovery enabled (production)
- [ ] Lambda functions updated with table names
- [ ] IAM policy allows Lambda → DynamoDB access
- [ ] Test CRUD operations on each table

---

## 📚 Next Steps

1. **Deploy Lambda functions** - Update with table names
2. **Set up API Gateway** - Connect Lambda triggers
3. **Test endpoints** - Verify DynamoDB integration
4. **Add sample data** - Populate for testing
5. **Monitor costs** - Enable CloudWatch billing alerts

---

**Template:** `infrastructure/dynamodb.yaml`  
**IAM Policy:** `infrastructure/iam-policy.json`  
**API Spec:** `API_SPEC.md`

---

# API Gateway Deployment

## 🚀 Deploy API Gateway

After deploying DynamoDB and Lambda functions, deploy API Gateway to connect everything.

### Prerequisites
1. ✅ DynamoDB tables deployed (from previous step)
2. ✅ Lambda functions deployed (3 minimum: getStations, getPredictions, submitReport)
3. ✅ Lambda function ARNs ready

### Step 1: Get Lambda ARNs

```bash
# List your Lambda functions
aws lambda list-functions \
  --query 'Functions[?starts_with(FunctionName, `enviroguard`)].{Name:FunctionName,Arn:FunctionArn}' \
  --output table

# Get specific ARN
aws lambda get-function \
  --function-name enviroguard-getStations \
  --query 'Configuration.FunctionArn' \
  --output text
```

### Step 2: Deploy API Gateway

```bash
# Deploy with 3 Lambda functions (minimum viable API)
aws cloudformation create-stack \
  --stack-name enviroguard-api-dev \
  --template-body file://infrastructure/api-gateway.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=StageName,ParameterValue=dev \
    ParameterKey=GetStationsLambdaArn,ParameterValue=arn:aws:lambda:us-east-1:123456789012:function:enviroguard-getStations \
    ParameterKey=GetPredictionsLambdaArn,ParameterValue=arn:aws:lambda:us-east-1:123456789012:function:enviroguard-getPredictions \
    ParameterKey=SubmitReportLambdaArn,ParameterValue=arn:aws:lambda:us-east-1:123456789012:function:enviroguard-submitReport \
  --region us-east-1
```

**Expected time:** ~2 minutes

### Step 3: Get API URL

```bash
# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name enviroguard-api-dev

# Get API URL
aws cloudformation describe-stacks \
  --stack-name enviroguard-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

**Example output:**
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

### Step 4: Test Endpoints

```bash
# Set API URL as variable
API_URL=$(aws cloudformation describe-stacks \
  --stack-name enviroguard-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Test GET /stations (public endpoint)
curl $API_URL/stations

# Test POST /predict (requires data)
curl -X POST $API_URL/predict \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "station-001",
    "hoursAhead": 24,
    "environmentalContext": {
      "temperature": 72,
      "humidity": 60
    }
  }'
```

---

## 🔧 Deploy with All 13 Lambda Functions

When you have all Lambda functions deployed:

```bash
aws cloudformation create-stack \
  --stack-name enviroguard-api-dev \
  --template-body file://infrastructure/api-gateway.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=StageName,ParameterValue=dev \
    ParameterKey=GetStationsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getStations \
    ParameterKey=GetReadingsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getReadings \
    ParameterKey=GetPredictionsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getPredictions \
    ParameterKey=GetAlertsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getAlerts \
    ParameterKey=CreateAlertLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-createAlert \
    ParameterKey=GetReportsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getReports \
    ParameterKey=SubmitReportLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-submitReport \
    ParameterKey=GetReportDetailsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getReportDetails \
    ParameterKey=GetPostsLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getPosts \
    ParameterKey=CreatePostLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-createPost \
    ParameterKey=GenerateLetterLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-generateLetter \
    ParameterKey=GetUserProfileLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-getUserProfile \
    ParameterKey=UpdateUserProfileLambdaArn,ParameterValue=arn:aws:lambda:REGION:ACCOUNT:function:enviroguard-updateUserProfile
```

---

## 🔐 Deploy with Cognito Authentication

If you have Cognito User Pool set up:

```bash
# Get Cognito User Pool ARN
COGNITO_ARN=$(aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_XXXXXXXXX \
  --query 'UserPool.Arn' \
  --output text)

# Deploy API Gateway with Cognito
aws cloudformation create-stack \
  --stack-name enviroguard-api-dev \
  --template-body file://infrastructure/api-gateway.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=CognitoUserPoolArn,ParameterValue=$COGNITO_ARN \
    ParameterKey=GetStationsLambdaArn,ParameterValue=... \
    # ... other parameters
```

With Cognito enabled:
- Public endpoints: GET /stations, GET /posts (no auth required)
- Protected endpoints: All others (require JWT token in Authorization header)

---

## 🔄 Update API Gateway

If you need to add more Lambda functions or change configuration:

```bash
aws cloudformation update-stack \
  --stack-name enviroguard-api-dev \
  --template-body file://infrastructure/api-gateway.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    # ... updated parameters
```

---

## 📱 Connect Mobile App

After API Gateway is deployed, update your mobile app:

```bash
# In enviroguard/.env
EXPO_PUBLIC_API_BASE_URL=https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
EXPO_PUBLIC_ENABLE_FAKE_DATA=false
```

Restart the app and it will now call real backend APIs!

---

## 🗑️ Delete API Gateway

```bash
aws cloudformation delete-stack \
  --stack-name enviroguard-api-dev

aws cloudformation wait stack-delete-complete \
  --stack-name enviroguard-api-dev
```

---

# Complete Backend Setup

## 🎯 Full Deployment (End-to-End)

Deploy entire backend in order:

### Step 1: Deploy DynamoDB (5 min)
```bash
aws cloudformation create-stack \
  --stack-name enviroguard-dynamodb-dev \
  --template-body file://infrastructure/dynamodb.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
  --region us-east-1

aws cloudformation wait stack-create-complete \
  --stack-name enviroguard-dynamodb-dev
```

### Step 2: Create IAM Role (1 min)
```bash
# Create trust policy
cat > /tmp/trust-policy.json << 'POLICY'
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
POLICY

# Create role
aws iam create-role \
  --role-name enviroguard-lambda-role \
  --assume-role-policy-document file:///tmp/trust-policy.json

# Attach policy
aws iam put-role-policy \
  --role-name enviroguard-lambda-role \
  --policy-name enviroguard-lambda-policy \
  --policy-document file://infrastructure/iam-policy.json

# Get role ARN
LAMBDA_ROLE_ARN=$(aws iam get-role \
  --role-name enviroguard-lambda-role \
  --query 'Role.Arn' \
  --output text)
```

### Step 3: Deploy Lambda Functions (10 min)
```bash
# For each Lambda function:
cd lambdas/getStations
npm install --production
zip -r function.zip index.js node_modules/

aws lambda create-function \
  --function-name enviroguard-getStations \
  --runtime nodejs18.x \
  --handler index.handler \
  --role $LAMBDA_ROLE_ARN \
  --zip-file fileb://function.zip \
  --environment Variables="{DYNAMODB_TABLE_STATIONS=enviroguard-stations,AWS_REGION=us-east-1}" \
  --timeout 30 \
  --memory-size 256

cd ../..

# Repeat for getPredictions, submitReport, etc.
```

### Step 4: Deploy API Gateway (2 min)
```bash
# Get Lambda ARNs
GET_STATIONS_ARN=$(aws lambda get-function \
  --function-name enviroguard-getStations \
  --query 'Configuration.FunctionArn' \
  --output text)

GET_PREDICTIONS_ARN=$(aws lambda get-function \
  --function-name enviroguard-getPredictions \
  --query 'Configuration.FunctionArn' \
  --output text)

SUBMIT_REPORT_ARN=$(aws lambda get-function \
  --function-name enviroguard-submitReport \
  --query 'Configuration.FunctionArn' \
  --output text)

# Deploy API Gateway
aws cloudformation create-stack \
  --stack-name enviroguard-api-dev \
  --template-body file://infrastructure/api-gateway.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=GetStationsLambdaArn,ParameterValue=$GET_STATIONS_ARN \
    ParameterKey=GetPredictionsLambdaArn,ParameterValue=$GET_PREDICTIONS_ARN \
    ParameterKey=SubmitReportLambdaArn,ParameterValue=$SUBMIT_REPORT_ARN

aws cloudformation wait stack-create-complete \
  --stack-name enviroguard-api-dev
```

### Step 5: Get API URL & Test
```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name enviroguard-api-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo "API URL: $API_URL"

# Test
curl $API_URL/stations
```

### Step 6: Update Mobile App
```bash
# Update enviroguard/.env
echo "EXPO_PUBLIC_API_BASE_URL=$API_URL" >> enviroguard/.env
echo "EXPO_PUBLIC_ENABLE_FAKE_DATA=false" >> enviroguard/.env

# Restart app
cd enviroguard
npm start
```

---

## ✅ Verification Checklist

- [ ] DynamoDB: 6 tables created and ACTIVE
- [ ] IAM: Lambda execution role created with correct permissions
- [ ] Lambda: At least 3 functions deployed (getStations, getPredictions, submitReport)
- [ ] API Gateway: Stack created successfully
- [ ] API Gateway: Can access API URL in browser
- [ ] Test: `curl <API_URL>/stations` returns data
- [ ] Mobile app: Updated with API URL
- [ ] Mobile app: Can load stations on map
- [ ] Mobile app: Can get predictions
- [ ] Mobile app: Can submit reports

---

## 🐛 Troubleshooting

### API Gateway returns 403
- Check Lambda permissions (API Gateway must have `lambda:InvokeFunction`)
- Verify Lambda ARNs are correct in CloudFormation parameters

### API Gateway returns 502
- Lambda function error - check CloudWatch logs
- Lambda timeout (increase from 30s if needed)

### CORS errors in browser
- Check OPTIONS methods are deployed
- Verify CORS headers in Lambda responses

### "No data" in mobile app
- Check `EXPO_PUBLIC_API_BASE_URL` is correct (include `/dev` stage)
- Verify `EXPO_PUBLIC_ENABLE_FAKE_DATA=false`
- Check API Gateway stage is deployed

---

**Total deployment time:** ~20 minutes  
**Cost:** ~$0 (within free tier for development)
