# AyushScan AI Backend - Deployment Guide

Complete step-by-step guide to deploy the AWS Lambda backend.

## Prerequisites Checklist

- [ ] AWS Account created
- [ ] AWS CLI installed
- [ ] Node.js and npm installed
- [ ] Python 3.11 installed
- [ ] Git installed

## Step 1: Install Serverless Framework

```bash
npm install -g serverless
```

Verify installation:
```bash
serverless --version
```

## Step 2: Configure AWS Credentials

### Option A: Using AWS CLI (Recommended)

```bash
aws configure
```

Enter:
- AWS Access Key ID: (from AWS Console → IAM → Users → Security credentials)
- AWS Secret Access Key: (from AWS Console)
- Default region: `ap-south-1`
- Default output format: `json`

### Option B: Manual Configuration

Create `~/.aws/credentials`:
```
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

Create `~/.aws/config`:
```
[default]
region = ap-south-1
output = json
```

## Step 3: Enable AWS Bedrock Models

1. Go to AWS Console → Bedrock
2. Click "Model access" in left sidebar
3. Click "Manage model access"
4. Find "Anthropic" section
5. Check "Claude 3.5 Sonnet"
6. Click "Request model access"
7. Wait for approval (usually instant)

## Step 4: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or using virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Step 5: Install Node Dependencies

```bash
npm install
```

## Step 6: Deploy to AWS

### Deploy to Development

```bash
serverless deploy --stage dev
```

This will:
1. Package Lambda functions
2. Create CloudFormation stack
3. Create DynamoDB table: `ayushscan-assessments-dev`
4. Create S3 bucket: `ayushscan-storage-dev`
5. Deploy 4 Lambda functions
6. Create API Gateway endpoints
7. Configure IAM roles

**Expected output:**
```
Service Information
service: ayushscan-ai
stage: dev
region: ap-south-1
stack: ayushscan-ai-dev
api keys:
  None
endpoints:
  POST - https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/triage
  POST - https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/report
  GET - https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/upload-url
  GET - https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/assessments
functions:
  triage: ayushscan-ai-dev-triage
  report: ayushscan-ai-dev-report
  uploadUrl: ayushscan-ai-dev-uploadUrl
  assessments: ayushscan-ai-dev-assessments
```

**Save the API Gateway URL!** You'll need it for the frontend.

### Deploy to Production

```bash
serverless deploy --stage prod
```

## Step 7: Test the Deployment

### Test Triage Endpoint

```bash
curl -X POST https://YOUR_API_URL/dev/triage \
  -H "Content-Type: application/json" \
  -d '{
    "patient_info": {
      "name": "Test Patient",
      "age": 35,
      "gender": "female"
    },
    "voice_transcript": "Patient has fever and headache for 3 days"
  }'
```

### Test Upload URL Endpoint

```bash
curl "https://YOUR_API_URL/dev/upload-url?file_type=image/jpeg"
```

### View Logs

```bash
serverless logs --function triage --tail
```

## Step 8: Update Frontend Configuration

In your frontend `.env` file:
```
VITE_API_URL=https://YOUR_API_URL/dev
```

## Common Issues and Solutions

### Issue: "Bedrock model not found"

**Solution:**
1. Check model access in AWS Console → Bedrock
2. Verify model ID in `shared/bedrock_service.py`
3. Ensure you're using the correct region (us-east-1 for Bedrock)

### Issue: "Access Denied" errors

**Solution:**
1. Check IAM permissions in `serverless.yml`
2. Verify AWS credentials are configured
3. Ensure your AWS user has necessary permissions

### Issue: "S3 bucket already exists"

**Solution:**
1. S3 bucket names must be globally unique
2. Change bucket name in `serverless.yml`:
   ```yaml
   S3_BUCKET: ayushscan-storage-${self:provider.stage}-YOUR_UNIQUE_ID
   ```

### Issue: "DynamoDB table already exists"

**Solution:**
1. Remove existing stack: `serverless remove --stage dev`
2. Or change table name in `serverless.yml`

### Issue: Lambda timeout

**Solution:**
1. Increase timeout in `serverless.yml`:
   ```yaml
   timeout: 60  # seconds
   ```

### Issue: CORS errors

**Solution:**
- CORS is configured in Lambda responses
- Check that frontend URL is allowed
- Verify API Gateway CORS settings

## Monitoring and Debugging

### View CloudWatch Logs

```bash
# Tail logs for specific function
serverless logs --function triage --tail

# View logs for specific time range
serverless logs --function triage --startTime 1h
```

### AWS Console Monitoring

1. Go to AWS Console → Lambda
2. Select function (e.g., `ayushscan-ai-dev-triage`)
3. Click "Monitor" tab
4. View metrics: invocations, errors, duration

### Enable X-Ray Tracing

Add to `serverless.yml`:
```yaml
provider:
  tracing:
    lambda: true
```

## Cost Estimation

### Development Stage (Low Usage)
- Lambda: Free tier (1M requests/month)
- DynamoDB: ~$1/month
- S3: ~$1/month
- Bedrock: ~$3-5/month (depends on usage)
- **Total: ~$5-10/month**

### Production Stage (Moderate Usage)
- Lambda: ~$5-10/month
- DynamoDB: ~$5-10/month
- S3: ~$2-5/month
- Bedrock: ~$20-50/month
- **Total: ~$30-75/month**

## Cleanup

To remove all AWS resources:

```bash
serverless remove --stage dev
```

This will delete:
- Lambda functions
- API Gateway
- DynamoDB table
- S3 bucket (if empty)
- CloudFormation stack

**Note:** S3 bucket must be empty before deletion. Delete objects manually if needed.

## Next Steps

1. ✅ Backend deployed
2. Configure frontend with API URL
3. Test complete flow
4. Deploy frontend to AWS Amplify
5. Set up custom domain (optional)
6. Configure monitoring alerts

## Support Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS CLI Docs](https://docs.aws.amazon.com/cli/)

## Troubleshooting Checklist

- [ ] AWS credentials configured correctly
- [ ] Bedrock model access approved
- [ ] Python dependencies installed
- [ ] Serverless Framework installed
- [ ] Correct AWS region selected
- [ ] IAM permissions sufficient
- [ ] S3 bucket name unique
- [ ] API Gateway URL saved for frontend
