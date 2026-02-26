"""
Lambda handler for generating S3 upload URLs
"""
import json
import sys
import os

# Add shared directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))

from s3_service import S3Service


def lambda_handler(event, context):
    """
    GET /upload-url
    Generate presigned S3 URL for file upload
    """
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        file_type = query_params.get('file_type', 'image/jpeg')
        
        # Initialize S3 service
        s3_service = S3Service()
        
        # Generate presigned URL
        result = s3_service.generate_upload_url(file_type)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        print(f"Error in upload handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            'body': json.dumps({
                'error': 'Failed to generate upload URL',
                'message': str(e)
            })
        }
