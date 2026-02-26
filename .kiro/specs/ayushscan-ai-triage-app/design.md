# Design Document: AyushScan AI Triage Application

## Overview

AyushScan AI is a multimodal diagnostic triage web application built as a React frontend with a serverless AWS backend. The system enables ASHA workers to perform rapid patient assessments by combining voice-recorded symptoms (using AWS Transcribe) and optional symptom images, which are analyzed by AWS Bedrock (Claude) and AWS Rekognition to produce color-coded triage recommendations (GREEN/YELLOW/RED) and generate printable doctor referral reports.

The architecture follows a serverless cloud-native model where the React frontend handles user interaction and integrates with AWS services, while AWS Lambda functions orchestrate AI analysis via AWS Bedrock and Rekognition, manage data persistence in DynamoDB, and store assets in S3. The application is designed for deployment on AWS Amplify (frontend) with full AWS infrastructure to provide a live, accessible prototype for the "AI for Bharat Hackathon" powered by AWS.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         React Frontend (Vite) - AWS Amplify Hosted         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │ Voice Input  │  │ Image Capture│  │    Results      │ │ │
│  │  │   (AWS       │  │  (Camera/    │  │    Display      │ │ │
│  │  │  Transcribe) │  │   S3 Upload) │  │                 │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │         API Service Layer (Axios)                    │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
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
│  │ claude-sonnet│  │ (Image Label │  │                    │   │
│  │     4-6)     │  │  Detection)  │  │                    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │  DynamoDB    │  │     S3       │  │   CloudWatch       │   │
│  │  (NoSQL DB)  │  │ (Images/PDFs)│  │  (Logs/Metrics)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Assessment Initiation**: User opens Web_App → PatientForm component collects basic information
2. **Symptom Recording**: User activates VoiceRecorder → AWS Transcribe captures and transcribes audio → Transcription displayed for review
3. **Image Capture** (optional): User activates ImageCapture → Camera/file upload → Requests presigned S3 URL from `/upload-url` endpoint → Uploads image directly to S3
4. **Submission**: User submits → Frontend sends POST to `/triage` endpoint with symptoms + S3 image key
5. **AI Analysis**: 
   - Lambda receives request → Retrieves image from S3 if provided
   - Bedrock_Service formats prompt → Sends to Claude via AWS Bedrock → Receives structured response
   - Rekognition_Service analyzes image labels if image provided
   - Combines text and image analysis results
6. **Data Storage**: Lambda stores assessment record in DynamoDB with S3 references
7. **Result Display**: Lambda returns triage result → Frontend displays color-coded TriageResult component
8. **Report Generation**: User requests report → Lambda generates PDF → Uploads to S3 → Returns presigned download URL

## Components and Interfaces

### Frontend Components

#### VoiceRecorder Component
**Purpose**: Capture voice input using AWS Transcribe and convert to text

**Props**:
- `onTranscriptionComplete: (text: string) => void` - Callback when transcription is ready
- `language?: string` - Optional language code (defaults to auto-detect, supports Indian languages)

**State**:
- `isRecording: boolean` - Recording status
- `transcript: string` - Current transcription text
- `error: string | null` - Error message if recording fails
- `audioBlob: Blob | null` - Recorded audio data

**Methods**:
- `startRecording()` - Initiates MediaRecorder to capture audio
- `stopRecording()` - Stops recording and sends audio to AWS Transcribe
- `transcribeAudio(audioBlob: Blob)` - Calls backend endpoint to transcribe via AWS Transcribe
- `clearTranscript()` - Resets transcript state

**Integration with AWS Transcribe**:
```javascript
// Frontend captures audio using MediaRecorder
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (event) => {
  audioChunks.push(event.data);
};
mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
  // Send to backend Lambda which uses AWS Transcribe
  const response = await api.transcribeAudio(audioBlob);
  setTranscript(response.transcript);
};
```

#### ImageCapture Component
**Purpose**: Capture or upload images and store in AWS S3

**Props**:
- `onImageSelected: (s3Key: string) => void` - Callback when image is uploaded to S3
- `maxSizeBytes?: number` - Maximum file size (default 5MB)

**State**:
- `imagePreview: string | null` - Data URL for preview
- `captureMode: 'camera' | 'upload' | null` - Current input mode
- `error: string | null` - Error message
- `uploading: boolean` - Upload status

