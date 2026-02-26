# AyushScan AI Backend - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                     Hosted on AWS Amplify                        │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  /triage  │  /report  │  /upload-url  │  /assessments    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Lambda Functions                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Triage     │  │    Report    │  │   Upload URL       │   │
│  │   Handler    │  │   Handler    │  │   Handler          │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Shared Service Layer                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │ Bedrock  │  │Rekognition│ │Transcribe│  │   S3    │ │  │
│  │  │ Service  │  │  Service  │ │  Service │  │ Service │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │  │
│  │  ┌──────────┐  ┌──────────┐                             │  │
│  │  │ DynamoDB │  │   PDF    │                             │  │
│  │  │ Service  │  │Generator │                             │  │
│  │  └──────────┘  └──────────┘                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Services                                │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ AWS Bedrock  │  │     AWS      │  │   AWS Transcribe   │   │
│  │   (Claude    │  │ Rekognition  │  │  (Voice-to-Text)   │   │
│  │ Sonnet 3.5)  │  │ (Image Label │  │                    │   │
│  │              │  │  Detection)  │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  DynamoDB    │  │     S3       │  │   CloudWatch       │   │
│  │  (NoSQL DB)  │  │ (Images/PDFs)│  │  (Logs/Metrics)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Triage Assessment Flow

```
User → Frontend → API Gateway → Triage Lambda
                                      ↓
                              ┌───────┴────────┐
                              ↓                ↓
                        Rekognition      Bedrock (Claude)
                        (if image)       (symptom analysis)
                              ↓                ↓
                              └───────┬────────┘
                                      ↓
                                  DynamoDB
                                  (save record)
                                      ↓
                              Response to Frontend
```

### 2. Image Upload Flow

```
User → Frontend → Upload Lambda → S3 Presigned URL
                                        ↓
Frontend → Direct S3 Upload (bypasses Lambda)
                ↓
        S3 Key returned to Frontend
                ↓
        Included in Triage Request
```

### 3. Report Generation Flow

```
User → Frontend → Report Lambda
                        ↓
                  DynamoDB (get assessment)
                        ↓
                  Bedrock (generate HTML)
                        ↓
                  ReportLab (HTML → PDF)
                        ↓
                  S3 (save PDF)
                        ↓
                  Presigned URL → Frontend
```

## Lambda Functions

### 1. Triage Handler (`POST /triage`)

**Purpose**: Analyze patient symptoms and return triage assessment

**Input**:
```json
{
  "patient_info": {...},
  "voice_transcript": "string",
  "image_s3_key": "string (optional)"
}
```

**Process**:
1. Validate request using Pydantic
2. If image provided: Call Rekognition for label detection
3. Call Bedrock Claude with symptoms + image labels
4. Parse AI response (triage level, confidence, recommendations)
5. Save assessment to DynamoDB
6. Return triage result

**Output**:
```json
{
  "assessment_id": "uuid",
  "triage_level": "GREEN|YELLOW|RED",
  "confidence_score": 0.85,
  "symptoms_detected": [...],
  "primary_concern": "string",
  "recommended_action": "string",
  "urgency_reason": "string",
  "follow_up_questions": [...]
}
```

**Timeout**: 30 seconds

### 2. Report Handler (`POST /report`)

**Purpose**: Generate PDF report for an assessment

**Input**:
```json
{
  "assessment_id": "uuid"
}
```

**Process**:
1. Retrieve assessment from DynamoDB
2. Generate PDF using ReportLab
3. Upload PDF to S3
4. Generate presigned download URL
5. Return URL

**Output**:
```json
{
  "report_s3_url": "presigned URL",
  "s3_key": "reports/uuid.pdf",
  "expires_in": 3600
}
```

**Timeout**: 30 seconds

### 3. Upload URL Handler (`GET /upload-url`)

**Purpose**: Generate presigned S3 URL for direct file upload

**Input**: Query parameter `file_type` (default: image/jpeg)

**Process**:
1. Generate unique S3 key
2. Create presigned PUT URL (5 min expiry)
3. Return URL and key

**Output**:
```json
{
  "upload_url": "presigned URL",
  "s3_key": "uploads/uuid.jpg",
  "expires_in": 300
}
```

**Timeout**: Default (6 seconds)

### 4. Assessments Handler (`GET /assessments`)

**Purpose**: List recent assessments

**Input**: Query parameter `limit` (default: 20)

**Process**:
1. Scan DynamoDB table
2. Sort by timestamp
3. Return list

**Output**:
```json
{
  "assessments": [...],
  "count": 10
}
```

