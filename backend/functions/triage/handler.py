import json
import boto3
import re
import uuid
import os
from datetime import datetime

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')

def lambda_handler(event, context):
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    try:
        body = json.loads(event.get('body', '{}'))
        
        patient_name = body.get('patient_name', 'Unknown')
        patient_age = body.get('patient_age', 'Unknown')
        patient_location = body.get('patient_location', 'Unknown')
        symptoms_text = body.get('symptoms_text', '')
        image_analysis = body.get('image_analysis', '')
        
        if not symptoms_text:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'symptoms_text is required'})
            }
        
        prompt = f"""You are a medical triage AI for rural India.
Analyze these patient symptoms and return ONLY a JSON object.

Patient: {patient_name}, Age: {patient_age}, Location: {patient_location}
Symptoms: {symptoms_text}
Image findings: {image_analysis if image_analysis else 'None'}

Return ONLY this JSON, no other text:
{{
  "triage_level": "GREEN" or "YELLOW" or "RED",
  "confidence_score": <integer 60-98>,
  "primary_concern": "<specific diagnosis based on these exact symptoms>",
  "symptoms_detected": ["<symptom1>", "<symptom2>", "<symptom3>"],
  "recommended_action": "<specific action for this case>",
  "urgency_reason": "<one sentence why this triage level>",
  "follow_up_questions": ["<question1>", "<question2>"]
}}

Rules:
- GREEN: mild, safe to monitor at home
- YELLOW: moderate, needs clinic within 24 hours
- RED: emergency, call 108 immediately
- primary_concern MUST be specific to these symptoms
- Never give a generic answer

Examples:
- Fever + rash + joint pain = Possible Dengue Fever
- Chest pain + left arm pain = Cardiac Emergency
- Cough + mild fever = Upper Respiratory Infection
- High fever + stiff neck = Possible Meningitis
- Stomach pain + vomiting = Acute Gastroenteritis"""
        
        response = bedrock.invoke_model(
            modelId='us.amazon.nova-pro-v1:0',
            body=json.dumps({
                "messages": [{
                    "role": "user",
                    "content": [{"text": prompt}]
                }],
                "inferenceConfig": {
                    "maxTokens": 1024,
                    "temperature": 0.3,
                    "topP": 0.9
                }
            }),
            contentType='application/json',
            accept='application/json'
        )
        
        result = json.loads(response['body'].read())
        response_text = result['output']['message']['content'][0]['text']
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if not json_match:
            raise ValueError('No JSON in AI response')
        
        assessment = json.loads(json_match.group())
        assessment['assessment_id'] = str(uuid.uuid4())
        assessment['patient_name'] = patient_name
        assessment['patient_age'] = patient_age
        assessment['patient_location'] = patient_location
        assessment['symptoms_text'] = symptoms_text
        assessment['created_at'] = datetime.utcnow().isoformat()
        
        # Save to DynamoDB
        try:
            table_name = os.environ.get('DYNAMODB_TABLE', 'ayushscan-assessments-dev')
            table = dynamodb.Table(table_name)
            table.put_item(Item=assessment)
        except Exception as e:
            print(f'DynamoDB error: {e}')
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(assessment)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