**Methods**:
- `openCamera()` - Activates device camera
- `capturePhoto()` - Takes photo from camera stream
- `handleFileUpload(file: File)` - Processes uploaded file
- `validateImage(file: File): boolean` - Checks format and size
- `compressImage(file: File): Promise<Blob>` - Reduces image size if needed
- `uploadToS3(file: File): Promise<string>` - Gets presigned URL and uploads to S3

**S3 Upload Flow**:
```javascript
async uploadToS3(file) {
  // 1. Request presigned URL from backend
  const { uploadUrl, s3Key } = await api.getUploadUrl(file.name, file.type);
  
  // 2. Upload directly to S3 using presigned URL
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  // 3. Return S3 key for reference
  return s3Key;
}
```

#### PatientForm Component
**Purpose**: Collect patient demographic information

**Props**:
- `onSubmit: (patientData: PatientInfo) => void` - Callback with form data

**State**:
- `patientInfo: PatientInfo` - Form field values
- `errors: Record<string, string>` - Validation errors

**Interface**:
```typescript
interface PatientInfo {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  contactNumber?: string;
  location?: string;
}
```

**Validation Rules**:
- All fields are optional to accommodate situations where ASHA workers may not have complete patient information
- If provided, age should be a positive integer between 0-120
- If provided, gender should be one of the predefined options

#### TriageResult Component
**Purpose**: Display color-coded triage assessment

**Props**:
- `severity: 'GREEN' | 'YELLOW' | 'RED'` - Triage level
- `reasoning: string` - AI explanation
- `recommendation: string` - Action to take
- `onGenerateReport: () => void` - Callback for report generation
- `onNewAssessment: () => void` - Callback to start over

**Rendering Logic**:
- GREEN: Green background, "Monitor at home" text
- YELLOW: Yellow background, "Visit clinic soon" text
- RED: Red background, "Emergency — go to hospital immediately" text

#### ReferralReport Component
**Purpose**: Generate PDF referral summary and store in S3

**Props**:
- `assessmentData: AssessmentRecord` - Complete assessment information

**Methods**:
- `generatePDF(): Promise<string>` - Creates PDF using jsPDF and uploads to S3
- `downloadPDF(s3Url: string)` - Downloads PDF from S3 presigned URL
- `sharePDF(s3Url: string)` - Uses Web Share API if available

**PDF Generation and Storage Flow**:
```javascript
async generatePDF() {
  // 1. Generate PDF using jsPDF
  const pdf = new jsPDF();
  // ... add content ...
  const pdfBlob = pdf.output('blob');
  
  // 2. Request presigned URL for PDF upload
  const { uploadUrl, s3Key } = await api.getUploadUrl('report.pdf', 'application/pdf');
  
  // 3. Upload to S3
  await fetch(uploadUrl, {
    method: 'PUT',
    body: pdfBlob,
    headers: { 'Content-Type': 'application/pdf' }
  });
  
  // 4. Get presigned download URL
  const downloadUrl = await api.getDownloadUrl(s3Key);
  return downloadUrl;
}
```

**PDF Layout**:
- Header: "AyushScan AI - Patient Referral Report"
- Patient Information section
- Symptoms section (transcribed text)
- Image section (if available, fetched from S3)
- Triage Result section (severity + reasoning)
- Footer: Timestamp, Assessment ID

### Backend Components

#### API Routes (AWS Lambda Functions)

**POST /triage** (Lambda: triage-handler)
- **Purpose**: Analyze symptoms and return triage result
- **Request Body**:
```python
{
  "patient_info": {
    "name": str,
    "age": int,
    "gender": str,
    "contact_number": Optional[str],
    "location": Optional[str]
  },
  "symptoms": str,
  "s3_image_key": Optional[str]  # S3 key if image uploaded
}
```
- **Response**:
```python
{
  "assessment_id": str,
  "severity": str,  # "GREEN" | "YELLOW" | "RED"
  "reasoning": str,
  "recommendation": str,
  "timestamp": str,
  "image_labels": Optional[List[str]]  # From Rekognition if image provided
}
```
- **Error Responses**: 400 (validation), 500 (server error), 503 (Bedrock unavailable)

**POST /report** (Lambda: report-handler)
- **Purpose**: Generate PDF referral report and store in S3
- **Request Body**:
```python
{
  "assessment_id": str
}
```
- **Response**:
```python
{
  "download_url": str,  # Presigned S3 URL
  "s3_key": str,
  "expires_in": int  # Seconds until URL expires
}
```
- **Error Responses**: 404 (assessment not found), 500 (generation failed)

