/**
 * Lambda: getStations
 *
 * GET /stations
 * Returns all active sensor stations for map display
 *
 * Query Parameters:
 *   - bbox: Bounding box filter (minLat,minLng,maxLat,maxLng)
 *   - status: Filter by status (active, inactive, maintenance)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    const queryParams = event.queryStringParameters || {};
    const { bbox, status } = queryParams;

    // Build scan parameters
    const scanParams = {
      TableName: process.env.DYNAMODB_TABLE_STATIONS,
    };

    // Add filter expression if status provided
    if (status) {
      scanParams.FilterExpression = '#status = :status';
      scanParams.ExpressionAttributeNames = { '#status': 'status' };
      scanParams.ExpressionAttributeValues = { ':status': status };
    }

    // Execute scan
    const result = await docClient.send(new ScanCommand(scanParams));
    let stations = result.Items || [];

    // Apply bounding box filter if provided
    if (bbox) {
      const [minLat, minLng, maxLat, maxLng] = bbox.split(',').map(Number);
      stations = stations.filter(station => {
        const lat = station.location.latitude;
        const lng = station.location.longitude;
        return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
      });
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: stations,
        count: stations.length,
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
        message: 'Failed to retrieve stations',
        statusCode: 500,
      }),
    };
  }
};
