"""
AWS DynamoDB service for data persistence
"""
import boto3
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from boto3.dynamodb.conditions import Key


class DynamoDBService:
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('DYNAMODB_TABLE')
        self.table = self.dynamodb.Table(self.table_name)
    
    def save_assessment(self, assessment_data: Dict) -> str:
        """
        Save assessment to DynamoDB
        
        Args:
            assessment_data: Complete assessment record
            
        Returns:
            assessment_id (UUID string)
        """
        # Generate unique ID
        assessment_id = str(uuid.uuid4())
        
        # Add metadata
        item = {
            'assessment_id': assessment_id,
            'timestamp': datetime.utcnow().isoformat(),
            **assessment_data
        }
        
        try:
            self.table.put_item(Item=item)
            print(f"Saved assessment: {assessment_id}")
            return assessment_id
            
        except Exception as e:
            print(f"DynamoDB save error: {str(e)}")
            raise Exception(f"Failed to save assessment: {str(e)}")
    
    def get_assessment(self, assessment_id: str) -> Optional[Dict]:
        """
        Retrieve assessment by ID
        
        Args:
            assessment_id: UUID string
            
        Returns:
            Assessment dict or None if not found
        """
        try:
            response = self.table.get_item(
                Key={'assessment_id': assessment_id}
            )
            
            if 'Item' in response:
                return response['Item']
            else:
                return None
                
        except Exception as e:
            print(f"DynamoDB get error: {str(e)}")
            raise Exception(f"Failed to retrieve assessment: {str(e)}")
    
    def list_assessments(self, limit: int = 20) -> List[Dict]:
        """
        List recent assessments
        
        Args:
            limit: Maximum number of records to return
            
        Returns:
            List of assessment dicts
        """
        try:
            response = self.table.scan(
                Limit=limit
            )
            
            items = response.get('Items', [])
            
            # Sort by timestamp (most recent first)
            items.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return items
            
        except Exception as e:
            print(f"DynamoDB scan error: {str(e)}")
            raise Exception(f"Failed to list assessments: {str(e)}")