**GET /upload-url** (Lambda: upload-handler)
- **Purpose**: Generate presigned S3 URL for direct uploads
- **Query Parameters**:
  - `filename`: str - Original filename
  - `content_type`: str - MIME type
- **Response**:
```python
{
  "upload_url": str,  # Presigned PUT URL
  "s3_key": str,  # Key to reference the uploaded file
  "expires_in": int  # Seconds until URL expires (300)
}
```

**GET /assessments** (Lambda: assessments-handler)
- **Purpose**: Retrieve assessment history (optional feature)
- **Query Parameters**:
  - `limit`: int - Number of records (default 10)
- **Response**:
```python
{
  "assessments": List[AssessmentRecord]
}
```

#### Bedrock Service

**Purpose**: Interface with AWS Bedrock for Claude AI symptom analysis

**Class**: `BedrockService`

**Methods**:
- `analyze_symptoms(symptoms: str, image_labels: Optional[List[str]]) -> TriageResponse`
  - Constructs prompt with symptoms and image labels from Rekognition
  - Calls AWS Bedrock with claude-sonnet-4-6 model
  - Parses structured response into TriageResponse object

**Prompt Structure**:
```
You are a medical triage assistant helping ASHA workers in rural India.

Patient Symptoms: {symptoms}
[Image Analysis: {image_labels if provided}]

Analyze the symptoms and assign a triage level:
- GREEN: Minor condition, can be monitored at home
- YELLOW: Moderate condition, should visit clinic within 24-48 hours
- RED: Severe/emergency condition, requires immediate hospital care

Provide your response in JSON format:
{
  "severity": "GREEN|YELLOW|RED",
  "reasoning": "Brief explanation of your assessment",
  "recommendation": "Specific action to take"
}
```

**Configuration**:
- Model ID: anthropic.claude-sonnet-4-6-v1:0
- Max tokens: 1024
- Temperature: 0.3 (lower for more consistent medical advice)
- Region: us-east-1 (or configured region)

**AWS SDK Integration**:
```python
import boto3
import json

bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

def analyze_symptoms(symptoms, image_labels=None):
    prompt = construct_prompt(symptoms, image_labels)
    
    response = bedrock_runtime.invoke_model(
        modelId='anthropic.claude-sonnet-4-6-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1024,
            "temperature": 0.3,
            "messages": [{
                "role": "user",
                "content": prompt
            }]
        })
    )
    
    result = json.loads(response['body'].read())
    return parse_triage_response(result)
```

#### Rekognition Service

**Purpose**: Analyze images for visible symptoms using AWS Rekognition

**Class**: `RekognitionService`

**Methods**:
- `detect_labels(s3_bucket: str, s3_key: str) -> List[str]`
  - Calls AWS Rekognition DetectLabels API
  - Filters labels relevant to medical symptoms (skin conditions, injuries, etc.)
  - Returns list of detected labels with confidence > 80%

**AWS SDK Integration**:
```python
import boto3

rekognition = boto3.client('rekognition', region_name='us-east-1')

def detect_labels(s3_bucket, s3_key):
    response = rekognition.detect_labels(
        Image={'S3Object': {'Bucket': s3_bucket, 'Name': s3_key}},
        MaxLabels=10,
        MinConfidence=80
    )
    
    labels = [label['Name'] for label in response['Labels']]
    return labels
```

#### Transcribe Service

**Purpose**: Convert voice recordings to text using AWS Transcribe

**Class**: `TranscribeService`

**Methods**:
- `transcribe_audio(audio_bytes: bytes, language_code: str = 'auto') -> str`
  - Uploads audio to S3 temporarily
  - Starts AWS Transcribe job
  - Polls for completion
  - Returns transcribed text
  - Cleans up temporary S3 file

