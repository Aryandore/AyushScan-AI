# Implementation Plan: AyushScan AI Triage Application

## Overview

This implementation plan breaks down the AyushScan AI application into incremental coding tasks. The approach follows a bottom-up strategy: first establishing the AWS infrastructure and Lambda functions, then building frontend components with AWS service integrations, and finally deploying everything to AWS. Each task builds on previous work, with checkpoints to ensure stability before proceeding.

The application uses a full AWS serverless architecture: AWS Amplify (frontend hosting), AWS Lambda + API Gateway (backend), AWS Bedrock (Claude AI), AWS Rekognition (image analysis), AWS Transcribe (voice-to-text), DynamoDB (database), and S3 (file storage).

## Tasks

- [ ] 1. Set up project structure and AWS infrastructure
  - Create frontend directory with Vite + React + TypeScript + Tailwind CSS
  - Create backend directory with Serverless Framework structure
  - Install frontend dependencies (react, axios, jspdf, fast-check, aws-sdk for S3 presigned URLs)
  - Install backend dependencies (boto3, pydantic, hypothesis)
  - Configure Tailwind CSS with mobile-first responsive design
  - Create serverless.yml for Lambda functions and API Gateway
  - Create infrastructure YAML files for DynamoDB tables and S3 buckets
  - Set up environment variable configuration (.env files)
  - Create .gitignore for both frontend and backend
  - Create amplify.yml for AWS Amplify deployment
  - _Requirements: 10.6_

- [ ] 2. Implement backend data models and AWS service integrations
  - [ ] 2.1 Create Pydantic schemas for PatientInfo, AssessmentRequest, TriageResponse, AssessmentRecord, UploadUrlRequest, UploadUrlResponse, ReportRequest, ReportResponse
    - Define all data models with proper validation rules
    - Make all PatientInfo fields optional
    - Add field validators for age (0-120) and gender (male/female/other)
    - Update models to use s3_image_key instead of base64 image data
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property test for PatientInfo validation
    - **Property 8: Optional form validation**
    - **Validates: Requirements 3.2, 3.4**

  - [ ] 2.3 Implement DynamoDB service
    - Create DynamoDBService class with boto3 client
    - Implement save_assessment method with UUID generation
    - Implement get_assessment method for retrieval by ID
    - Implement query_recent_assessments method (optional)
    - Handle DynamoDB exceptions and throttling
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 2.4 Write property tests for DynamoDB operations
    - **Property 9: Data persistence completeness**
    - **Property 10: Optional image storage**
    - **Property 11: Unique assessment identifiers**
    - **Property 12: Pre-storage validation**
    - **Validates: Requirements 3.3, 7.1, 7.2, 7.3, 7.4**

  - [ ]* 2.5 Write unit tests for DynamoDB error handling
    - Test connection failures
    - Test write failures
    - Test item not found scenarios
    - Test throttling scenarios
    - _Requirements: 7.5_

- [ ] 3. Implement AWS Bedrock and Rekognition services
  - [ ] 3.1 Create BedrockService class with analyze_symptoms method
    - Initialize boto3 bedrock-runtime client
    - Construct prompt with symptoms and optional image labels from Rekognition
    - Call AWS Bedrock with claude-sonnet-4-6 model (anthropic.claude-sonnet-4-6-v1:0)
    - Parse JSON response into TriageResponse object
    - Implement timeout handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 3.2 Create RekognitionService class with detect_labels method
    - Initialize boto3 rekognition client
    - Implement detect_labels to analyze images from S3
    - Filter labels relevant to medical symptoms
    - Return list of detected labels with confidence > 80%
    - Handle Rekognition exceptions gracefully
    - _Requirements: 4.1_

  - [ ]* 3.3 Write property test for Bedrock response validation
    - **Property 14: Triage response validation**
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [ ]* 3.4 Write unit tests for AWS service error handling
    - Test Bedrock model not found scenario
    - Test Bedrock throttling scenario
    - Test Bedrock timeout scenario
    - Test Rekognition image not found
    - Test Rekognition invalid format
    - _Requirements: 4.5_

