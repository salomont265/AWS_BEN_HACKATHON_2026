# EnviroGuard DynamoDB Deployment Guide

Quick reference for deploying the database infrastructure using CloudFormation.

---

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
