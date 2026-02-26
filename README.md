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
Frontend (React) → API Gateway → Lambda Functions → AWS Services
                                        ↓
                    ┌──────────────────┴──────────────────┐
                    ↓                  ↓                   ↓
              AWS Bedrock        AWS Rekognition     DynamoDB
              (Claude AI)        (Image Analysis)    (Database)
                    ↓                                      ↓
                  S3 (File Storage)                  CloudWatch
```

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

### Frontend (Coming Soon)
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
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
├── frontend/                   # React frontend (coming soon)
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

**Detailed guides:**
- [Backend Quick Start](backend/QUICKSTART.md)
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

### ✅ Implemented (Backend)
- [x] Voice symptom recording (AWS Transcribe)
- [x] Image analysis (AWS Rekognition)
- [x] AI-powered triage (AWS Bedrock Nova Pro)
- [x] PDF report generation
- [x] Secure file storage (S3)
- [x] Assessment history (DynamoDB)
- [x] RESTful API (API Gateway)

### 🔜 Coming Soon (Frontend)
- [ ] React web interface
- [ ] Voice recorder component
- [ ] Image capture component
- [ ] Triage result display
- [ ] PDF report viewer
- [ ] Responsive design
- [ ] AWS Amplify deployment

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

```bash
# Test triage endpoint
serverless invoke local --function triage --path test-data/triage-request.json

# View logs
serverless logs --function triage --tail
```

## 📚 Documentation

- [Backend README](backend/README.md) - API documentation
- [Deployment Guide](backend/DEPLOYMENT.md) - Step-by-step deployment
- [Architecture](backend/ARCHITECTURE.md) - System design
- [Quick Start](backend/QUICKSTART.md) - 10-minute setup

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
