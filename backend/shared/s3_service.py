"""
AWS S3 service for file storage
"""
import boto3
import os
import uuid
from typing import Dict


class S3Service:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.environ.get('S3_BUCKET')
    
    def generate_upload_url(self, file_type: str = 'image/jpeg') -> Dict:
        """
        Generate presigned URL for file upload
        
        Args:
            file_type: MIME type of file
            
        Returns:
            Dict with upload_url and s3_key
        """
        # Determine file extension
        ext_map = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'application/pdf': 'pdf'
        }
        ext = ext_map.get(file_type, 'jpg')
        
        # Generate unique key
        file_uuid = str(uuid.uuid4())
        s3_key = f"uploads/{file_uuid}.{ext}"
        
        try:
            # Generate presigned PUT URL (expires in 5 minutes)
            upload_url = self.s3_client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key,
                    'ContentType': file_type
                },
                ExpiresIn=300  # 5 minutes
            )
            
            return {
                'upload_url': upload_url,
                's3_key': s3_key,
                'expires_in': 300
            }
            
        except Exception as e:
            print(f"S3 presigned URL error: {str(e)}")
            raise Exception(f"Failed to generate upload URL: {str(e)}")
    
    def generate_download_url(self, s3_key: str) -> str:
        """
        Generate presigned URL for file download
        
        Args:
            s3_key: S3 object key
            
        Returns:
            Presigned GET URL string
        """
        try:
            # Generate presigned GET URL (expires in 1 hour)
            download_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=3600  # 1 hour
            )
            
            return download_url
            
        except Exception as e:
            print(f"S3 download URL error: {str(e)}")
            raise Exception(f"Failed to generate download URL: {str(e)}")
    
    def save_pdf(self, pdf_bytes: bytes, assessment_id: str) -> str:
        """
        Upload PDF to S3
        
        Args:
            pdf_bytes: PDF file content
            assessment_id: Assessment UUID
            
        Returns:
            S3 key of uploaded PDF
        """
        s3_key = f"reports/{assessment_id}.pdf"
        
        try:
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=pdf_bytes,
                ContentType='application/pdf'
            )
            
            print(f"Saved PDF to S3: {s3_key}")
            return s3_key
            
        except Exception as e:
            print(f"S3 upload error: {str(e)}")
            raise Exception(f"Failed to upload PDF: {str(e)}")
    
    def get_object(self, s3_key: str) -> bytes:
        """
        Retrieve file from S3
        
        Args:
            s3_key: S3 object key
            
        Returns:
            File content as bytes
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            
            return response['Body'].read()
            
        except self.s3_client.exceptions.NoSuchKey:
            raise Exception(f"File not found: {s3_key}")
        except Exception as e:
            print(f"S3 get error: {str(e)}")
            raise Exception(f"Failed to retrieve file: {str(e)}")