- [ ] 4. Implement S3 and Transcribe services
  - [ ] 4.1 Create S3Service class with presigned URL and file operations
    - Initialize boto3 S3 client
    - Implement generate_presigned_upload_url for direct uploads (5 min expiry)
    - Implement generate_presigned_download_url for downloads (1 hour expiry)
    - Implement get_object to retrieve files from S3
    - Implement put_object to upload files to S3
    - Handle S3 exceptions (bucket not found, access denied, object not found)
    - _Requirements: 2.1, 2.3, 2.5_

  - [ ] 4.2 Create TranscribeService class with audio transcription
    - Initialize boto3 transcribe and S3 clients
    - Implement transcribe_audio method
    - Upload audio to temporary S3 location
    - Start AWS Transcribe job with language detection
    - Poll for job completion
    - Retrieve and parse transcript
    - Clean up temporary S3 files
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ]* 4.3 Write property tests for S3 operations
    - **Property 4: Image format validation** (adapted for S3)
    - **Property 6: Image size handling**
    - **Validates: Requirements 2.3, 2.5**

  - [ ]* 4.4 Write unit tests for S3 and Transcribe errors
    - Test S3 bucket not found
    - Test S3 access denied
    - Test S3 object not found
    - Test presigned URL expiration
    - Test Transcribe unsupported format
    - Test Transcribe job failure
    - _Requirements: 11.4_

- [ ] 5. Implement AWS Lambda handlers
  - [ ] 5.1 Create triage Lambda handler (POST /triage)
    - Accept AssessmentRequest with patient_info, symptoms, optional s3_image_key
    - Validate request body using Pydantic
    - If s3_image_key provided, call RekognitionService to analyze image
    - Call BedrockService to analyze symptoms with optional image labels
    - Call DynamoDBService to save assessment
    - Return TriageResponse with assessment_id and image_labels
    - Implement error handling for all failure modes
    - _Requirements: 4.1, 9.1, 9.2, 9.5_

  - [ ] 5.2 Create upload-url Lambda handler (GET /upload-url)
    - Accept query parameters: filename, content_type
    - Validate parameters
    - Call S3Service to generate presigned upload URL
    - Return UploadUrlResponse with upload_url, s3_key, expires_in
    - Implement error handling
    - _Requirements: 2.1_

  - [ ] 5.3 Create report Lambda handler (POST /report)
    - Accept ReportRequest with assessment_id
    - Retrieve assessment from DynamoDB
    - Generate PDF using ReportLab with all required sections
    - Include patient info, symptoms, triage result, reasoning, timestamp, assessment ID
    - If s3_image_key present, fetch image from S3 and embed in PDF
    - Upload PDF to S3
    - Generate presigned download URL
    - Return ReportResponse with download_url, s3_key, expires_in
    - _Requirements: 6.1, 6.2, 6.4, 6.6_

  - [ ] 5.4 Create assessments Lambda handler (GET /assessments) - optional
    - Accept query parameter: limit (default 10)
    - Query recent assessments from DynamoDB
    - Return list of AssessmentRecord objects
    - _Requirements: 7.1_

  - [ ] 5.5 Configure API Gateway and CORS
    - Define API Gateway REST API in serverless.yml
    - Map Lambda functions to endpoints
    - Configure CORS headers for AWS Amplify origin and localhost
    - Set up request/response transformations
    - _Requirements: 9.6_

  - [ ]* 5.6 Write property tests for Lambda handlers
    - **Property 13: Bedrock request structure**
    - **Property 15: API request structure**
    - **Property 16: API response structure**
    - **Property 17: Input sanitization**
    - **Validates: Requirements 4.1, 9.1, 9.2, 12.3**

  - [ ]* 5.7 Write unit tests for Lambda error responses
    - Test 400 for missing required fields
    - Test 400 for invalid data types
    - Test 400 for malformed JSON
    - Test 404 for assessment not found
    - Test 500 for server errors
    - Test 503 for Bedrock unavailable
    - _Requirements: 9.3_

- [ ] 6. Checkpoint - Backend Lambda functions complete
  - Ensure all backend tests pass
  - Deploy Lambda functions to AWS using Serverless Framework
  - Test /triage endpoint with curl or Postman
  - Test /upload-url endpoint
  - Test /report endpoint
  - Verify DynamoDB records are created correctly
  - Verify S3 uploads work with presigned URLs
  - Ask the user if questions arise

