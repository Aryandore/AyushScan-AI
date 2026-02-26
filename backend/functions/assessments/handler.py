"""
Lambda handler for listing assessments
"""
import json
import sys
import os

# Add shared directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../shared'))

from dynamodb_service import DynamoDBService


def lambda_handler(event, context):
    """
    GET /assessments
    List recent assessments
    """
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        limit = int(query_params.get('limit', 20))
        
        # Initialize DynamoDB service
        dynamodb_service = DynamoDBService()
        
        # Get assessments
        assessments = dynamodb_service.list_assessments(limit)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            'body': json.dumps({
                'assessments': assessments,
                'count': len(assessments)
            })
        }
        
    except Exception as e:
        print(f"Error in assessments handler: {str(e)}")
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
                'error': 'Failed to list assessments',
                'message': str(e)
            })
        }