**AWS SDK Integration**:
```python
import boto3
import time

transcribe = boto3.client('transcribe', region_name='us-east-1')
s3 = boto3.client('s3')

def transcribe_audio(audio_bytes, language_code='auto'):
    # Upload audio to S3
    temp_key = f"temp-audio/{uuid.uuid4()}.webm"
    s3.put_object(Bucket=TEMP_BUCKET, Key=temp_key, Body=audio_bytes)
    
    # Start transcription job
    job_name = f"transcribe-{uuid.uuid4()}"
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': f's3://{TEMP_BUCKET}/{temp_key}'},
        MediaFormat='webm',
        LanguageCode=language_code if language_code != 'auto' else 'en-IN',
        IdentifyLanguage=(language_code == 'auto')
    )
    
    # Poll for completion
    while True:
        status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
        if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
            break
        time.sleep(2)
    
    # Get transcript
    transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
    transcript_response = requests.get(transcript_uri)
    transcript_text = transcript_response.json()['results']['transcripts'][0]['transcript']
    
    # Cleanup
    s3.delete_object(Bucket=TEMP_BUCKET, Key=temp_key)
    transcribe.delete_transcription_job(TranscriptionJobName=job_name)
    
    return transcript_text
```

#### DynamoDB Service

**Purpose**: Persist assessment records in AWS DynamoDB

**Table Schema**:
```python
Table Name: ayushscan-assessments

Primary Key:
  - assessment_id (String, HASH key)

Attributes:
  - patient_name (String)
  - patient_age (Number)
  - patient_gender (String)
  - contact_number (String, optional)
  - location (String, optional)
  - symptoms (String)
  - s3_image_key (String, optional)
  - image_labels (List, optional)
  - severity (String)
  - reasoning (String)
  - recommendation (String)
  - timestamp (String, ISO 8601 format)

Global Secondary Index (optional):
  - timestamp-index: For querying by date
```

**Class**: `DynamoDBService`

**Methods**:
- `save_assessment(assessment: AssessmentRecord) -> str`
  - Generates unique UUID for assessment_id
  - Puts item into DynamoDB table
  - Returns assessment_id

- `get_assessment(assessment_id: str) -> Optional[AssessmentRecord]`
  - Retrieves assessment by ID using GetItem
  - Returns None if not found

- `query_recent_assessments(limit: int = 10) -> List[AssessmentRecord]`
  - Queries recent assessments using timestamp index
  - Returns list of assessments

**AWS SDK Integration**:
```python
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table('ayushscan-assessments')

def save_assessment(assessment):
    assessment_id = str(uuid.uuid4())
    item = {
        'assessment_id': assessment_id,
        'patient_name': assessment.patient_info.name,
        'patient_age': assessment.patient_info.age,
        'symptoms': assessment.symptoms,
        's3_image_key': assessment.s3_image_key,
        'severity': assessment.severity,
        'reasoning': assessment.reasoning,
        'timestamp': datetime.utcnow().isoformat()
    }
    table.put_item(Item=item)
    return assessment_id

def get_assessment(assessment_id):
    response = table.get_item(Key={'assessment_id': assessment_id})
    return response.get('Item')
```

#### S3 Service

**Purpose**: Manage file storage in AWS S3

**Buckets**:
- `ayushscan-images`: Patient symptom images
- `ayushscan-reports`: Generated PDF reports
- `ayushscan-temp`: Temporary audio files for transcription

**Class**: `S3Service`

**Methods**:
- `generate_presigned_upload_url(filename: str, content_type: str) -> dict`
  - Generates presigned PUT URL for direct uploads
  - Returns URL and S3 key
  - URL expires in 5 minutes

- `generate_presigned_download_url(s3_key: str) -> str`
  - Generates presigned GET URL for downloads
  - URL expires in 1 hour

- `get_object(s3_key: str) -> bytes`
  - Retrieves file content from S3
  - Used by Lambda functions to access images

- `put_object(s3_key: str, data: bytes, content_type: str) -> str`
  - Uploads file to S3
  - Returns S3 key

**AWS SDK Integration**:
```python
import boto3

s3 = boto3.client('s3', region_name='us-east-1')

def generate_presigned_upload_url(filename, content_type):
    s3_key = f"images/{uuid.uuid4()}/{filename}"
    url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': 'ayushscan-images',
            'Key': s3_key,
            'ContentType': content_type
        },
        ExpiresIn=300
    )
    return {'upload_url': url, 's3_key': s3_key, 'expires_in': 300}

def generate_presigned_download_url(s3_key):
    url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': 'ayushscan-reports', 'Key': s3_key},
        ExpiresIn=3600
    )
    return url
```

## Data Models

### Frontend TypeScript Interfaces

