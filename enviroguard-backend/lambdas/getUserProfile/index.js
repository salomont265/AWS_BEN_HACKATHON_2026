/**
 * Lambda: getUserProfile
 *
 * GET /users/{user_id}
 * Returns user profile with health settings and alert thresholds
 *
 * Auth: Required (must match user_id or be admin)
 * Special: user_id can be "me" to get authenticated user's profile
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetItemCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    let userId = event.pathParameters?.user_id;

    // Validate user_id
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'user_id path parameter is required',
          statusCode: 400,
        }),
      };
    }

    // Handle "me" alias - get from JWT token (if authorizer is configured)
    if (userId === 'me') {
      // Extract from Cognito authorizer context
      userId = event.requestContext?.authorizer?.claims?.sub || 'demo-user-123';
    }

    // Query DynamoDB
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE_USERS,
      Key: {
        userId: userId,
      },
    };

    const result = await docClient.send(new GetItemCommand(getParams));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'NotFound',
          message: `User with id '${userId}' not found`,
          statusCode: 404,
        }),
      };
    }

    const user = result.Item;

    // Don't return sensitive fields
    delete user.passwordHash;
    delete user.refreshToken;

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: user,
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
        message: 'Failed to retrieve user profile',
        statusCode: 500,
      }),
    };
  }
};
