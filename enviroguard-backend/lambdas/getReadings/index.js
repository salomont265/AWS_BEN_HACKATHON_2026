/**
 * Lambda: getReadings
 *
 * GET /readings/{station_id}
 * Returns the most recent sensor readings for a station
 *
 * Query Parameters:
 *   - hours: Number of hours of historical data (default: 1, max: 24)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const stationId = event.pathParameters?.station_id;
    const queryParams = event.queryStringParameters || {};
    const hours = Math.min(parseInt(queryParams.hours || '1'), 24);

    // Validate station_id
    if (!stationId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'station_id path parameter is required',
          statusCode: 400,
        }),
      };
    }

    // Calculate time range
    const now = new Date();
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);

    // Query DynamoDB
    const queryParams = {
      TableName: process.env.DYNAMODB_TABLE_READINGS,
      KeyConditionExpression: 'stationId = :stationId AND #ts >= :startTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':stationId': stationId,
        ':startTime': startTime.toISOString(),
      },
      ScanIndexForward: false, // Sort descending (newest first)
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    const readings = result.Items || [];

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: readings,
        count: readings.length,
        stationId: stationId,
        timeRange: {
          start: startTime.toISOString(),
          end: now.toISOString(),
          hours: hours,
        },
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
        message: 'Failed to retrieve sensor readings',
        statusCode: 500,
      }),
    };
  }
};
