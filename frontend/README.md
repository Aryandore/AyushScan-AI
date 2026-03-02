# AyushScan AI - Frontend

React frontend for AyushScan AI diagnostic triage system.

## Features

- 🎤 Voice symptom recording in multiple Indian languages
- 📷 Image capture and upload to AWS S3
- 🧠 AI-powered triage assessment (GREEN/YELLOW/RED)
- 📄 Medical report generation and PDF download
- 📱 Mobile-responsive design
- 🎯 Mock mode for testing without backend

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React (icons)
- jsPDF & html2canvas

## Quick Start

### Install Dependencies

```bash
cd frontend
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

## Environment Variables

### Development (.env)
```
VITE_API_URL=http://localhost:3000/dev
VITE_MOCK_API=true
```

### Production (.env.production)
```
VITE_API_URL=YOUR_API_GATEWAY_URL
VITE_MOCK_API=false
```

## Mock Mode

By default, `VITE_MOCK_API=true` enables mock mode, allowing you to test the full UI without a backend:

- **Green Demo**: Mild case (common cold)
- **Yellow Demo**: Moderate case (dengue fever)
- **Red Demo**: Emergency case (cardiac emergency)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── PatientForm.jsx
│   │   ├── VoiceRecorder.jsx
│   │   ├── ImageCapture.jsx
│   │   ├── TriageResult.jsx
│   │   └── ReferralReport.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Assessment.jsx
│   │   └── Results.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── s3Service.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## AWS Integration

When connected to the backend, the app uses:

- **Amazon Bedrock**: AI triage with Nova Pro model
- **AWS Rekognition**: Image analysis
- **AWS Transcribe**: Voice-to-text (via Web Speech API)
- **AWS S3**: Image and report storage
- **AWS DynamoDB**: Assessment data storage
- **API Gateway**: REST API endpoints

## Deployment

### AWS Amplify

1. Push code to GitHub
2. Connect repository to AWS Amplify
3. Use the included `amplify.yml` configuration
4. Set environment variables in Amplify console
5. Deploy

The app will automatically build and deploy on every push.

## Browser Support

- Chrome/Edge (recommended for voice recording)
- Firefox
- Safari (limited voice recording support)

## License

MIT
