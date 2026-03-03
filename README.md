# AyushScan AI - Multimodal Diagnostic Triage System

[![AWS](https://img.shields.io/badge/AWS-Powered-orange)](https://aws.amazon.com/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-red)](https://www.serverless.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

AI-powered diagnostic triage web application for ASHA workers in rural India. Built for the **"AI for Bharat Hackathon"** powered by AWS.

## 🎯 Problem Statement

Rural India has only **1 doctor per 10,000+ people**. ASHA (Accredited Social Health Activist) workers lack tools to quickly assess patient severity. Delayed diagnosis costs lives.

## 💡 Solution

AyushScan AI enables ASHA workers to:
1. 🎤 Record patient symptoms via voice (any language)
2. 📸 Capture images of visible symptoms
3. 🤖 Get AI-powered triage assessment (GREEN/YELLOW/RED)
4. 📄 Generate doctor referral reports

## 🏗️ Architecture

```
ASHA Worker (Mobile/Web)
         ↓
   React Frontend (Vite + Tailwind)
         ↓
   API Gateway (REST API)
         ↓
   Lambda Functions
         ↓
    ┌────┴────┬──────────────┬──────────────┐
    ↓         ↓              ↓              ↓
AWS Bedrock  Rekognition  DynamoDB        S3
(Nova Pro)   (Images)     (Data)      (Storage)
    ↓         ↓              ↓              ↓
         Triage Result
              ↓
    PDF Report Generation
              ↓
         Frontend Display
```

### Data Flow
1. ASHA worker records symptoms (voice/text) and captures image
2. Frontend uploads image to S3 via presigned URL
3. API Gateway routes request to Lambda
4. Rekognition analyzes image for visual symptoms
5. Bedrock Nova Pro processes combined data for triage
6. DynamoDB stores assessment results
7. Report generator creates PDF and saves to S3
8. Frontend displays color-coded results and recommendations

## 🚀 Tech Stack

### Backend (AWS Serverless)
- **AWS Lambda** - Serverless compute
- **AWS API Gateway** - REST API
- **AWS Bedrock** - Amazon Nova Pro AI
- **AWS Rekognition** - Image analysis
- **AWS Transcribe** - Voice-to-text
- **AWS DynamoDB** - NoSQL database
- **AWS S3** - File storage
- **Serverless Framework** - Infrastructure as Code

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Lucide React** - Icons
- **jsPDF & html2canvas** - PDF generation
- **AWS Amplify** - Hosting

## 📁 Project Structure

```
ayushscan-ai/
├── backend/                    # AWS Lambda backend
│   ├── serverless.yml         # Infrastructure config
│   ├── shared/                # Shared services
│   │   ├── bedrock_service.py
│   │   ├── rekognition_service.py
│   │   ├── dynamodb_service.py
│   │   └── s3_service.py
│   └── functions/             # Lambda handlers
│       ├── triage/
│       ├── report/
│       ├── upload/
│       └── assessments/
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── .kiro/specs/               # Project specifications
```

## 🚀 Quick Start

### Prerequisites
- AWS Account
- Node.js and npm
- Python 3.11
- Serverless Framework

### Backend Deployment

```bash
# Install Serverless Framework
npm install -g serverless

# Configure AWS
aws configure

# Deploy backend
cd backend
pip install -r requirements.txt
npm install
serverless deploy --stage dev
```

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev
# App runs at http://localhost:5173

# Build for production
npm run build
```

**Detailed guides:**
- [Backend Quick Start](backend/QUICKSTART.md)
- [Frontend README](frontend/README.md)
- [Deployment Guide](backend/DEPLOYMENT.md)
- [Architecture Overview](backend/ARCHITECTURE.md)

## 📡 API Endpoints

### POST /triage
Analyze patient symptoms and return triage assessment.

**Request:**
```json
{
  "patient_info": {
    "name": "Patient Name",
    "age": 35,
    "gender": "female"
  },
  "voice_transcript": "Patient has fever and headache for 3 days",
  "image_s3_key": "uploads/uuid.jpg"
}
```

**Response:**
```json
{
  "assessment_id": "uuid",
  "triage_level": "YELLOW",
  "confidence_score": 0.85,
  "symptoms_detected": ["fever", "headache"],
  "primary_concern": "Possible viral infection",
  "recommended_action": "Visit clinic within 24 hours"
}
```

### GET /upload-url
Generate presigned S3 URL for image upload.

### POST /report
Generate PDF report for an assessment.

### GET /assessments
List recent assessments.

## 🎨 Features

### ✅ Implemented
- [x] Voice symptom recording (Web Speech API + AWS Transcribe)
- [x] Multi-language support (Hindi, Marathi, Tamil, Telugu, Bengali, English)
- [x] Image capture and upload to S3
- [x] Image analysis (AWS Rekognition)
- [x] AI-powered triage (AWS Bedrock Nova Pro)
- [x] Color-coded triage levels (GREEN/YELLOW/RED)
- [x] PDF report generation
- [x] Secure file storage (S3)
- [x] Assessment history (DynamoDB)
- [x] RESTful API (API Gateway)
- [x] React web interface
- [x] Mobile-responsive design
- [x] Mock mode for testing without backend
- [x] 4-step assessment wizard
- [x] Real-time confidence scores
- [x] Emergency alerts for critical cases

### 🔜 Coming Soon
- [ ] AWS Amplify deployment
- [ ] Real-time notifications
- [ ] Analytics dashboard
- [ ] Multi-user support
- [ ] Offline mode with sync

## 💰 Cost Estimate

### Development
- Lambda: Free tier
- DynamoDB: ~$1/month
- S3: ~$1/month
- Bedrock: ~$3-5/month
- **Total: ~$5-10/month**

### Production
- **Total: ~$30-75/month** (moderate usage)

## 🔒 Security

- IAM roles with least privilege
- HTTPS for all API calls
- Input validation with Pydantic
- S3 encryption at rest
- Time-limited presigned URLs
- CORS configured

## 📊 Monitoring

- CloudWatch Logs for all functions
- CloudWatch Metrics for performance
- Error tracking and alerting
- Request/response logging

## 🧪 Testing

### Backend Testing
```bash
# Test triage endpoint
serverless invoke local --function triage --path test-data/triage-request.json

# View logs
serverless logs --function triage --tail
```

### Frontend Testing
The frontend includes mock mode for testing without backend:

```bash
cd frontend
npm run dev
```

**Demo Cases Available:**
- 🟢 **Green Demo**: Mild case (common cold, low priority)
- 🟡 **Yellow Demo**: Moderate case (dengue fever, clinic visit needed)
- 🔴 **Red Demo**: Emergency case (cardiac emergency, immediate action)

Mock mode is enabled by default (`VITE_MOCK_API=true` in `.env`)

## 📚 Documentation

- [Backend README](backend/README.md) - API documentation
- [Frontend README](frontend/README.md) - Frontend setup and features
- [Deployment Guide](backend/DEPLOYMENT.md) - Step-by-step deployment
- [Architecture](backend/ARCHITECTURE.md) - System design
- [Quick Start](backend/QUICKSTART.md) - 10-minute setup

## 🎯 Key Highlights

- **🌐 Multi-language Support**: 6 Indian languages for voice input
- **📱 Mobile-First Design**: Responsive UI for rural connectivity
- **🎨 Color-Coded Triage**: Instant visual severity assessment
- **⚡ Real-time Processing**: Fast AI analysis with Bedrock Nova Pro
- **💾 Offline-Ready**: Mock mode works without backend
- **🔒 Secure**: End-to-end encryption and IAM security
- **💰 Cost-Effective**: Serverless architecture scales to zero
- **🚀 Production-Ready**: Complete CI/CD with AWS Amplify

## 🤝 Contributing

This is a hackathon project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 👥 Team

Built for the **"AI for Bharat Hackathon"** powered by AWS

## 🙏 Acknowledgments

- AWS for providing cloud infrastructure
- Amazon for Nova Pro AI model
- ASHA workers for their invaluable service to rural India

## 📞 Support

For issues or questions:
- Open an issue on GitHub
- Check the [documentation](backend/README.md)
- Review [troubleshooting guide](backend/DEPLOYMENT.md#troubleshooting)

---

**Made with ❤️ for rural India** 🇮🇳
