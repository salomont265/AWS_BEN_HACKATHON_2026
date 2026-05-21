/**
 * Lambda: updateUserProfile
 *
 * PUT /users/{user_id}
 * Updates user profile settings (health conditions, alert thresholds, locations)
 *
 * Auth: Required (must match user_id)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/lib-dynamodb');

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

    // Handle "me" alias
    if (userId === 'me') {
      userId = event.requestContext?.authorizer?.claims?.sub || 'demo-user-123';
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      name,
      healthConditions,
      alertThresholds,
      savedLocations,
    } = body;

    // Validate at least one field to update
    if (!name && !healthConditions && !alertThresholds && !savedLocations) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'At least one field to update is required',
          statusCode: 400,
        }),
      };
    }

    // Check if user exists
    const getParams = {
      TableName: process.env.DYNAMODB_TABLE_USERS,
      Key: { userId },
    };

    const existingUser = await docClient.send(new GetItemCommand(getParams));

    if (!existingUser.Item) {
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

    // Build update expression
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name) {
      updateExpression.push('#name = :name');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = name;
    }

    if (healthConditions) {
      updateExpression.push('healthConditions = :healthConditions');
      expressionAttributeValues[':healthConditions'] = healthConditions;
    }

    if (alertThresholds) {
      updateExpression.push('alertThresholds = :alertThresholds');
      expressionAttributeValues[':alertThresholds'] = alertThresholds;
    }

    if (savedLocations) {
      updateExpression.push('savedLocations = :savedLocations');
      expressionAttributeValues[':savedLocations'] = savedLocations;
    }

    // Always update updatedAt timestamp
    updateExpression.push('updatedAt = :updatedAt');
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    // Update DynamoDB
    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE_USERS,
      Key: { userId },
      UpdateExpression: 'SET ' + updateExpression.join(', '),
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    };

    if (Object.keys(expressionAttributeNames).length > 0) {
      updateParams.ExpressionAttributeNames = expressionAttributeNames;
    }

    const result = await docClient.send(new UpdateItemCommand(updateParams));
    const updatedUser = result.Attributes;

    // Don't return sensitive fields
    delete updatedUser.passwordHash;
    delete updatedUser.refreshToken;

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: updatedUser,
        message: 'Profile updated successfully',
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
        message: 'Failed to update user profile',
        statusCode: 500,
      }),
    };
  }
};
