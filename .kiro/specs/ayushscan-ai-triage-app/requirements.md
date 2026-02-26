# Requirements Document

## Introduction

AyushScan AI is a multimodal diagnostic triage web application designed for ASHA (Accredited Social Health Activist) workers in rural India. The system addresses the critical healthcare gap where rural areas have only 1 doctor per 10,000+ people, and ASHA workers lack tools to quickly assess patient severity. The application enables ASHA workers to record patient symptoms via voice (in any language), optionally capture images of visible symptoms, and receive AI-powered triage recommendations (GREEN/YELLOW/RED) along with doctor referral summaries. This is a fully functional web prototype for the "AI for Bharat Hackathon" powered by AWS, deployable live for judges to test.

## Glossary

- **ASHA_Worker**: Accredited Social Health Activist - community health workers in rural India who provide primary healthcare services
- **Triage_System**: The AI-powered diagnostic assessment system that analyzes symptoms and assigns severity levels
- **Symptom_Recorder**: The voice input component that captures patient symptoms in any language
- **Image_Analyzer**: The component that processes uploaded or captured images of visible symptoms
- **Triage_Result**: The severity classification output (GREEN, YELLOW, or RED) with recommendations
- **Referral_Generator**: The component that creates doctor referral summaries
- **Web_App**: The browser-based application accessible on phones and computers
- **Claude_API**: Anthropic's Claude AI service (claude-sonnet-4-6) used for symptom analysis
- **Web_Speech_API**: Browser built-in voice recognition service
- **Patient_Record**: Stored assessment data including symptoms, images, and triage results

## Requirements

### Requirement 1: Voice-Based Symptom Recording

**User Story:** As an ASHA worker, I want to record patient symptoms using voice input in any language, so that I can quickly capture information without typing.

#### Acceptance Criteria

1. WHEN the ASHA worker activates voice recording, THE Symptom_Recorder SHALL capture audio input using the Web Speech API
2. WHEN voice input is being recorded, THE Web_App SHALL display visual feedback indicating active recording status
3. WHEN the ASHA worker stops recording, THE Symptom_Recorder SHALL convert the audio to text transcription
4. WHEN transcription is complete, THE Web_App SHALL display the transcribed text for review
5. WHEN the transcription contains errors, THE ASHA_Worker SHALL be able to edit the text manually
6. THE Symptom_Recorder SHALL support multilingual voice input without requiring language selection

### Requirement 2: Image Capture and Upload

**User Story:** As an ASHA worker, I want to capture or upload photos of visible symptoms, so that the AI can analyze visual indicators like rashes, wounds, or eye conditions.

#### Acceptance Criteria

1. WHEN the ASHA worker chooses to add an image, THE Image_Analyzer SHALL provide options to capture from camera or upload from device
2. WHEN using camera capture, THE Web_App SHALL access the device camera and display a preview
3. WHEN an image is captured or uploaded, THE Image_Analyzer SHALL validate that the file is a supported image format
4. WHEN an image is selected, THE Web_App SHALL display a preview of the image before submission
5. WHEN an image exceeds size limits, THE Image_Analyzer SHALL compress or reject the image with a clear error message
6. THE Image_Analyzer SHALL allow the ASHA worker to proceed without an image for non-visual symptoms

### Requirement 3: Patient Information Collection

**User Story:** As an ASHA worker, I want to optionally enter patient information, so that assessments can be documented when information is available.

#### Acceptance Criteria

1. WHEN starting an assessment, THE Web_App SHALL provide optional fields for patient name, age, and gender
2. WHEN patient information fields have values, THE Web_App SHALL validate the provided data before submission
3. WHEN patient information is provided, THE Triage_System SHALL store it with the assessment record
4. THE Web_App SHALL validate that if age is provided, it is a positive number, and if gender is provided, it is from predefined options
5. THE Web_App SHALL allow submission with empty patient information fields to accommodate situations where complete data is unavailable

### Requirement 4: AI-Powered Triage Analysis

**User Story:** As an ASHA worker, I want the AI to analyze symptoms and images together, so that I receive an accurate severity assessment.

#### Acceptance Criteria

1. WHEN symptom text and optional image are submitted, THE Triage_System SHALL send both inputs to the Claude API for analysis
2. WHEN the Claude API processes the inputs, THE Triage_System SHALL receive a structured response with severity classification
3. WHEN analysis is complete, THE Triage_System SHALL assign one of three severity levels: GREEN, YELLOW, or RED
4. THE Triage_System SHALL generate a reasoning explanation for the assigned severity level
5. WHEN the Claude API is unavailable, THE Triage_System SHALL return an error message and allow retry
6. THE Triage_System SHALL complete analysis within 10 seconds under normal conditions

### Requirement 5: Triage Result Display

**User Story:** As an ASHA worker, I want to see a clear triage result with color-coded severity and recommendations, so that I know what action to take immediately.

#### Acceptance Criteria

1. WHEN triage analysis is complete, THE Web_App SHALL display the severity level with color coding (GREEN/YELLOW/RED)
2. WHEN displaying GREEN severity, THE Web_App SHALL show recommendation "Monitor at home"
3. WHEN displaying YELLOW severity, THE Web_App SHALL show recommendation "Visit clinic soon"
4. WHEN displaying RED severity, THE Web_App SHALL show recommendation "Emergency — go to hospital immediately"
5. THE Web_App SHALL display the AI reasoning explanation alongside the severity level
6. THE Web_App SHALL provide options to generate a referral report or start a new assessment

