/**
 * Lambda: getPredictions
 *
 * POST /predict
 * Returns 24-hour environmental predictions by calling ML backend
 *
 * Integrates with: enviroguard-ml Prophet models
 * Models: Noise (96.7%), Pollen (85.8%), Litter (78.8%), AQI (59.2%)
 */

const https = require('https');
const http = require('http');

/**
 * Call ML backend API
 */
async function callMLAPI(url, data, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const postData = JSON.stringify(data);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout,
    };

    const req = protocol.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse ML API response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`ML API request failed: ${error.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('ML API request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const {
      stationId,
      metrics = ['noise', 'pollen', 'litter', 'aqi'],
      hoursAhead = 24,
      environmentalContext = {},
    } = body;

    // Validate required fields
    if (!stationId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'BadRequest',
          message: 'stationId is required',
          statusCode: 400,
        }),
      };
    }

    // Prepare ML API request
    const mlApiUrl = `${process.env.ML_API_URL}/predict`;
    const mlRequestData = {
      hours_ahead: hoursAhead,
      temperature: environmentalContext.temperature || 72,
      humidity: environmentalContext.humidity || 60,
      wind_speed: environmentalContext.windSpeed || 8,
      complaint_count: 3, // Default
      grass_pollen: environmentalContext.grassPollen || 25,
      tree_pollen: environmentalContext.treePollen || 15,
      weed_pollen: environmentalContext.weedPollen || 5,
    };

    console.log('Calling ML API:', mlApiUrl);
    console.log('ML Request:', mlRequestData);

    // Call ML backend
    let predictions;
    try {
      predictions = await callMLAPI(
        mlApiUrl,
        mlRequestData,
        parseInt(process.env.ML_API_TIMEOUT || '10000')
      );
    } catch (mlError) {
      console.error('ML API Error:', mlError);

      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'ServiceUnavailable',
          message: 'ML backend is currently unavailable. Please try again later.',
          statusCode: 503,
          details: mlError.message,
        }),
      };
    }

    // Format response
    const response = {
      stationId,
      generatedAt: new Date().toISOString(),
      predictions: {
        noise: predictions.noise || null,
        pollen: predictions.pollen || null,
        litter: predictions.litter || null,
        aqi: predictions.aqi || null,
      },
      compositeRisk: predictions.compositeRisk || {
        score: 0,
        level: 'low',
        primaryConcern: 'none',
      },
    };

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      },
      body: JSON.stringify({
        data: response,
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
        message: 'Failed to generate predictions',
        statusCode: 500,
      }),
    };
  }
};
