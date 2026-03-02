import { getUploadUrl } from './api';

export const uploadImageToS3 = async (file) => {
  try {
    // Get presigned URL from backend
    const response = await getUploadUrl();
    const { upload_url, s3_key } = response.data;

    // Upload file to S3 using presigned URL
    const uploadResponse = await fetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to S3');
    }

    return s3_key;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};
