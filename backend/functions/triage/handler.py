"""
Lambda handler for triage analysis
"""
import json
import sys
import os

# Add shared directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))

from bedrock_service import BedrockService
from rekognition_service import RekognitionService
from dynamodb_service import DynamoDBService
from schemas import TriageRequest, TriageResponse


def lambda_handler(event, context):
    """
    POST /triage
    Analyze patient symptoms and return triage assessment
    """
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate request
        try:
            request = TriageRequest(**body)
        except Exception as e:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': f'Invalid request: {str(e)}'
                })
            }
        
        # Initialize services
        bedrock_service = BedrockService()
        rekognition_service = RekognitionService()
        dynamodb_service = DynamoDBService()
        
        # Analyze image if provided
        rekognition_labels = []
        if request.image_s3_key:
            print(f"Analyzing image: {request.image_s3_key}")
            s3_bucket = os.environ.get('S3_BUCKET')
            rekognition_labels = rekognition_service.analyze_image(
                s3_bucket,
                request.image_s3_key
            )
            print(f"Rekognition labels: {rekognition_labels}")
        
        # Analyze symptoms with Bedrock
        print("Calling Bedrock for triage analysis...")
        patient_info_dict = request.patient_info.model_dump() if request.patient_info else None
        
        analysis_result = bedrock_service.analyze_symptoms(
            voice_transcript=request.voice_transcript,
            rekognition_labels=rekognition_labels if rekognition_labels else None,
            patient_info=patient_info_dict,
            image_s3_key=request.image_s3_key
        )
        
        # Prepare assessment data for storage
        assessment_data = {
            'patient_info': patient_info_dict,
            'voice_transcript': request.voice_transcript,
            'image_s3_key': request.image_s3_key,
            'rekognition_labels': rekognition_labels,
            'triage_level': analysis_result['triage_level'],
            'confidence_score': analysis_result['confidence_score'],
            'symptoms_detected': analysis_result['symptoms_detected'],
            'primary_concern': analysis_result['primary_concern'],
            'recommended_action': analysis_result['recommended_action'],
            'urgency_reason': analysis_result['urgency_reason'],
            'follow_up_questions': analysis_result['follow_up_questions']
        }
        
        # Save to DynamoDB
        assessment_id = dynamodb_service.save_assessment(assessment_data)
        
        # Build response
        response_data = {
            'assessment_id': assessment_id,
            **analysis_result
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(response_data)
        }
        
    except Exception as e:
        print(f"Error in triage handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
