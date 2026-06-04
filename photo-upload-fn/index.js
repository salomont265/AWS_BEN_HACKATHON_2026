const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'aws-image-uploadingbtech';

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;

  if (method === 'OPTIONS') {
    return response(200, { message: 'CORS preflight OK' });
  }

  if (method !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { file_type = 'image/jpeg' } = body;

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const key = `reports/${timestamp}-${random}.jpg`;

    // Create presigned URL for upload (expires in 5 minutes)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: file_type,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const publicUrl = `https://aws-image-uploadingbtech.s3.amazonaws.com/${key}`;

    return response(200, {
      presigned_url: presignedUrl,
      photo_url: publicUrl,
      expires_in: 300,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return response(500, { error: 'Failed to generate upload URL' });
  }
};