```typescript
interface PatientInfo {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  contactNumber?: string;
  location?: string;
}

interface AssessmentRequest {
  patientInfo: PatientInfo;
  symptoms: string;
  s3ImageKey?: string; // S3 key reference instead of base64
}

interface TriageResponse {
  assessmentId: string;
  severity: 'GREEN' | 'YELLOW' | 'RED';
  reasoning: string;
  recommendation: string;
  timestamp: string;
  imageLabels?: string[]; // From Rekognition
}

interface AssessmentRecord extends AssessmentRequest, TriageResponse {}

interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
}

interface ReportResponse {
  downloadUrl: string;
  s3Key: string;
  expiresIn: number;
}
```

### Backend Python Models (Pydantic)

```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PatientInfo(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = Field(None, gt=0, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    contact_number: Optional[str] = None
    location: Optional[str] = None

class AssessmentRequest(BaseModel):
    patient_info: PatientInfo
    symptoms: str = Field(min_length=10)
    s3_image_key: Optional[str] = None  # S3 key reference

class TriageResponse(BaseModel):
    assessment_id: str
    severity: str = Field(pattern="^(GREEN|YELLOW|RED)$")
    reasoning: str
    recommendation: str
    timestamp: datetime
    image_labels: Optional[List[str]] = None  # From Rekognition

class AssessmentRecord(BaseModel):
    assessment_id: str
    patient_info: PatientInfo
    symptoms: str
    s3_image_key: Optional[str]
    image_labels: Optional[List[str]]
    severity: str
    reasoning: str
    recommendation: str
    timestamp: datetime

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str

class UploadUrlResponse(BaseModel):
    upload_url: str
    s3_key: str
    expires_in: int

class ReportRequest(BaseModel):
    assessment_id: str

class ReportResponse(BaseModel):
    download_url: str
    s3_key: str
    expires_in: int
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

- Properties 5.2, 5.3, 5.4 (specific recommendation text for each severity) can be combined into one property that maps severity to recommendation
- Properties 8.1 and 8.2 (mobile/desktop layouts) can be combined into one property about responsive breakpoints
- Properties 1.1, 1.3 (voice recording activation and transcription) are part of the same workflow and can be tested together
- Properties 2.3 and 12.5 (image format validation) are testing the same validation logic
- Properties 3.2 and 3.4 (form validation) can be combined into comprehensive form validation property
- Properties 4.2 and 4.3 (response structure and severity values) can be combined into API response validation

### Voice Recording Properties

Property 1: Voice recording workflow
*For any* voice recording session, when recording is started, the Web Speech API should be activated, and when stopped, transcription should be generated and displayed
**Validates: Requirements 1.1, 1.3, 1.4**

Property 2: Recording state feedback
*For any* recording state change, the UI should display appropriate visual feedback indicating whether recording is active or inactive
**Validates: Requirements 1.2**

Property 3: Transcription editability
*For any* completed transcription, the text field should accept manual edits from the user
**Validates: Requirements 1.5**

### Image Capture Properties

Property 4: Image format validation
*For any* uploaded or captured file, the system should accept only valid image formats (JPEG, PNG, WebP) and reject all other file types with an error message
**Validates: Requirements 2.3, 12.5**

Property 5: Image preview rendering
*For any* valid image selected by the user, the UI should display a preview before submission
**Validates: Requirements 2.4**

Property 6: Image size handling
*For any* image exceeding the size limit, the system should either compress it to acceptable size or reject it with a clear error message
**Validates: Requirements 2.5**

Property 7: Camera access
*For any* camera capture request, the system should request getUserMedia permission and display a camera preview stream
**Validates: Requirements 2.2**

### Form Validation Properties

Property 8: Optional form validation
*For any* patient form submission with provided fields, the system should validate that if name is provided it's non-empty, if age is provided it's a positive integer (0-120), if gender is provided it's one of the predefined options, and allow submission even with all fields empty
**Validates: Requirements 3.2, 3.4**

Property 9: Data persistence completeness
*For any* completed assessment, the stored database record should contain all submitted patient information, symptoms, triage result, and timestamp
**Validates: Requirements 3.3, 7.1**

Property 10: Optional image storage
*For any* assessment with an included image, the database record should contain the image data; for assessments without images, the image field should be null
**Validates: Requirements 7.2**

Property 11: Unique assessment identifiers
*For any* two distinct assessments stored in the database, their assessment IDs should be different
**Validates: Requirements 7.3**

Property 12: Pre-storage validation
*For any* assessment data, the system should validate all required fields before attempting database storage, and reject invalid data without persisting
**Validates: Requirements 7.4**

### API and Claude Integration Properties

Property 13: Claude API request structure
*For any* triage request, the system should send both symptom text and optional image data to the Claude API in the correct multimodal format
**Validates: Requirements 4.1**

Property 14: Triage response validation
*For any* response from the Claude API, the parsed result should contain a valid severity level (GREEN, YELLOW, or RED), non-empty reasoning text, and a recommendation string
**Validates: Requirements 4.2, 4.3, 4.4**

Property 15: API request structure
*For any* frontend assessment submission, the POST request to /triage should include patient_info, symptoms, and optional image in the correct JSON structure
**Validates: Requirements 9.1**

Property 16: API response structure
*For any* successful triage analysis, the backend response should be valid JSON containing assessment_id, severity, reasoning, recommendation, and timestamp
**Validates: Requirements 9.2**

Property 17: Input sanitization
*For any* user input (symptoms, patient info), the system should sanitize the data to remove or escape potentially malicious content before processing
**Validates: Requirements 12.3**

Property 18: Rate limiting enforcement
*For any* sequence of API requests from the same client, the system should enforce rate limits and reject requests exceeding the threshold
**Validates: Requirements 12.6**

### UI Display Properties

Property 19: Severity-to-recommendation mapping
*For any* triage result, the displayed recommendation should correctly map to the severity: GREEN → "Monitor at home", YELLOW → "Visit clinic soon", RED → "Emergency — go to hospital immediately"
**Validates: Requirements 5.2, 5.3, 5.4**

Property 20: Severity color coding
*For any* triage result display, the UI should apply the correct color class corresponding to the severity level (green for GREEN, yellow for YELLOW, red for RED)
**Validates: Requirements 5.1**

Property 21: Reasoning display
*For any* triage result, the AI reasoning explanation should be visible in the UI alongside the severity level
**Validates: Requirements 5.5**

Property 22: Loading state indicators
*For any* asynchronous operation (API call, image processing), the UI should display a loading indicator while the operation is in progress
**Validates: Requirements 11.1**

Property 23: Error message display
*For any* error condition (API failure, validation error, recording failure), the UI should display a user-friendly error message explaining the issue
**Validates: Requirements 11.2**

Property 24: Error logging
*For any* error that occurs in the application, the system should log the error details to the console for debugging
**Validates: Requirements 11.6**

### PDF Report Properties

Property 25: Report data completeness
*For any* generated referral report, the PDF should contain all required sections: patient information, symptoms, triage result with reasoning, timestamp, and assessment ID
**Validates: Requirements 6.1, 6.4**

Property 26: PDF format validation
*For any* generated report, the output should be a valid PDF file that can be opened by standard PDF readers
**Validates: Requirements 6.2**

Property 27: Conditional image embedding
*For any* assessment with an included image, the generated PDF report should embed the image; for assessments without images, the report should not include an image section
**Validates: Requirements 6.6**

### Responsive Design Properties

Property 28: Responsive layout adaptation
*For any* viewport width from 320px to 1920px, the UI should render without horizontal scrolling and maintain usability
**Validates: Requirements 8.3**

Property 29: Breakpoint-based layouts
*For any* viewport width, the UI should apply mobile-optimized layout below 768px and desktop-optimized layout at 768px and above
**Validates: Requirements 8.1, 8.2**

Property 30: Orientation change handling
*For any* device orientation change event, the UI should re-render and adapt the layout to the new orientation
**Validates: Requirements 8.4**

Property 31: Touch target sizing
*For any* interactive element (button, input) on mobile viewports (< 768px), the element should have minimum dimensions of 44x44 pixels
**Validates: Requirements 8.5**

## Error Handling

### Frontend Error Handling

**Voice Recording Errors**:
- Microphone permission denied → Display message: "Microphone access denied. Please check browser permissions."
- MediaRecorder not supported → Display message: "Audio recording not supported in this browser."
- AWS Transcribe error → Display message: "Voice transcription failed. Please try again or type symptoms manually."
- Transcription timeout → Display message: "Transcription is taking longer than expected. Please try again."

**Image Capture Errors**:
- Camera permission denied → Display message: "Camera access denied. Please check browser permissions or upload an image instead."
- Invalid file format → Display message: "Invalid image format. Please upload JPEG, PNG, or WebP files."
- File too large → Display message: "Image too large (max 5MB). Please choose a smaller image."
- S3 upload failure → Display message: "Failed to upload image. Please check your connection and try again."
- Presigned URL expired → Display message: "Upload link expired. Please try again."

**Form Validation Errors**:
- Empty required field → Highlight field with red border and message: "This field is required"
- Invalid age → Display message: "Age must be between 0 and 120"
- Invalid gender → Display message: "Please select a valid gender option"

**API Communication Errors**:
- Network error → Display message: "Network error. Please check your connection and try again." + Retry button
- Timeout → Display message: "Request timed out. Please try again." + Retry button
- 400 Bad Request → Display message: "Invalid data submitted. Please check your inputs."
- 500 Server Error → Display message: "Server error. Please try again later." + Retry button
- 503 Service Unavailable → Display message: "AI service temporarily unavailable. Please try again in a moment." + Retry button

### Backend Error Handling

**Request Validation Errors**:
- Missing required fields → Return 400 with JSON: `{"error": "Missing required field: {field_name}"}`
- Invalid data types → Return 400 with JSON: `{"error": "Invalid data type for field: {field_name}"}`
- Malformed JSON → Return 400 with JSON: `{"error": "Invalid JSON format"}`

**AWS Bedrock Errors**:
- Model not found → Log error, return 500 with JSON: `{"error": "AI model configuration error"}`
- Throttling → Return 429 with JSON: `{"error": "Too many requests. Please try again later."}`
- Timeout → Log error, return 503 with JSON: `{"error": "AI service timeout. Please try again."}`
- Invalid response → Log error, return 500 with JSON: `{"error": "AI service returned invalid response"}`

**AWS Rekognition Errors**:
- Image not found in S3 → Return 400 with JSON: `{"error": "Image not found"}`
- Invalid image format → Return 400 with JSON: `{"error": "Invalid image format for analysis"}`
- Throttling → Log warning, continue without image analysis

**AWS Transcribe Errors**:
- Unsupported audio format → Return 400 with JSON: `{"error": "Unsupported audio format"}`
- Transcription job failed → Return 500 with JSON: `{"error": "Transcription failed. Please try again."}`
- Timeout → Return 503 with JSON: `{"error": "Transcription timeout. Please try again."}`

**DynamoDB Errors**:
- Connection failure → Log error, return 500 with JSON: `{"error": "Database connection failed"}`
- Write failure → Log error, return 500 with JSON: `{"error": "Failed to save assessment"}`
- Item not found → Return 404 with JSON: `{"error": "Assessment not found"}`
- Throttling → Implement exponential backoff retry

**S3 Errors**:
- Bucket not found → Log error, return 500 with JSON: `{"error": "Storage configuration error"}`
- Access denied → Log error, return 500 with JSON: `{"error": "Storage access error"}`
- Object not found → Return 404 with JSON: `{"error": "File not found"}`
- Upload failure → Return 500 with JSON: `{"error": "Failed to upload file"}`

### Error Recovery Strategies

**Retry Logic**:
- Frontend implements exponential backoff for API retries (1s, 2s, 4s)
- Maximum 3 retry attempts before showing persistent error
- User can manually trigger retry via button

**Graceful Degradation**:
- If voice transcription fails, allow manual text entry
- If image upload fails, allow proceeding without image
- If Rekognition fails, continue with text-only analysis
- If PDF generation fails, display results on screen with copy option

**Logging**:
- Frontend logs errors to console with context (component, action, error details)
- Lambda functions log errors to CloudWatch with timestamp, request ID, and stack trace
- Critical errors (Bedrock failures, DynamoDB errors) logged at ERROR level
- Validation errors logged at WARNING level
- All AWS SDK calls logged with request IDs for tracing

## Testing Strategy

### Dual Testing Approach

This application requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs using randomized testing

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**:
- Frontend (TypeScript/JavaScript): **fast-check** - mature PBT library for JavaScript
- Backend (Python): **Hypothesis** - industry-standard PBT library for Python

**Test Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must include a comment tag referencing the design property
- Tag format: `// Feature: ayushscan-ai-triage-app, Property {number}: {property_text}`