- [ ] 7. Implement frontend API service layer
  - [ ] 7.1 Create api.js service with axios
    - Configure base URL from environment variable (API Gateway URL)
    - Implement submitAssessment function (POST /triage)
    - Implement getUploadUrl function (GET /upload-url)
    - Implement uploadToS3 function (direct S3 upload with presigned URL)
    - Implement generateReport function (POST /report)
    - Implement getAssessments function (GET /assessments) - optional
    - Add request/response interceptors for error handling
    - Implement retry logic with exponential backoff (1s, 2s, 4s, max 3 attempts)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 7.2 Create s3Service.js for S3 operations
    - Implement requestUploadUrl to get presigned URL from backend
    - Implement uploadFile to upload directly to S3 using presigned URL
    - Handle upload progress tracking
    - Handle S3 upload errors
    - _Requirements: 2.1, 2.5_

  - [ ] 7.3 Create transcribeService.js for voice transcription
    - Implement recordAudio using MediaRecorder
    - Implement sendAudioForTranscription to backend
    - Handle transcription response
    - Handle transcription errors
    - _Requirements: 1.1, 1.3_

  - [ ]* 7.4 Write property tests for API service
    - **Property 15: API request structure**
    - **Validates: Requirements 9.1**

  - [ ]* 7.5 Write unit tests for API error handling
    - Test network error handling
    - Test timeout handling
    - Test retry logic
    - Test error message formatting
    - Test S3 upload failures
    - _Requirements: 9.3_

- [ ] 8. Implement VoiceRecorder component
  - [ ] 8.1 Create VoiceRecorder.jsx with MediaRecorder and AWS Transcribe integration
    - Initialize MediaRecorder to capture audio
    - Implement startRecording to activate recording
    - Implement stopRecording to finalize audio capture
    - Send audio blob to backend for AWS Transcribe processing
    - Display recording status indicator (red dot when active)
    - Display transcript text in editable textarea
    - Handle recording errors with user-friendly messages
    - Handle transcription errors (timeout, service unavailable)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 11.3_

  - [ ]* 8.2 Write property tests for voice recording
    - **Property 1: Voice recording workflow**
    - **Property 2: Recording state feedback**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

  - [ ]* 8.3 Write unit tests for voice recording errors
    - Test microphone permission denied
    - Test MediaRecorder not supported
    - Test transcription error handling
    - Test transcription timeout
    - _Requirements: 11.3_

- [ ] 9. Implement ImageCapture component
  - [ ] 9.1 Create ImageCapture.jsx with camera, upload, and S3 integration
    - Display buttons for "Take Photo" and "Upload Image"
    - Implement openCamera using getUserMedia API
    - Implement capturePhoto from video stream
    - Implement handleFileUpload for file input
    - Validate image format and size client-side
    - Display image preview after selection
    - Compress large images using canvas API if needed
    - Request presigned S3 URL from backend
    - Upload image directly to S3 using presigned URL
    - Return S3 key to parent component
    - Handle camera/upload errors with user-friendly messages
    - Handle S3 upload errors (network failure, presigned URL expired)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 11.4_

  - [ ]* 9.2 Write property tests for image capture
    - **Property 4: Image format validation**
    - **Property 5: Image preview rendering**
    - **Property 6: Image size handling**
    - **Property 7: Camera access**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

  - [ ]* 9.3 Write unit tests for image capture errors
    - Test camera permission denied
    - Test invalid file format
    - Test file too large
    - Test S3 upload failure
    - Test presigned URL expiration
    - _Requirements: 11.4_

- [ ] 10. Implement PatientForm component
  - [ ] 10.1 Create PatientForm.jsx with optional input fields
    - Create form with optional fields: name, age, gender, contact, location
    - Implement validation for provided fields (age 0-120, gender from options)
    - Display validation errors inline
    - Allow submission even with all fields empty
    - Call onSubmit callback with form data
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [ ]* 10.2 Write property test for form validation
    - **Property 8: Optional form validation**
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 10.3 Write unit tests for form validation errors
    - Test empty form submission (should succeed)
    - Test invalid age handling
    - Test invalid gender handling
    - Test error message display
    - _Requirements: 3.2_

- [ ] 11. Implement TriageResult component
  - [ ] 11.1 Create TriageResult.jsx with color-coded display
    - Display severity level with appropriate color (green/yellow/red background)
    - Map severity to recommendation text (GREEN → "Monitor at home", YELLOW → "Visit clinic soon", RED → "Emergency — go to hospital immediately")
    - Display AI reasoning explanation
    - Add "Generate Report" button
    - Add "New Assessment" button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 11.2 Write property tests for triage result display
    - **Property 19: Severity-to-recommendation mapping**
    - **Property 20: Severity color coding**
    - **Property 21: Reasoning display**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [ ]* 11.3 Write unit tests for triage result rendering
    - Test GREEN severity rendering
    - Test YELLOW severity rendering
    - Test RED severity rendering
    - Test button functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 12. Implement ReferralReport component
  - [ ] 12.1 Create ReferralReport.jsx with PDF generation and S3 storage
    - Implement generatePDF using jsPDF
    - Include header: "AyushScan AI - Patient Referral Report"
    - Add patient information section (if provided)
    - Add symptoms section with transcribed text
    - Add image section (fetch from S3 if available and embed)
    - Add triage result section with severity and reasoning
    - Add footer with timestamp and assessment ID
    - Upload generated PDF to S3 using presigned URL
    - Get presigned download URL from backend
    - Implement downloadPDF to trigger browser download from S3 URL
    - Implement sharePDF using Web Share API if available
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

  - [ ]* 12.2 Write property tests for PDF generation
    - **Property 25: Report data completeness**
    - **Property 26: PDF format validation**
    - **Property 27: Conditional image embedding**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.6**

  - [ ]* 12.3 Write unit tests for PDF generation
    - Test PDF with all fields populated
    - Test PDF with minimal fields
    - Test PDF with image from S3
    - Test PDF without image
    - Test S3 upload of PDF
    - _Requirements: 6.1, 6.6_

