#!/bin/bash

###############################################################################
# EnviroGuard Lambda Deployment Script
#
# This script automates the deployment of all Lambda functions to AWS.
# It handles:
# - npm dependency installation
# - Creating deployment packages (zip files)
# - Creating or updating Lambda functions
# - Setting environment variables
# - Extracting ARNs for API Gateway deployment
#
# Prerequisites:
# - AWS CLI configured with credentials
# - IAM role created: enviroguard-lambda-role
# - DynamoDB tables deployed
#
# Usage:
#   ./infrastructure/deploy-lambdas.sh
#
###############################################################################

set -e  # Exit on any error

# ========================================
# CONFIGURATION
# ========================================

PROJECT_NAME="enviroguard"
AWS_REGION="us-east-1"
RUNTIME="nodejs18.x"
TIMEOUT=30
MEMORY_SIZE=256

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# FUNCTIONS
# ========================================

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_step() {
    echo -e "${BLUE}[$1/$2] $3${NC}"
}

# Check if IAM role exists
check_iam_role() {
    local role_name=$1

    if aws iam get-role --role-name "$role_name" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Get IAM role ARN
get_role_arn() {
    local role_name=$1
    aws iam get-role \
        --role-name "$role_name" \
        --query 'Role.Arn' \
        --output text
}

# Check if Lambda function exists
function_exists() {
    local function_name=$1

    if aws lambda get-function --function-name "$function_name" --region "$AWS_REGION" &>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Deploy a single Lambda function
deploy_lambda() {
    local function_name=$1
    local function_dir=$2
    local handler=$3
    local description=$4
    local env_vars=$5

    echo "  📦 Installing dependencies..."
    cd "$function_dir"
    npm install --production --silent 2>/dev/null || npm install --production

    echo "  🗜️  Creating deployment package..."
    zip -r -q function.zip index.js node_modules/ 2>/dev/null || zip -r function.zip index.js node_modules/

    if function_exists "$function_name"; then
        echo "  🔄 Function exists, updating code..."
        aws lambda update-function-code \
            --function-name "$function_name" \
            --zip-file fileb://function.zip \
            --region "$AWS_REGION" \
            --output json > /dev/null

        # Update environment variables
        if [ -n "$env_vars" ]; then
            aws lambda update-function-configuration \
                --function-name "$function_name" \
                --environment "Variables={$env_vars}" \
                --region "$AWS_REGION" \
                --output json > /dev/null
        fi
    else
        echo "  ⚡ Creating new function..."
        aws lambda create-function \
            --function-name "$function_name" \
            --runtime "$RUNTIME" \
            --handler "$handler" \
            --role "$LAMBDA_ROLE_ARN" \
            --zip-file fileb://function.zip \
            --timeout "$TIMEOUT" \
            --memory-size "$MEMORY_SIZE" \
            --environment "Variables={$env_vars}" \
            --description "$description" \
            --region "$AWS_REGION" \
            --output json > /dev/null
    fi

    # Clean up
    rm function.zip
    cd - > /dev/null

    # Get function ARN
    local arn=$(aws lambda get-function \
        --function-name "$function_name" \
        --region "$AWS_REGION" \
        --query 'Configuration.FunctionArn' \
        --output text)

    echo "$arn"
}

# ========================================
# MAIN SCRIPT
# ========================================

START_TIME=$(date +%s)

print_header "🚀 EnviroGuard Lambda Deployment"

# Check prerequisites
echo ""
print_info "Checking prerequisites..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI not found. Please install it first."
    exit 1
fi
print_success "AWS CLI found"

# Check AWS credentials
if ! aws sts get-caller-identity &>/dev/null; then
    print_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_success "AWS credentials configured (Account: $ACCOUNT_ID)"

# Check/Create IAM role
ROLE_NAME="${PROJECT_NAME}-lambda-role"
if check_iam_role "$ROLE_NAME"; then
    print_success "IAM role '$ROLE_NAME' exists"
    LAMBDA_ROLE_ARN=$(get_role_arn "$ROLE_NAME")
else
    print_info "IAM role '$ROLE_NAME' not found. Creating..."

    # Create role
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document file://infrastructure/trust-policy.json \
        --description "Execution role for EnviroGuard Lambda functions" \
        > /dev/null

    # Attach policy
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "${PROJECT_NAME}-lambda-policy" \
        --policy-document file://infrastructure/iam-policy.json \
        > /dev/null

    LAMBDA_ROLE_ARN=$(get_role_arn "$ROLE_NAME")
    print_success "IAM role created: $LAMBDA_ROLE_ARN"

    # Wait for role to propagate
    print_info "Waiting 10 seconds for IAM role to propagate..."
    sleep 10
fi

# Check DynamoDB tables
print_info "Checking DynamoDB tables..."
TABLES=$(aws dynamodb list-tables --region "$AWS_REGION" --query 'TableNames' --output text)
if echo "$TABLES" | grep -q "enviroguard"; then
    TABLE_COUNT=$(echo "$TABLES" | grep -o "enviroguard" | wc -l)
    print_success "Found $TABLE_COUNT EnviroGuard tables"
else
    print_error "No EnviroGuard DynamoDB tables found. Deploy dynamodb.yaml first."
    exit 1
fi

echo ""
print_header "📦 Deploying Lambda Functions"

# Array to store ARNs
declare -A ARNS

# ========================================
# DEPLOY: getStations
# ========================================
echo ""
print_step "1" "3" "Deploying getStations..."

FUNC_NAME="${PROJECT_NAME}-getStations"
FUNC_DIR="lambdas/getStations"
HANDLER="index.handler"
DESCRIPTION="Returns all sensor stations for map display"
ENV_VARS="DYNAMODB_TABLE_STATIONS=${PROJECT_NAME}-stations,AWS_REGION=${AWS_REGION}"

ARN=$(deploy_lambda "$FUNC_NAME" "$FUNC_DIR" "$HANDLER" "$DESCRIPTION" "$ENV_VARS")
ARNS["GetStationsLambdaArn"]="$ARN"
print_success "Deployed: $ARN"

# ========================================
# DEPLOY: getPredictions
# ========================================
echo ""
print_step "2" "3" "Deploying getPredictions..."

FUNC_NAME="${PROJECT_NAME}-getPredictions"
FUNC_DIR="lambdas/getPredictions"
HANDLER="index.handler"
DESCRIPTION="Returns 24-hour environmental predictions from ML models"
ENV_VARS="ML_API_URL=http://REPLACE_WITH_EC2_IP:8000,ML_API_TIMEOUT=10000,AWS_REGION=${AWS_REGION}"

ARN=$(deploy_lambda "$FUNC_NAME" "$FUNC_DIR" "$HANDLER" "$DESCRIPTION" "$ENV_VARS")
ARNS["GetPredictionsLambdaArn"]="$ARN"
print_success "Deployed: $ARN"

# ========================================
# DEPLOY: submitReport
# ========================================
echo ""
print_step "3" "3" "Deploying submitReport..."

FUNC_NAME="${PROJECT_NAME}-submitReport"
FUNC_DIR="lambdas/submitReport"
HANDLER="index.handler"
DESCRIPTION="Submits hazard report with Claude Vision analysis"
ENV_VARS="DYNAMODB_TABLE_REPORTS=${PROJECT_NAME}-hazard_reports,S3_BUCKET_PHOTOS=${PROJECT_NAME}-photos,BEDROCK_REGION=${AWS_REGION},BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0,AWS_REGION=${AWS_REGION}"

ARN=$(deploy_lambda "$FUNC_NAME" "$FUNC_DIR" "$HANDLER" "$DESCRIPTION" "$ENV_VARS")
ARNS["SubmitReportLambdaArn"]="$ARN"
print_success "Deployed: $ARN"

# ========================================
# SUMMARY
# ========================================
echo ""
print_header "📋 Deployment Summary"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
print_success "All Lambda functions deployed successfully!"
echo ""
echo "Functions deployed: 3"
echo "Total time: ${DURATION}s"
echo "Region: $AWS_REGION"
echo "IAM Role: $LAMBDA_ROLE_ARN"
echo ""

print_header "🔗 Lambda ARNs (for API Gateway)"
echo ""
for key in "${!ARNS[@]}"; do
    echo "  $key=${ARNS[$key]}"
done

echo ""
print_header "✨ Next Steps"
echo ""
echo "1️⃣  Update ML API URL (if EC2 is ready):"
echo "   aws lambda update-function-configuration \\"
echo "     --function-name ${PROJECT_NAME}-getPredictions \\"
echo "     --environment Variables=\"{ML_API_URL=http://YOUR_EC2_IP:8000,ML_API_TIMEOUT=10000,AWS_REGION=${AWS_REGION}}\""
echo ""
echo "2️⃣  Create S3 bucket for photos:"
echo "   aws s3 mb s3://${PROJECT_NAME}-photos --region ${AWS_REGION}"
echo ""
echo "3️⃣  Deploy API Gateway:"
echo "   aws cloudformation create-stack \\"
echo "     --stack-name ${PROJECT_NAME}-api-dev \\"
echo "     --template-body file://infrastructure/api-gateway.yaml \\"
echo "     --parameters \\"
echo "       ParameterKey=Environment,ParameterValue=dev \\"
echo "       ParameterKey=GetStationsLambdaArn,ParameterValue=${ARNS[GetStationsLambdaArn]} \\"
echo "       ParameterKey=GetPredictionsLambdaArn,ParameterValue=${ARNS[GetPredictionsLambdaArn]} \\"
echo "       ParameterKey=SubmitReportLambdaArn,ParameterValue=${ARNS[SubmitReportLambdaArn]} \\"
echo "     --region ${AWS_REGION}"
echo ""
echo "4️⃣  Test functions:"
echo "   aws lambda invoke --function-name ${PROJECT_NAME}-getStations response.json"
echo "   cat response.json"
echo ""

print_success "Deployment complete! 🎉"
