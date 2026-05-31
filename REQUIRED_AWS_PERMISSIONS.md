# Required AWS Permissions for EnviroGuard

**Send this to your AWS Administrator (Eugene Koval)**

---

## Summary

The EnviroGuard application requires permissions for 6 Lambda functions to access DynamoDB, SNS, and SES services. Currently blocked by missing IAM and service permissions.

**AWS Account ID:** YOUR_AWS_ACCOUNT_ID  
**Region:** us-east-1  
**User:** btech-startakovskiy

---

## 1. Lambda Execution Role Permissions (CRITICAL - Blocking All Functions)

Each of the 6 Lambda functions needs DynamoDB access. Please attach these permissions to ALL Lambda execution roles:

**Lambda Functions:**
- `users-fn` (Role: `users-fn-role-fr8ynnut`)
- `posts-fn` (Role: `posts-fn-role-...`)
- `petitions-fn` (Role: `petitions-fn-role-...`)
- `messages-fn` (Role: `messages-fn-role-...`)
- `ml-proxy-fn` (Role: `ml-proxy-fn-role-...`)
- `env-data-fn` (Role: `env-data-fn-role-...`)

**Required Policy:** Attach **AmazonDynamoDBFullAccess** managed policy

**OR create inline policy with these permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/users",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/users/index/*",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/posts",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/posts/index/*",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/petitions",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/petitions/index/*",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/messages",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/messages/index/*",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/agreements",
        "arn:aws:dynamodb:us-east-1:YOUR_AWS_ACCOUNT_ID:table/agreements/index/*"
      ]
    }
  ]
}
```

---

## 2. SNS Permissions (For posts-fn, petitions-fn, messages-fn)

**Option A - User Permissions (so I can create SNS topics):**

Grant to user `btech-startakovskiy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SNSManagement",
      "Effect": "Allow",
      "Action": [
        "sns:CreateTopic",
        "sns:Subscribe",
        "sns:ListTopics",
        "sns:GetTopicAttributes",
        "sns:SetTopicAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

**Option B - Admin Creates SNS Topic:**

If you prefer to create it yourself:
1. Create SNS topic named: `enviroguard-alerts`
2. Type: **Standard** (not FIFO)
3. Region: us-east-1
4. Share the ARN with me

**Lambda Role Permissions:**

Add to `posts-fn`, `petitions-fn`, and `messages-fn` execution roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SNSPublish",
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:YOUR_AWS_ACCOUNT_ID:enviroguard-alerts"
    }
  ]
}
```

---

## 3. SES Permissions (For petitions-fn)

**Option A - User Permissions (so I can verify email addresses):**

Grant to user `btech-startakovskiy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SESManagement",
      "Effect": "Allow",
      "Action": [
        "ses:VerifyEmailIdentity",
        "ses:VerifyEmailAddress",
        "ses:ListIdentities",
        "ses:GetIdentityVerificationAttributes",
        "ses:DeleteIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

**Option B - Admin Verifies Email:**

If you prefer to verify an email yourself:
1. Go to SES → Verified identities
2. Create identity → Email address
3. Verify an email (e.g., `noreply@yourdomain.com` or your personal email)
4. Share the verified email address with me

**Lambda Role Permissions:**

Add to `petitions-fn` execution role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SESSendEmail",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

**SES Production Access (Optional):**

By default, SES is in sandbox mode (can only send to verified emails). To send to government officials in production:
1. Go to SES → Account dashboard
2. Click "Request production access"
3. Fill out the form (takes 24-48 hours for approval)

---

## 4. IAM Permissions for User (So I Can Configure Things Myself)

Grant to user `btech-startakovskiy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "IAMManageRolePolicies",
      "Effect": "Allow",
      "Action": [
        "iam:ListPolicies",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:GetRole",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": [
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/users-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/posts-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/petitions-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/messages-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/ml-proxy-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:role/env-data-fn-role-*",
        "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:policy/*"
      ]
    }
  ]
}
```

This allows me to attach policies to Lambda roles without needing admin help each time.

---

## 5. Current Status

### ✅ Working
- Lambda functions uploaded
- Lambda layer uploaded
- Environment variables configured

### ❌ Blocked
- **DynamoDB access** - All 6 functions cannot read/write to database
- **SNS topic creation** - Cannot create notification topics
- **SES email verification** - Cannot verify sender email
- **IAM role configuration** - Cannot attach policies to Lambda roles

---

## Priority Order

**Immediate (to unblock testing):**
1. ✅ **DynamoDB permissions for all 6 Lambda roles** - Without this, nothing works
2. **IAM permissions for user** - So I can self-serve future changes

**Important (for full functionality):**
3. SNS topic creation or provide topic ARN
4. SES email verification or provide verified email

**Optional (for production):**
5. SES production access request

---

## Quick Fix Commands (For Admin)

If you want to grant everything at once:

### For Lambda Roles:
```bash
# Attach DynamoDB policy to all Lambda roles
for role in users-fn-role posts-fn-role petitions-fn-role messages-fn-role ml-proxy-fn-role env-data-fn-role; do
  aws iam attach-role-policy \
    --role-name $(aws iam list-roles --query "Roles[?contains(RoleName, '${role}')].RoleName" --output text) \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
done
```

### For User IAM Access:
```bash
# Grant IAM permissions to user
aws iam put-user-policy \
  --user-name btech-startakovskiy \
  --policy-name LambdaRoleManagement \
  --policy-document file://iam-policy.json
```

---

## Questions?

Contact: btech-startakovskiy  
Project: EnviroGuard AWS Hackathon 2026  
Date: 2026-05-27