**Timeout**: Default (6 seconds)

## Shared Services

### BedrockService

**Purpose**: Interface with AWS Bedrock for Claude AI

**Key Methods**:
- `analyze_symptoms()`: Analyze patient symptoms
- `generate_report_content()`: Generate HTML for PDF report

**Model**: Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`)

**Configuration**:
- Temperature: 0.3 (conservative for medical advice)
- Max tokens: 2000
- Region: us-east-1

### RekognitionService

**Purpose**: Analyze images for medical-relevant labels

**Key Methods**:
- `analyze_image()`: Detect labels in S3 image
- `format_labels_for_prompt()`: Format for Claude

**Configuration**:
- Max labels: 20
- Min confidence: 70%
- Filters for medical keywords

### DynamoDBService

**Purpose**: Persist assessment records

**Key Methods**:
- `save_assessment()`: Store new assessment
- `get_assessment()`: Retrieve by ID
- `list_assessments()`: List recent records

**Table Schema**:
- Primary key: `assessment_id` (String)
- Attributes: patient_info, symptoms, triage_level, etc.

### S3Service

**Purpose**: Manage file storage

**Key Methods**:
- `generate_upload_url()`: Presigned PUT URL
- `generate_download_url()`: Presigned GET URL
- `save_pdf()`: Upload PDF
- `get_object()`: Retrieve file

**Buckets**:
- `ayushscan-storage-{stage}/uploads/`: User-uploaded images
- `ayushscan-storage-{stage}/reports/`: Generated PDF reports

## Security

### IAM Permissions

Lambda execution role has permissions for:
- DynamoDB: PutItem, GetItem, Scan, Query
- S3: PutObject, GetObject, DeleteObject
- Bedrock: InvokeModel
- Rekognition: DetectLabels, DetectModerationLabels
- Transcribe: StartTranscriptionJob, GetTranscriptionJob

### Data Protection

- **In Transit**: HTTPS for all API calls
- **At Rest**: S3 encryption enabled
- **Presigned URLs**: Time-limited (5 min upload, 1 hour download)
- **Input Validation**: Pydantic schemas
- **CORS**: Configured for frontend origin

### Privacy

- Patient data stored in DynamoDB (encrypted at rest)
- Images stored in S3 with unique UUIDs
- No PII in CloudWatch logs
- Presigned URLs expire automatically

## Scalability

### Auto-Scaling

- **Lambda**: Automatic scaling (up to 1000 concurrent executions)
- **DynamoDB**: On-demand billing (auto-scales)
- **S3**: Unlimited storage
- **API Gateway**: Handles millions of requests

### Performance

- **Cold Start**: ~2-3 seconds (first invocation)
- **Warm Start**: ~100-200ms
- **Bedrock Latency**: ~2-5 seconds
- **Rekognition Latency**: ~1-2 seconds
- **Total Triage Time**: ~5-10 seconds

### Cost Optimization

- On-demand billing for DynamoDB
- Lambda charged per 100ms
- S3 lifecycle policies for old files
- Bedrock charged per token

## Monitoring

### CloudWatch Logs

All Lambda functions log to CloudWatch:
- Request/response details
- Error stack traces
- Service call results

### CloudWatch Metrics

- Lambda invocations
- Error count
- Duration
- Throttles

### Alarms (Optional)

- High error rate
- Long duration
- Throttling

## Error Handling

### Lambda Level

- Try-catch blocks in all handlers
- Structured error responses
- HTTP status codes: 200, 400, 404, 500

### Service Level

- Retry logic for transient failures
- Graceful degradation (e.g., continue without Rekognition)
- Detailed error logging

### Client Level

- User-friendly error messages
- Retry suggestions
- Fallback options

## Deployment

### Infrastructure as Code

All resources defined in `serverless.yml`:
- Lambda functions
- API Gateway
- DynamoDB table
- S3 bucket
- IAM roles

### CI/CD (Optional)

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install -g serverless
      - run: serverless deploy --stage prod
```

### Environments

- **dev**: Development/testing
- **prod**: Production

Each environment has separate:
- DynamoDB table
- S3 bucket
- Lambda functions
- API Gateway

## Future Enhancements

1. **Caching**: Add Redis/ElastiCache for frequent queries
2. **Queue**: Use SQS for async processing
3. **CDN**: CloudFront for S3 assets
4. **Custom Domain**: Route53 + API Gateway custom domain
5. **Authentication**: Cognito for user management
6. **Analytics**: Kinesis for real-time analytics
7. **Multi-Region**: Deploy to multiple regions for HA
