"""
AWS Bedrock service for Amazon Nova Pro integration
"""
import boto3
import json
import os
import logging
from typing import Optional, Dict, List

logger = logging.getLogger()
logger.setLevel(logging.INFO)


class BedrockService:
    def __init__(self):
        self.bedrock_region = os.environ.get('BEDROCK_REGION', 'us-east-1')
        self.client = boto3.client('bedrock-runtime', region_name=self.bedrock_region)
        # Amazon Nova Pro model ID
        self.model_id = 'amazon.nova-pro-v1:0'
    
    def analyze_symptoms(
        self,
        voice_transcript: str,
        rekognition_labels: Optional[List[str]] = None,
        patient_info: Optional[Dict] = None,
        image_s3_key: Optional[str] = None
    ) -> Dict:
        """
        Analyze patient symptoms using AWS Bedrock Amazon Nova Pro
        
        Args:
            voice_transcript: Patient's symptom description
            rekognition_labels: Optional list of labels from image analysis
            patient_info: Optional patient demographic data
            image_s3_key: Optional S3 key for symptom image
            
        Returns:
            Dict with triage analysis results
        """
        # Build the prompt
        prompt = self._build_triage_prompt(
            voice_transcript,
            rekognition_labels,
            patient_info,
            image_s3_key
        )
        
        # Call Bedrock with Nova Pro format
        try:
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 2000,
                    "temperature": 0.3,
                    "topP": 0.9
                }
            }
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json"
            )
            
            # Parse Nova Pro response format
            response_body = json.loads(response['body'].read())
            output_text = response_body['output']['message']['content'][0]['text']
            
            # Extract JSON from response
            result = self._parse_nova_response(output_text)
            return result
            
        except Exception as e:
            logger.error(f"Bedrock Nova Pro error: {str(e)}")
            raise Exception(f"AI analysis failed: {str(e)}")
    
    def _build_triage_prompt(
        self,
        voice_transcript: str,
        rekognition_labels: Optional[List[str]],
        patient_info: Optional[Dict],
        image_s3_key: Optional[str]
    ) -> str:
        """Build the prompt for Amazon Nova Pro"""
        prompt = """You are AyushScan AI, a medical triage assistant for ASHA workers in rural India.

Your role is to analyze patient symptoms and provide a triage assessment. You MUST respond ONLY in valid JSON format.

CRITICAL RULES:
- Be conservative — when in doubt, escalate the triage level
- Never give a definitive diagnosis
- Focus on urgency and recommended actions
- Consider limited healthcare access in rural areas

"""
        
        # Add patient info if available
        if patient_info:
            prompt += f"\nPATIENT INFORMATION:\n"
            if patient_info.get('age'):
                prompt += f"- Age: {patient_info['age']} years\n"
            if patient_info.get('gender'):
                prompt += f"- Gender: {patient_info['gender']}\n"
            if patient_info.get('location'):
                prompt += f"- Location: {patient_info['location']}\n"
        
        # Add symptom description
        prompt += f"\nPATIENT SYMPTOMS (voice transcript):\n{voice_transcript}\n"
        
        # Add visual analysis if available
        if rekognition_labels and len(rekognition_labels) > 0:
            labels_str = ", ".join(rekognition_labels)
            prompt += f"\nVISUAL ANALYSIS DETECTED: {labels_str}\n"
            prompt += "(Image analysis shows these visual indicators)\n"
        
        # Add response format
        prompt += """
TRIAGE LEVELS:
- GREEN: Minor condition, can be monitored at home with basic care
- YELLOW: Moderate condition, should visit clinic within 24-48 hours
- RED: Severe/emergency condition, requires immediate hospital care

You MUST respond with ONLY valid JSON in this exact format:
{
  "triage_level": "GREEN|YELLOW|RED",
  "confidence_score": 0.85,
  "symptoms_detected": ["symptom1", "symptom2"],
  "primary_concern": "Brief description of main concern",
  "recommended_action": "Specific action to take",
  "urgency_reason": "Why this triage level was assigned",
  "follow_up_questions": ["question1", "question2"]
}

Respond with JSON only, no other text:"""
        
        return prompt
    
    def _parse_nova_response(self, content: str) -> Dict:
        """Parse Amazon Nova Pro's JSON response"""
        try:
            # Clean the response - remove markdown code blocks if present
            clean_content = content.strip()
            
            # Remove markdown code blocks
            if '```json' in clean_content:
                start = clean_content.find('```json') + 7
                end = clean_content.rfind('```')
                clean_content = clean_content[start:end].strip()
            elif '```' in clean_content:
                start = clean_content.find('```') + 3
                end = clean_content.rfind('```')
                clean_content = clean_content[start:end].strip()
            
            # Try to find JSON in the response
            start_idx = clean_content.find('{')
            end_idx = clean_content.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("No JSON found in response")
            
            json_str = clean_content[start_idx:end_idx]
            result = json.loads(json_str)
            
            # Validate required fields
            required_fields = [
                'triage_level', 'confidence_score', 'symptoms_detected',
                'primary_concern', 'recommended_action', 'urgency_reason',
                'follow_up_questions'
            ]
            
            for field in required_fields:
                if field not in result:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate triage level
            if result['triage_level'] not in ['GREEN', 'YELLOW', 'RED']:
                raise ValueError(f"Invalid triage level: {result['triage_level']}")
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error: {str(e)}")
            logger.error(f"Content: {content}")
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")
    
    def generate_report_content(self, assessment_data: Dict) -> str:
        """
        Generate professional HTML doctor referral letter using Amazon Nova Pro
        
        Args:
            assessment_data: Complete assessment record
            
        Returns:
            HTML string for PDF generation
        """
        prompt = f"""Generate a professional medical referral letter in HTML format for a doctor.

ASSESSMENT DATA:
{json.dumps(assessment_data, indent=2)}

Create a formal doctor referral letter that includes:
1. Header with "AyushScan AI - Patient Referral Report"
2. Patient information section (if available)
3. Chief complaint and symptoms
4. Visual findings (if image analysis was done)
5. Triage assessment and urgency level
6. Recommended actions
7. Follow-up questions for the doctor to consider

Use professional medical language. Format as clean HTML with proper styling.
Include the assessment ID and timestamp at the bottom.

Respond with HTML only:"""
        
        try:
            body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"text": prompt}
                        ]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 3000,
                    "temperature": 0.5,
                    "topP": 0.9
                }
            }
            
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body),
                contentType="application/json",
                accept="application/json"
            )
            
            response_body = json.loads(response['body'].read())
            html_content = response_body['output']['message']['content'][0]['text']
            
            # Extract HTML if wrapped in markdown code blocks
            if '```html' in html_content:
                start = html_content.find('```html') + 7
                end = html_content.rfind('```')
                html_content = html_content[start:end].strip()
            elif '```' in html_content:
                start = html_content.find('```') + 3
                end = html_content.rfind('```')
                html_content = html_content[start:end].strip()
            
            return html_content
            
        except Exception as e:
            logger.error(f"Report generation error: {str(e)}")
            raise Exception(f"Report generation failed: {str(e)}")
