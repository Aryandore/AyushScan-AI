# AyushScan AI - Operating Modes

## Two Modes of Operation

### 1. Mock Mode (Demo Mode) ✅ Currently Active

**Purpose**: Quick testing without AWS costs

**How it works**:
- Uses pre-defined responses for Green/Yellow/Red demos
- No API calls to AWS
- Instant results
- Perfect for judges/reviewers to test the UI

**To enable**:
```env
VITE_MOCK_API=true
```

**Limitations**:
- Returns same disease for each demo type
- Doesn't analyze actual symptoms entered
- No real AI processing

---

### 2. Real AI Mode (Production Mode)

**Purpose**: Actual symptom analysis with Amazon Nova Pro

**How it works**:
- Sends symptoms to AWS Lambda backend
- Amazon Nova Pro analyzes the ACTUAL symptoms
- Returns dynamic diagnosis based on input
- Each symptom combination gets unique assessment

**To enable**:
```env
VITE_MOCK_API=false
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/dev
```

**Features**:
- Real AI analysis of symptoms
- Dynamic primary concern based on input
- Image analysis with AWS Rekognition
- Saves to DynamoDB
- Generates PDF reports

**Cost**: ~$0.01-0.05 per assessment (Bedrock API calls)

---

## Switching Modes

### For Local Development (Mock Mode)
```bash
# frontend/.env
VITE_MOCK_API=true
VITE_API_URL=https://xzp65spszl.execute-api.ap-south-1.amazonaws.com/dev

npm run dev
```

### For Production (Real AI Mode)
```bash
# frontend/.env.production
VITE_MOCK_API=false
VITE_API_URL=https://xzp65spszl.execute-api.ap-south-1.amazonaws.com/dev

npm run build
```

### For AWS Amplify Deployment

Set environment variables in Amplify Console:
- `VITE_MOCK_API` = `false` (for real AI)
- `VITE_API_URL` = Your API Gateway URL

---

## Testing Real AI Mode

1. Deploy backend:
```bash
cd backend
serverless deploy --stage dev --region ap-south-1
```

2. Copy API Gateway URL from output

3. Update frontend/.env:
```env
VITE_MOCK_API=false
VITE_API_URL=<your-api-gateway-url>
```

4. Test with real symptoms:
```
Input: "Patient has fever, rash, and joint pain for 3 days"
Expected: "Possible Dengue Fever" (YELLOW)

Input: "Chest pain, left arm pain, sweating"
Expected: "Suspected Cardiac Emergency" (RED)

Input: "Mild cough and runny nose"
Expected: "Upper Respiratory Infection" (GREEN)
```

---

## Current Status

✅ **Backend**: Deployed and working with real AI
✅ **Frontend**: Mock mode enabled for demos
🔄 **Switch to Real AI**: Change `VITE_MOCK_API=false`

The backend already analyzes real symptoms correctly. Mock mode is just for cost-free testing!
