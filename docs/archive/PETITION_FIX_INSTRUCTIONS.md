# Fix Petitions Not Appearing - Step-by-Step

## Problem
Posts reach 10 agreements but NO petitions appear in "Petitions & Actions" tab.

## Root Cause
The Lambda function `posts-fn` is running OLD code that only publishes SNS messages. The NEW code that auto-creates petitions was written but NOT uploaded to AWS.

---

## Solution: Upload New Lambda Code

### Step 1: Upload to AWS Lambda
1. Go to: https://console.aws.amazon.com/lambda
2. Click on: `posts-fn` function
3. Click: "Upload from" → ".zip file"
4. Select file: `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/posts-fn.zip`
5. Click: "Save"
6. Wait 10 seconds for deployment to complete

### Step 2: Test the Fix
1. Go to: http://44.204.121.129
2. Hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+F5** (Windows)
3. Click: "Community" tab
4. Click: "Local Feed" sub-tab
5. Find any post with agreement_count < 10
6. Click: "I Have This Too" button **10 times** on that post
7. Go to: "Petitions & Actions" tab
8. **Petition should now appear** with:
   - Generated text from Claude API
   - Signature count = 10
   - Status = Active
   - Official assigned based on category

---

## What the New Code Does

When a post reaches 10 agreements, the Lambda now:
1. Fetches all agreers from `agreement` table
2. Calls Claude API to generate formal petition text
3. Maps category to city official (Noise → Noise Control Board, etc.)
4. Creates petition record in `petitions` DynamoDB table with `status: 'active'`
5. Copies all agreers to `petition_signatures` table

Frontend then fetches petitions via `GET /petitions?status=active` and displays them.

---

## Alternative: Manually Create Test Petition in DynamoDB

If Lambda upload doesn't work, manually add a petition:

1. Go to: https://console.aws.amazon.com/dynamodb
2. Click: Tables → `petitions` → "Explore table items"
3. Click: "Create item"
4. Add these attributes:
   - `petition_id` (String): `pet_test_12345`
   - `post_id` (String): `p_c1fc967b2943`
   - `category` (String): `noise`
   - `neighborhood_id` (String): `williamsburg`
   - `petition_text` (String): `We demand immediate action to address excessive noise pollution in Williamsburg affecting community health. The city must enforce noise ordinances and hold violators accountable.`
   - `threshold` (Number): `10`
   - `signature_count` (Number): `15`
   - `status` (String): `active`
   - `official` (Map):
     - `name` (String): `NYC Noise Control Board`
     - `email` (String): `noise@nyc.gov`
     - `role` (String): `Director`
   - `created_at` (String): `2026-06-09T04:00:00.000Z`
5. Click: "Create item"
6. Hard refresh: http://44.204.121.129
7. Go to: "Petitions & Actions" tab
8. **Test petition will appear**

---

## Files Modified

- `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/posts-fn/index.js` - Added petition auto-creation code
- `/Users/salomon/awshackathon/AWS_BEN_HACKATHON_2026/posts-fn.zip` - Packaged Lambda ready to upload

---

## Verification

After uploading Lambda, check logs:
```bash
aws logs tail /aws/lambda/posts-fn --since 5m
```

Look for:
- `Petition pet_XXXXX created for post p_XXXXX` ← Success message
- NO "SNS publish failed" errors ← Old code is gone

---

## Why It Wasn't Working

The Lambda logs showed:
```
ERROR SNS publish failed: Invalid parameter: TopicArn
```

This proves the OLD code was still deployed (trying to use SNS). The NEW code doesn't use SNS at all - it creates petitions directly in DynamoDB.

You must upload the zip file via AWS Console for the new code to take effect.
