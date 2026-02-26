# AyushScan AI Backend - Quick Start Guide

Get the backend running in 10 minutes!

## Prerequisites

- AWS Account
- Node.js installed
- Python 3.11 installed

## Quick Setup (5 steps)

### 1. Install Serverless Framework

```bash
npm install -g serverless
```

### 2. Configure AWS

```bash
aws configure
```

Enter your AWS credentials and set region to `ap-south-1`.

### 3. Enable Bedrock Model

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock)
2. Click "Model access" → "Manage model access"
3. Enable "Claude 3.5 Sonnet"
4. Click "Save changes"

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
npm install
```

### 5. Deploy!

```bash
serverless deploy --stage dev
```

**Done!** Copy the API Gateway URL from the output.

## Test Your Deployment

```bash
curl -X POST https://YOUR_API_URL/dev/triage \
  -H "Content-Type: application/json" \
  -d '{
    "voice_transcript": "Patient has fever and headache for 3 days"
  }'
```

You should get a JSON response with triage assessment!

## What's Next?

1. Save your API Gateway URL
2. Configure frontend with this URL
3. Test all endpoints
4. Deploy frontend to AWS Amplify

## Common Issues

**"Bedrock model not found"**
→ Enable Claude 3.5 Sonnet in AWS Console

**"Access Denied"**
→ Check AWS credentials: `aws sts get-caller-identity`

**"Bucket already exists"**
→ Change bucket name in `serverless.yml` to something unique

## Need Help?

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- Check [README.md](./README.md) for API documentation

## Cleanup

To remove everything:

```bash
serverless remove --stage dev
```

This deletes all AWS resources created by the deployment.