- [ ] 13. Implement main application pages and routing
  - [ ] 13.1 Create Home.jsx landing page
    - Display app title and description
    - Add "Start Assessment" button
    - Include brief instructions for ASHA workers
    - _Requirements: 8.1, 8.2_

  - [ ] 13.2 Create Assessment.jsx page
    - Integrate PatientForm component
    - Integrate VoiceRecorder component
    - Integrate ImageCapture component
    - Add "Submit Assessment" button
    - Display loading indicator during API call
    - Handle submission and navigate to Results page
    - Display error messages if submission fails
    - _Requirements: 11.1, 11.2_

  - [ ] 13.3 Create Results.jsx page
    - Integrate TriageResult component
    - Integrate ReferralReport component
    - Handle report generation
    - Provide navigation back to home
    - _Requirements: 5.1, 5.6_

  - [ ] 13.4 Set up React Router for navigation
    - Configure routes: / (Home), /assessment (Assessment), /results (Results)
    - Implement navigation between pages
    - Pass assessment data to Results page via state
    - _Requirements: 8.1, 8.2_

- [ ] 14. Implement responsive design and styling
  - [ ] 14.1 Apply Tailwind CSS responsive classes
    - Implement mobile-first layout (< 768px)
    - Implement desktop layout (>= 768px)
    - Ensure all components adapt to viewport width
    - Test layouts from 320px to 1920px width
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 14.2 Write property tests for responsive design
    - **Property 28: Responsive layout adaptation**
    - **Property 29: Breakpoint-based layouts**
    - **Property 30: Orientation change handling**
    - **Property 31: Touch target sizing**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

  - [ ]* 14.3 Write unit tests for responsive rendering
    - Test mobile viewport rendering
    - Test desktop viewport rendering
    - Test orientation change handling
    - Test touch target sizes
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [ ] 15. Implement error handling and loading states
  - [ ] 15.1 Add loading indicators throughout the app
    - Add spinner component
    - Display loading during API calls
    - Display loading during image processing
    - Display loading during PDF generation
    - _Requirements: 11.1_

  - [ ] 15.2 Add error boundary component
    - Catch React errors and display fallback UI
    - Log errors to console
    - Provide "Try Again" option
    - _Requirements: 11.2, 11.6_

  - [ ] 15.3 Implement error message display
    - Create reusable ErrorMessage component
    - Display errors from API calls
    - Display errors from voice recording
    - Display errors from image capture
    - Include retry buttons where appropriate
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

  - [ ]* 15.4 Write property tests for error handling
    - **Property 22: Loading state indicators**
    - **Property 23: Error message display**
    - **Property 24: Error logging**
    - **Validates: Requirements 11.1, 11.2, 11.6**

  - [ ]* 15.5 Write unit tests for error scenarios
    - Test network error display
    - Test API error display
    - Test voice recording error display
    - Test image capture error display
    - Test retry functionality
    - _Requirements: 11.2, 11.3, 11.4, 11.5_

- [ ] 16. Checkpoint - Frontend components complete
  - Ensure all frontend tests pass
  - Manually test each component in isolation
  - Test complete assessment flow in browser
  - Verify responsive design on mobile and desktop
  - Ask the user if questions arise

