import { apiPost } from '@/utils/api';

interface PresignedUrlResponse {
  presigned_url: string;
  photo_url: string;
  expires_in: number;
}

export async function uploadPhotoToS3(localUri: string): Promise<string> {
  try {
    // Step 1: Get presigned URL from backend
    const response = await apiPost<PresignedUrlResponse>('/upload-photo', {
      file_type: 'image/jpeg',
    });

    const { presigned_url, photo_url } = response;

    // Step 2: Upload file to S3
    const fileBlob = await fetch(localUri).then((r) => r.blob());

    const uploadResponse = await fetch(presigned_url, {
      method: 'PUT',
      body: fileBlob,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed: ${uploadResponse.status}`);
    }

    // Step 3: Return public S3 URL
    return photo_url;
  } catch (error) {
    console.error('Photo upload failed:', error);
    throw new Error('Failed to upload photo. Please try again.');
  }
}
