# AyushScan AI - Backend (AWS Lambda)

AWS serverless backend for AyushScan AI diagnostic triage application.

## Architecture

- **AWS Lambda**: Serverless compute for API handlers
- **AWS API Gateway**: REST API endpoints
- **AWS Bedrock**: Claude AI for symptom analysis
- **AWS Rekognition**: Image analysis for visual symptoms
- **AWS Transcribe**: Voice-to-text transcription
- **AWS DynamoDB**: NoSQL database for assessments
- **AWS S3**: File storage for images and PDFs

## Project Structure

```
backend/
├── serverless.yml           # Serverless Framework configuration
├── requirements.txt         # Python dependencies
├── shared/                  # Shared services and utilities
│   ├── schemas.py          # Pydantic data models
│   ├── bedrock_service.py  # AWS Bedrock integration
│   ├── rekognition_service.py  # AWS Rekognition integration
│   ├── dynamodb_service.py # DynamoDB operations
│   └── s3_service.py       # S3 file operations
└── functions/              # Lambda function handlers
    ├── triage/
    │   └── handler.py      # POST /triage
    ├── report/
    │   └── handler.py      # POST /report
    ├── upload/
    │   └── handler.py      # GET /upload-url
    └── assessments/
        └── handler.py      # GET /assessments
```

## Prerequisites

1. **Node.js and npm** (for Serverless Framework)
2. **Python 3.11**
3. **AWS CLI** configured with credentials
4. **Serverless Framework**:
   ```bash
   npm install -g serverless
   ```

## Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure AWS credentials**:
   ```bash
   aws configure
   ```
   Enter your AWS Access Key ID, Secret Access Key, and region (ap-south-1).

3. **Enable AWS Bedrock models**:
   - Go to AWS Console → Bedrock → Model access
   - Request access to Claude 3.5 Sonnet model
   - Wait for approval (usually instant)

## Deployment

### Deploy to AWS

```bash
serverless deploy --stage dev
```

This will:
- Create DynamoDB table
- Create S3 bucket
- Deploy Lambda functions
- Set up API Gateway
- Configure IAM roles

### Deploy to production

```bash
serverless deploy --stage prod
```

## API Endpoints

After deployment, you'll get API Gateway URLs:

### POST /triage
Analyze patient symptoms and return triage assessment.

**Request**:
```json
{
  "patient_info": {
    "name": "Patient Name",
    "age": 35,
    "gender": "female",
    "location": "Village Name"
  },
  "voice_transcript": "Patient complains of fever and headache for 3 days...",
  "image_s3_key": "uploads/uuid.jpg"
}
```

**Response**:
```json
{
  "assessment_id": "uuid",
  "triage_level": "YELLOW",
  "confidence_score": 0.85,
  "symptoms_detected": ["fever", "headache"],
  "primary_concern": "Possible viral infection",
  "recommended_action": "Visit clinic within 24 hours",
  "urgency_reason": "Persistent fever requires medical evaluation",
  "follow_up_questions": ["Duration of fever?", "Any other symptoms?"]
}
```

### GET /upload-url
Get presigned S3 URL for file upload.

**Query Parameters**:
- `file_type`: MIME type (default: image/jpeg)

**Response**:
```json
{
  "upload_url": "https://s3.amazonaws.com/...",
  "s3_key": "uploads/uuid.jpg",
  "expires_in": 300
}
```

### POST /report
Generate PDF report for an assessment.

**Request**:
```json
{
  "assessment_id": "uuid"
}
```

**Response**:
```json
{
  "report_s3_url": "https://s3.amazonaws.com/...",
  "s3_key": "reports/uuid.pdf",
  "expires_in": 3600
}
```

### GET /assessments
List recent assessments.

**Query Parameters**:
- `limit`: Number of records (default: 20)

**Response**:
```json
{
  "assessments": [...],
  "count": 10
}
```

## Local Testing

### Test individual functions

```bash
serverless invoke local --function triage --path test-data/triage-request.json
```

### View logs

```bash
serverless logs --function triage --tail
```

## Environment Variables

Set in `serverless.yml`:
- `DYNAMODB_TABLE`: DynamoDB table name
- `S3_BUCKET`: S3 bucket name
- `BEDROCK_REGION`: AWS region for Bedrock (us-east-1)

## Monitoring

- **CloudWatch Logs**: Automatic logging for all Lambda functions
- **CloudWatch Metrics**: Monitor invocations, errors, duration
- **X-Ray**: Enable tracing in serverless.yml for detailed insights

## Cost Optimization

- **Lambda**: Pay per request (free tier: 1M requests/month)
- **DynamoDB**: On-demand billing (pay per request)
- **S3**: Pay per storage and requests
- **Bedrock**: Pay per token (input + output)
- **Rekognition**: Pay per image analyzed

Estimated cost for development: $5-10/month

## Troubleshooting

### Bedrock model not found
- Ensure you've requested access to Claude 3.5 Sonnet in AWS Console
- Check the model ID in `bedrock_service.py`

### Permission errors
- Verify IAM roles in `serverless.yml`
- Check AWS credentials are configured correctly

### CORS errors
- CORS is configured in Lambda responses
- Check API Gateway CORS settings if issues persist

## Security

- API keys and credentials managed via AWS IAM
- S3 presigned URLs expire after 5 minutes (upload) or 1 hour (download)
- Input validation using Pydantic
- No sensitive data in logs

## Support

For issues or questions, refer to:
- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [AWS Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