### Requirement 6: Doctor Referral Report Generation

**User Story:** As an ASHA worker, I want to generate a doctor referral summary, so that I can provide comprehensive information when referring patients to healthcare facilities.

#### Acceptance Criteria

1. WHEN the ASHA worker requests a referral report, THE Referral_Generator SHALL compile patient information, symptoms, triage result, and AI reasoning
2. WHEN the report is generated, THE Referral_Generator SHALL format it as a printable PDF document
3. WHEN the PDF is ready, THE Web_App SHALL provide options to download or share the document
4. THE Referral_Generator SHALL include timestamp and unique assessment ID in the report
5. THE Referral_Generator SHALL format the report in a professional medical summary layout
6. WHEN an image was included in assessment, THE Referral_Generator SHALL embed the image in the PDF report

### Requirement 7: Data Persistence

**User Story:** As a system administrator, I want assessment records to be stored in a database, so that historical data can be retrieved and analyzed.

#### Acceptance Criteria

1. WHEN an assessment is completed, THE Triage_System SHALL store the patient information, symptoms, triage result, and timestamp in SQLite database
2. WHEN an image is included, THE Triage_System SHALL store the image data or reference with the assessment record
3. WHEN storing data, THE Triage_System SHALL assign a unique identifier to each assessment
4. THE Triage_System SHALL ensure data integrity by validating all fields before storage
5. WHEN database operations fail, THE Triage_System SHALL log the error and notify the user

### Requirement 8: Responsive Web Interface

**User Story:** As an ASHA worker, I want the application to work on both phones and computers, so that I can use whatever device is available.

#### Acceptance Criteria

1. WHEN accessed on a mobile device, THE Web_App SHALL display a mobile-optimized layout
2. WHEN accessed on a desktop computer, THE Web_App SHALL display a desktop-optimized layout
3. THE Web_App SHALL maintain functionality across screen sizes from 320px to 1920px width
4. WHEN the device orientation changes, THE Web_App SHALL adapt the layout appropriately
5. THE Web_App SHALL ensure touch targets are at least 44x44 pixels on mobile devices
6. THE Web_App SHALL load and render within 3 seconds on 3G network connections

### Requirement 9: API Communication

**User Story:** As a developer, I want the frontend to communicate with the backend via RESTful API, so that the application follows standard web architecture patterns.

#### Acceptance Criteria

1. WHEN the frontend submits an assessment, THE Web_App SHALL send a POST request to the backend API with symptom text and optional image
2. WHEN the backend processes the request, THE Triage_System SHALL return a JSON response with triage result and reasoning
3. WHEN API requests fail, THE Web_App SHALL display user-friendly error messages and provide retry options
4. THE Web_App SHALL include proper authentication headers in API requests
5. THE Triage_System SHALL validate all incoming API requests and reject malformed data
6. THE Triage_System SHALL implement CORS headers to allow frontend-backend communication

### Requirement 10: Deployment and Hosting

**User Story:** As a hackathon participant, I want the application deployed live on the internet, so that judges can test it from their browsers.

#### Acceptance Criteria

1. WHEN the frontend is deployed, THE Web_App SHALL be accessible via a public URL on Vercel
2. WHEN the backend is deployed, THE Triage_System SHALL be accessible via a public API endpoint on Render.com
3. THE Web_App SHALL connect to the deployed backend API endpoint
4. WHEN judges access the application, THE Web_App SHALL load without requiring local setup or installation
5. THE Triage_System SHALL handle concurrent requests from multiple users
6. THE Web_App SHALL include environment configuration for production deployment

### Requirement 11: Error Handling and User Feedback

**User Story:** As an ASHA worker, I want clear error messages and loading indicators, so that I understand what the application is doing and can respond to problems.

#### Acceptance Criteria

1. WHEN the application is processing a request, THE Web_App SHALL display a loading indicator with descriptive text
2. WHEN an error occurs, THE Web_App SHALL display a user-friendly error message explaining what went wrong
3. WHEN voice recording fails, THE Symptom_Recorder SHALL notify the user and suggest checking microphone permissions
4. WHEN image upload fails, THE Image_Analyzer SHALL notify the user and suggest checking file format or size
5. WHEN the Claude API returns an error, THE Triage_System SHALL display a message and provide a retry option
6. THE Web_App SHALL log errors to the console for debugging purposes

### Requirement 12: Security and Privacy

**User Story:** As a healthcare system stakeholder, I want patient data to be handled securely, so that privacy is protected and regulations are followed.

#### Acceptance Criteria

1. WHEN transmitting data between frontend and backend, THE Web_App SHALL use HTTPS encryption
2. WHEN storing patient data, THE Triage_System SHALL not include personally identifiable information beyond what is necessary
3. THE Triage_System SHALL validate and sanitize all user inputs to prevent injection attacks
4. THE Web_App SHALL not expose API keys or sensitive configuration in client-side code
5. WHEN handling images, THE Triage_System SHALL validate file types to prevent malicious uploads
6. THE Triage_System SHALL implement rate limiting to prevent abuse of the Claude API