**Example Property Test Structure (Frontend)**:

```typescript
import fc from 'fast-check';

// Feature: ayushscan-ai-triage-app, Property 8: Comprehensive form validation
test('form validation rejects invalid patient data', () => {
  fc.assert(
    fc.property(
      fc.record({
        name: fc.string(),
        age: fc.integer(),
        gender: fc.string()
      }),
      (patientData) => {
        const isValid = validatePatientForm(patientData);
        const hasValidName = patientData.name.length >= 2;
        const hasValidAge = patientData.age > 0 && patientData.age <= 120;
        const hasValidGender = ['male', 'female', 'other'].includes(patientData.gender);
        
        if (hasValidName && hasValidAge && hasValidGender) {
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Example Property Test Structure (Backend)**:

```python
from hypothesis import given, strategies as st

# Feature: ayushscan-ai-triage-app, Property 14: Triage response validation
@given(st.builds(TriageResponse))
def test_triage_response_has_valid_severity(response):
    """For any triage response, severity must be GREEN, YELLOW, or RED"""
    assert response.severity in ['GREEN', 'YELLOW', 'RED']
    assert len(response.reasoning) > 0
    assert len(response.recommendation) > 0
```

### Unit Testing Strategy

**Frontend Unit Tests** (Jest + React Testing Library):
- Component rendering tests for each UI component
- User interaction tests (button clicks, form submissions)
- State management tests
- API service mocking and integration tests
- S3 upload flow tests
- Error boundary tests

**Backend Unit Tests** (pytest):
- Lambda handler tests with various payloads
- DynamoDB CRUD operation tests
- AWS Bedrock integration tests (mocked)
- AWS Rekognition integration tests (mocked)
- AWS Transcribe integration tests (mocked)
- S3 presigned URL generation tests
- Validation logic tests

**Coverage Goals**:
- Minimum 80% code coverage for both frontend and backend
- 100% coverage for critical paths (triage analysis, data persistence, S3 operations)
- All error handling paths must be tested

### Integration Testing

**End-to-End Flow Tests**:
1. Complete assessment flow: form submission → voice/image capture → S3 upload → API call → result display
2. Report generation flow: assessment completion → report request → PDF generation → S3 storage → download
3. Error recovery flow: API failure → error display → retry → success
4. AWS service integration: Bedrock, Rekognition, Transcribe, DynamoDB, S3

**API Integration Tests**:
- Test actual HTTP communication between frontend and API Gateway
- Verify request/response formats match specifications
- Test CORS configuration
- Test error responses and status codes
- Test Lambda function invocations

### Test Organization

**Frontend Test Structure**:
```
frontend/src/
├── components/
│   ├── VoiceRecorder.test.tsx
│   ├── ImageCapture.test.tsx
│   ├── PatientForm.test.tsx
│   ├── TriageResult.test.tsx
│   └── ReferralReport.test.tsx
├── services/
│   ├── api.test.ts
│   ├── s3Service.test.ts
│   └── transcribeService.test.ts
└── __tests__/
    ├── integration/
    │   └── assessment-flow.test.tsx
    └── properties/
        ├── form-validation.property.test.ts
        ├── image-validation.property.test.ts
        └── ui-rendering.property.test.ts
