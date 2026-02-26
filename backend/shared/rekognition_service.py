"""
AWS Rekognition service for image analysis
"""
import boto3
from typing import List, Dict


class RekognitionService:
    def __init__(self):
        self.client = boto3.client('rekognition')
        
        # Medical-relevant label keywords
        self.medical_keywords = [
            'skin', 'rash', 'wound', 'eye', 'swelling', 'red', 'inflammation',
            'bruise', 'cut', 'burn', 'scar', 'lesion', 'bump', 'spot', 'mark',
            'injury', 'blood', 'bandage', 'hand', 'foot', 'arm', 'leg', 'face',
            'mouth', 'tongue', 'nail', 'finger', 'toe', 'body', 'person'
        ]
    
    def analyze_image(self, s3_bucket: str, s3_key: str) -> List[str]:
        """
        Analyze image for medical-relevant labels
        
        Args:
            s3_bucket: S3 bucket name
            s3_key: S3 object key
            
        Returns:
            List of relevant label strings
        """
        try:
            # Detect labels
            labels_response = self.client.detect_labels(
                Image={
                    'S3Object': {
                        'Bucket': s3_bucket,
                        'Name': s3_key
                    }
                },
                MaxLabels=20,
                MinConfidence=70
            )
            
            # Check for inappropriate content
            moderation_response = self.client.detect_moderation_labels(
                Image={
                    'S3Object': {
                        'Bucket': s3_bucket,
                        'Name': s3_key
                    }
                },
                MinConfidence=60
            )
            
            # Filter for medical-relevant labels
            relevant_labels = self._filter_medical_labels(labels_response['Labels'])
            
            # Check moderation
            if moderation_response['ModerationLabels']:
                print(f"Warning: Moderation labels detected: {moderation_response['ModerationLabels']}")
            
            return relevant_labels
            
        except self.client.exceptions.InvalidS3ObjectException:
            print(f"Image not found in S3: {s3_bucket}/{s3_key}")
            return []
        except Exception as e:
            print(f"Rekognition error: {str(e)}")
            return []
    
    def _filter_medical_labels(self, labels: List[Dict]) -> List[str]:
        """Filter labels for medical relevance"""
        relevant = []
        
        for label in labels:
            label_name = label['Name'].lower()
            confidence = label['Confidence']
            
            # Check if label contains medical keywords
            is_relevant = any(keyword in label_name for keyword in self.medical_keywords)
            
            if is_relevant and confidence >= 70:
                relevant.append(label['Name'])
        
        return relevant
    
    def format_labels_for_prompt(self, labels: List[str]) -> str:
        """
        Format labels for Claude prompt
        
        Args:
            labels: List of label strings
            
        Returns:
            Formatted string for prompt
        """
        if not labels:
            return "No visual indicators detected"
        
        return ", ".join(labels)