- [ ] 17. Implement security measures
  - [ ] 17.1 Add input sanitization
    - Sanitize symptom text before sending to API
    - Sanitize patient information fields
    - Escape special characters in user inputs
    - _Requirements: 12.3_

  - [ ] 17.2 Implement rate limiting on Lambda functions
    - Add rate limiting using API Gateway usage plans
    - Configure throttling limits (e.g., 10 requests per second per IP)
    - Return 429 status code when limit exceeded
    - _Requirements: 12.6_

  - [ ] 17.3 Verify AWS credentials security
    - Ensure AWS credentials are configured via IAM roles (not hardcoded)
    - Verify no sensitive data in frontend bundle
    - Configure proper IAM policies with least privilege
    - Add environment variables to .gitignore
    - _Requirements: 12.4_

  - [ ] 17.4 Configure S3 bucket policies
    - Set up bucket policies to restrict public access
    - Configure CORS for presigned URL uploads
    - Enable S3 encryption at rest
    - Set up lifecycle policies for temporary files
    - _Requirements: 12.5_

  - [ ]* 17.5 Write property tests for security measures
    - **Property 17: Input sanitization**
    - **Property 18: Rate limiting enforcement**
    - **Validates: Requirements 12.3, 12.6**

  - [ ]* 17.6 Write unit tests for security
    - Test input sanitization with malicious inputs
    - Test rate limiting enforcement
    - Test IAM role permissions
    - Test S3 bucket policies
    - _Requirements: 12.3, 12.4, 12.6_

- [ ] 18. Configure AWS deployment settings
  - [ ] 18.1 Configure frontend for AWS Amplify deployment
    - Create amplify.yml build configuration file
    - Set environment variables for production API Gateway URL
    - Configure build command and output directory
    - Test production build locally
    - _Requirements: 10.1, 10.3_

  - [ ] 18.2 Configure backend for AWS Lambda deployment
    - Complete serverless.yml with all Lambda functions
    - Configure IAM roles and permissions for Lambda functions
    - Set environment variables for AWS service regions
    - Configure DynamoDB table names and S3 bucket names
    - Set up CloudWatch log groups
    - _Requirements: 10.2, 10.3_

  - [ ] 18.3 Create AWS infrastructure as code
    - Define DynamoDB tables in infrastructure/dynamodb-tables.yml
    - Define S3 buckets in infrastructure/s3-buckets.yml
    - Configure bucket policies and CORS
    - Set up CloudFormation stack or use Serverless Framework plugins
    - _Requirements: 10.2_

  - [ ] 18.4 Create deployment documentation
    - Write README.md with deployment instructions
    - Document AWS services used and their configuration
    - Document environment variables needed
    - Include local development setup instructions
    - Add API endpoint documentation
    - Document AWS credentials setup
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 19. Final integration testing and AWS deployment
  - [ ] 19.1 Run complete end-to-end tests
    - Test complete assessment flow from start to finish
    - Test with various symptom descriptions
    - Test with and without images
    - Test with and without patient information
    - Test voice transcription with AWS Transcribe
    - Test image analysis with AWS Rekognition
    - Test report generation and S3 storage
    - Test error scenarios and recovery
    - _Requirements: All_

  - [ ] 19.2 Deploy AWS infrastructure
    - Deploy DynamoDB tables using CloudFormation or Serverless
    - Create S3 buckets with proper policies
    - Verify IAM roles are created correctly
    - Test AWS service connectivity
    - _Requirements: 10.2_

  - [ ] 19.3 Deploy Lambda functions to AWS
    - Push code to GitHub repository
    - Deploy using Serverless Framework: `serverless deploy`
    - Verify all Lambda functions are deployed
    - Test API Gateway endpoints with production URLs
    - Check CloudWatch logs for any errors
    - _Requirements: 10.2_

  - [ ] 19.4 Deploy frontend to AWS Amplify
    - Push code to GitHub repository
    - Connect repository to AWS Amplify
    - Configure environment variables with production API Gateway URL
    - Configure build settings using amplify.yml
    - Deploy and verify app is accessible
    - Test complete flow on deployed app
    - _Requirements: 10.1_

  - [ ] 19.5 Final verification
    - Test deployed app from multiple devices (mobile, desktop)
    - Verify all features work in production
    - Test with different browsers (Chrome, Safari, Firefox)
    - Verify HTTPS is working
    - Test AWS Transcribe with different languages
    - Test AWS Rekognition image analysis
    - Verify DynamoDB records are being created
    - Verify S3 files are being stored correctly
    - Check CloudWatch logs for errors
    - Confirm judges can access the app without setup
    - _Requirements: 10.4_

- [ ] 20. Final checkpoint - Application complete
  - Ensure all tests pass (unit and property tests)
  - Verify deployment is stable and accessible
  - Confirm all requirements are met
  - Document any known limitations or future improvements
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and allow for user feedback
- Property tests validate universal correctness properties across randomized inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a backend-first approach to establish the AWS infrastructure and Lambda functions early
- Frontend components are built incrementally with AWS service integrations
- Security and deployment are addressed after core functionality is complete
- All AWS services are configured using Infrastructure as Code (Serverless Framework)
- The application uses AWS free tier services where possible to minimize costs during development
