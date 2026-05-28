/**
 * Lambda: submitReport
 *
 * POST /reports
 * Submits hazard report with photo analysis via Claude Vision (Bedrock)
 *
 * Flow:
 * 1. Upload photo to S3
 * 2. Call Bedrock Claude Vision for analysis
 * 3. Store report in DynamoDB with AI insights
 * 4. Return report with Claude analysis
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { randomUUID } = require('crypto');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({ region: process.env.S3_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

/**
 * Upload photo to S3
 */
async function uploadPhotoToS3(reportId, photoData, contentType) {
  const key = `reports/${reportId}/${randomUUID()}.jpg`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_PHOTOS,
    Key: key,
    Body: Buffer.from(photoData, 'base64'),
    ContentType: contentType || 'image/jpeg',
  });

  await s3Client.send(command);

  return `https://${process.env.S3_BUCKET_PHOTOS}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

/**
 * Analyze photo with Claude Vision via Bedrock
 */
async function analyzePhotoWithClaude(base64Image) {
  const prompt = `Analyze this environmental hazard photo. Provide:
1. Type: Choose from air_pollution, water_contamination, hazardous_waste, noise_pollution, or other
2. Severity: Rate 1-5 (1=minimal, 5=critical)
3. Description: Brief description of what you observe (2-3 sentences)
4. Confidence: Your confidence in this assessment (0.0-1.0)

Respond ONLY with valid JSON in this format:
{
  "type": "air_pollution",
  "severity": 3,
  "description": "Description here",
  "confidence": 0.87
}`;

  const requestBody = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 1024,
    temperature: 0.3,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  };

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(requestBody),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Extract text from Claude response
  const analysisText = responseBody.content[0].text;

  // Parse JSON from response
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response');
  }

  return JSON.parse(jsonMatch[0]);
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      type,
      title,
      description,
      latitude,
      longitude,
      address,
      photo, // base64 encoded
    } = body;

    // Get userId from JWT (assumes authorizer adds it to requestContext)
    const userId = event.requestContext?.authorizer?.claims?.sub || 'anonymous';

    // Validate required fields
    if (!type || !title || !latitude || !longitude) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'Missing required fields: type, title, latitude, longitude',
          statusCode: 400,
        }),
      };
    }

    const reportId = randomUUID();
    let photoUrl = null;
    let claudeAnalysis = null;

    // Process photo if provided
    if (photo) {
      console.log('Uploading photo to S3...');
      photoUrl = await uploadPhotoToS3(reportId, photo, 'image/jpeg');

      console.log('Analyzing photo with Claude Vision...');
      try {
        claudeAnalysis = await analyzePhotoWithClaude(photo);
        console.log('Claude Analysis:', claudeAnalysis);
      } catch (claudeError) {
        console.error('Claude analysis failed:', claudeError);
        // Continue without analysis - report is still valid
        claudeAnalysis = {
          type: 'unknown',
          severity: 0,
          description: 'AI analysis unavailable',
          confidence: 0,
        };
      }
    }

    // Create report object
    const report = {
      id: reportId,
      userId,
      type,
      title,
      description: description || '',
      location: {
        latitude,
        longitude,
      },
      address: address || '',
      photos: photoUrl ? [photoUrl] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending',
      severity: claudeAnalysis?.severity || 0,
      claudeAnalysis,
    };

    // Store in DynamoDB
    const putCommand = new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_REPORTS,
      Item: report,
    });

    await docClient.send(putCommand);

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: report,
        message: 'Report submitted successfully. AI analysis completed.',
      }),
    };

  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'InternalServerError',
        message: 'Failed to submit report',
        statusCode: 500,
        details: error.message,
      }),
    };
  }
};