```

**Backend Test Structure**:
```
backend/
├── tests/
│   ├── test_handlers.py
│   ├── test_bedrock_service.py
│   ├── test_rekognition_service.py
│   ├── test_transcribe_service.py
│   ├── test_dynamodb_service.py
│   ├── test_s3_service.py
│   └── properties/
│       ├── test_validation_properties.py
│       ├── test_api_properties.py
│       └── test_data_properties.py
```py
```

### Mocking Strategy

**Frontend Mocks**:
- Mock MediaRecorder for voice recording tests
- Mock getUserMedia for camera tests
- Mock fetch/axios for API calls
- Mock S3 presigned URL uploads
- Mock jsPDF for PDF generation tests

**Backend Mocks**:
- Mock AWS Bedrock client for unit tests
- Mock AWS Rekognition client for unit tests
- Mock AWS Transcribe client for unit tests
- Mock DynamoDB resource for database tests
- Mock S3 client for storage tests
- Use LocalStack for local AWS service emulation (optional)

### Test Data Generators

**Property Test Generators**:
- Patient info generator: random names, ages (0-120), genders
- Symptom text generator: random medical symptom descriptions
- S3 key generator: random valid S3 object keys
- Image data generator: random valid/invalid image files
- API response generator: random triage responses with valid structure
- DynamoDB item generator: random assessment records

**Edge Cases to Test**:
- Empty strings, very long strings (>10000 chars)
- Boundary ages (0, 1, 119, 120, -1, 121)
- Special characters in text inputs
- Very large images (>10MB)
- Malformed JSON payloads
- Concurrent DynamoDB writes
- Network timeouts and interruptions
- S3 presigned URL expiration
- AWS service throttling scenarios
