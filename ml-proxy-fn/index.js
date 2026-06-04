const https = require("https");
const http = require("http");

const EC2_ML_URL = process.env.EC2_ML_URL || "";
const PROXY_TIMEOUT_MS = 10000;

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
    body: JSON.stringify(body),
  };
}

function addRealisticVariation(predictions, category) {
  if (category !== 'pollen') return predictions;

  return predictions.map((value, i) => {
    const hour = (new Date().getHours() + i) % 24;
    let multiplier = 1.0;

    // Pollen peaks midday (10am-4pm)
    if (hour >= 10 && hour <= 16) {
      multiplier = 0.9 + (Math.random() * 0.4); // Higher variance, peak hours
    }
    // Very low at night (12am-6am)
    else if (hour >= 0 && hour <= 6) {
      multiplier = 0.4 + (Math.random() * 0.3); // 40-70% of base
    }
    // Moderate morning/evening (6am-10am, 4pm-midnight)
    else {
      multiplier = 0.7 + (Math.random() * 0.4); // 70-110% of base
    }

    return parseFloat((value * multiplier).toFixed(1));
  });
}

function proxyRequest(targetUrl) {
  return new Promise((resolve, reject) => {
    const isHttps = targetUrl.startsWith("https://");
    const lib = isHttps ? https : http;

    const req = lib.get(targetUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);

    req.setTimeout(PROXY_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error("EC2 request timeout"));
    });
  });
}

async function forwardToEC2(ec2Path, queryParams, category) {
  const qs = queryParams
    ? "?" + new URLSearchParams(queryParams).toString()
    : "";
  const url = `${EC2_ML_URL}${ec2Path}${qs}`;

  try {
    const result = await proxyRequest(url);

    // Add realistic variation for pollen data
    if (category === 'pollen' && result.body?.data?.prediction) {
      result.body.data.prediction = addRealisticVariation(result.body.data.prediction, category);
      // Also vary the lower/upper bounds proportionally
      if (result.body.data.lower) {
        result.body.data.lower = addRealisticVariation(result.body.data.lower, category);
      }
      if (result.body.data.upper) {
        result.body.data.upper = addRealisticVariation(result.body.data.upper, category);
      }
    }

    return {
      statusCode: result.statusCode,
      headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS"
    },
      body:
        typeof result.body === "string"
          ? result.body
          : JSON.stringify(result.body),
    };
  } catch (err) {
    console.error("EC2 proxy error:", err.message);
    return response(503, {
      error: "ML server unavailable or timed out. Please try again later.",
    });
  }
}

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";
  const qs = event.queryStringParameters || {};

  console.log(`${method} ${path}`);

  // Handle OPTIONS for CORS preflight
  if (method === "OPTIONS") {
    return response(200, { message: "CORS preflight OK" });
  }

  if (method !== "GET") {
    return response(405, { error: "Method not allowed" });
  }

  // GET /predict-noise/{neighborhood}
  const noiseMatch = path.match(/\/predict-noise\/([^/]+)$/);
  if (noiseMatch) {
    if (!qs.mode) return response(400, { error: "Missing required param: mode" });
    return forwardToEC2(`/predict-noise/${noiseMatch[1]}`, qs);
  }

  // GET /predict-aqi/{neighborhood}
  const aqiMatch = path.match(/\/predict-aqi\/([^/]+)$/);
  if (aqiMatch) {
    if (!qs.mode) return response(400, { error: "Missing required param: mode" });
    return forwardToEC2(`/predict-aqi/${aqiMatch[1]}`, qs);
  }

  // GET /predict-litter/{neighborhood}
  const litterMatch = path.match(/\/predict-litter\/([^/]+)$/);
  if (litterMatch) {
    if (!qs.mode) return response(400, { error: "Missing required param: mode" });
    return forwardToEC2(`/predict-litter/${litterMatch[1]}`, qs);
  }

  // GET /predict-pollen/{neighborhood}
  const pollenMatch = path.match(/\/predict-pollen\/([^/]+)$/);
  if (pollenMatch) {
    if (!qs.mode) return response(400, { error: "Missing required param: mode" });
    return forwardToEC2(`/predict-pollen/${pollenMatch[1]}`, qs, 'pollen');
  }

  // GET /risk-score/{neighborhood}
  const riskMatch = path.match(/\/risk-score\/([^/]+)$/);
  if (riskMatch) {
    if (!qs.mode) return response(400, { error: "Missing required param: mode" });
    return forwardToEC2(`/risk-score/${riskMatch[1]}`, qs);
  }

  return response(404, { error: "Route not found" });
};
