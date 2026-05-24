const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");
const https = require("https");

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const CACHE_TTL_24H_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── helpers ────────────────────────────────────────────────────────────────

function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function isCacheFresh(item, ttlMs = CACHE_TTL_MS) {
  if (!item || !item.timestamp) return false;
  return Date.now() - new Date(item.timestamp).getTime() < ttlMs;
}

async function getCached(neighborhoodId, dataType) {
  try {
    const result = await ddb.send(
      new GetCommand({
        TableName: "env_readings",
        Key: { neighborhood_id: neighborhoodId, data_type: dataType },
      })
    );
    return result.Item || null;
  } catch {
    return null;
  }
}

async function putCache(neighborhoodId, dataType, data) {
  try {
    await ddb.send(
      new PutCommand({
        TableName: "env_readings",
        Item: {
          neighborhood_id: neighborhoodId,
          data_type: dataType,
          ...data,
          timestamp: new Date().toISOString(),
        },
      })
    );
  } catch (err) {
    console.error("Cache write failed:", err);
  }
}

function latLngToNeighborhoodId(lat, lng) {
  // Simple deterministic key from coords for cache lookup
  return `${parseFloat(lat).toFixed(3)}_${parseFloat(lng).toFixed(3)}`;
}

// ─── external API fetchers ────────────────────────────────────────────────

async function fetchAirQuality(lat, lng) {
  const airNowKey = process.env.AIRNOW_API_KEY;
  const owKey = process.env.OPENWEATHER_API_KEY;

  let aqiData = null;
  let owData = null;

  try {
    aqiData = await httpGet(
      `https://www.airnowapi.org/aq/observation/latLong/current/?latitude=${lat}&longitude=${lng}&distance=25&format=application/json&API_KEY=${airNowKey}`
    );
  } catch (err) {
    console.error("AirNow fetch failed:", err.message);
  }

  try {
    owData = await httpGet(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${owKey}`
    );
  } catch (err) {
    console.error("OpenWeather air_pollution fetch failed:", err.message);
  }

  if (!aqiData && !owData) return null;

  const aqi =
    aqiData && Array.isArray(aqiData) && aqiData[0]
      ? aqiData[0].AQI
      : owData?.list?.[0]?.main?.aqi * 20 || 0;
  const components = owData?.list?.[0]?.components || {};

  return {
    aqi,
    pm25: components.pm2_5 || 0,
    pm10: components.pm10 || 0,
    o3: components.o3 || 0,
    no2: components.no2 || 0,
    health_category:
      aqiData && Array.isArray(aqiData) && aqiData[0]
        ? aqiData[0].Category?.Name || "Unknown"
        : "Unknown",
    source: "AirNow+OpenWeather",
  };
}

async function fetchPollen(lat, lng) {
  const ambeeKey = process.env.AMBEE_API_KEY;
  try {
    const data = await httpGet(
      `https://api.getambee.com/pollen/v2/forecast/by-lat-lng?lat=${lat}&lng=${lng}`,
      { "x-api-key": ambeeKey }
    );
    const current = data?.data?.[0] || {};
    const grass = current.Count?.grass_pollen || 0;
    const tree = current.Count?.tree_pollen || 0;
    const weed = current.Count?.weed_pollen || 0;
    const total_index = Math.round((grass + tree + weed) / 3);
    const risk_level =
      total_index < 50 ? "low" : total_index < 150 ? "moderate" : "high";
    return { grass, tree, weed, total_index, risk_level };
  } catch (err) {
    console.error("Ambee fetch failed:", err.message);
    return null;
  }
}

async function fetchWeather(lat, lng) {
  const owKey = process.env.OPENWEATHER_API_KEY;
  try {
    const data = await httpGet(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${owKey}&exclude=minutely,alerts&units=imperial`
    );
    const current = data?.current || {};
    return {
      temp: current.temp || 0,
      humidity: current.humidity || 0,
      wind_speed: current.wind_speed || 0,
      uv_index: current.uvi || 0,
      description: current.weather?.[0]?.description || "Unknown",
    };
  } catch (err) {
    console.error("OpenWeather onecall fetch failed:", err.message);
    return null;
  }
}

async function fetchNoiseComplaints(neighborhood) {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  try {
    const data = await httpGet(
      `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=complaint_type='Noise' AND created_date>'${thirtyDaysAgo}'&$limit=5000`
    );
    if (!Array.isArray(data)) return null;
    return buildHourlyAggregation(data, neighborhood);
  } catch (err) {
    console.error("NYC 311 noise fetch failed:", err.message);
    return null;
  }
}

async function fetchLitterComplaints(neighborhood) {
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  try {
    const data = await httpGet(
      `https://data.cityofnewyork.us/resource/fhrw-4uyv.json?$where=complaint_type='Dirty Conditions' AND created_date>'${thirtyDaysAgo}'`
    );
    if (!Array.isArray(data)) return null;
    return buildHourlyAggregation(data, neighborhood);
  } catch (err) {
    console.error("NYC Sanitation fetch failed:", err.message);
    return null;
  }
}

function buildHourlyAggregation(records, neighborhood) {
  const hourBuckets = {};
  for (let h = 0; h < 24; h++) {
    const key = `${String(h).padStart(2, "0")}:00`;
    hourBuckets[key] = [];
  }
  records.forEach((r) => {
    if (r.created_date) {
      const hour = new Date(r.created_date).getHours();
      const key = `${String(hour).padStart(2, "0")}:00`;
      if (hourBuckets[key]) hourBuckets[key].push(r);
    }
  });
  const days = 30;
  const hourly = Object.entries(hourBuckets).map(([hour, recs]) => ({
    hour,
    avg_complaints: parseFloat((recs.length / days).toFixed(1)),
  }));
  return { neighborhood, period_days: days, hourly, total_complaints: records.length };
}

function computeCompositeScore(air, noise, pollen, litter, general) {
  return Math.round(
    (air || 0) * 0.3 +
      (noise || 0) * 0.25 +
      (pollen || 0) * 0.2 +
      (litter || 0) * 0.15 +
      (general || 0) * 0.1
  );
}

function severityLabel(score) {
  if (score >= 75) return "high";
  if (score >= 40) return "medium";
  return "low";
}

// ─── handlers ────────────────────────────────────────────────────────────────

// GET /map-data
async function mapData(event) {
  const { lat, lng, mode } = event.queryStringParameters || {};
  if (!lat || !lng || !mode) {
    return response(400, { error: "Missing required params: lat, lng, mode" });
  }

  const neighborhoodId = latLngToNeighborhoodId(lat, lng);

  // Check cache
  const cached = await getCached(neighborhoodId, "map-data");
  if (isCacheFresh(cached)) {
    return response(200, cached.payload);
  }

  let payload;

  if (mode === "community") {
    // Internally aggregate posts
    try {
      const postsResult = await ddb.send(
        new QueryCommand({
          TableName: "posts",
          IndexName: "neighborhood_id-index",
          KeyConditionExpression: "neighborhood_id = :nid",
          FilterExpression: "created_at > :cutoff",
          ExpressionAttributeValues: {
            ":nid": neighborhoodId,
            ":cutoff": new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
        })
      );
      const posts = postsResult.Items || [];
      payload = aggregatePostsToMapLayer(posts, neighborhoodId, mode);
    } catch (err) {
      console.error("Posts aggregation failed:", err);
      return response(500, { error: "Failed to aggregate community posts" });
    }
  } else if (mode === "api") {
    try {
      const [airData, pollenData, weatherData, noiseData, litterData] =
        await Promise.all([
          fetchAirQuality(lat, lng),
          fetchPollen(lat, lng),
          fetchWeather(lat, lng),
          fetchNoiseComplaints(neighborhoodId),
          fetchLitterComplaints(neighborhoodId),
        ]);

      const noiseIndex = noiseData
        ? Math.min(100, Math.round((noiseData.total_complaints / 30) * 5))
        : 0;
      const airIndex = airData ? Math.min(100, airData.aqi) : 0;
      const pollenIndex = pollenData ? Math.min(100, pollenData.total_index) : 0;
      const litterIndex = litterData
        ? Math.min(100, Math.round((litterData.total_complaints / 30) * 5))
        : 0;
      const generalIndex = 20;

      const composite = computeCompositeScore(
        airIndex,
        noiseIndex,
        pollenIndex,
        litterIndex,
        generalIndex
      );

      payload = {
        neighborhood_id: neighborhoodId,
        name: neighborhoodId,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        composite_score: composite,
        severity: severityLabel(composite),
        mode: "api",
        confidence: "high",
        last_updated: new Date().toISOString(),
        layers: {
          noise: {
            index: noiseIndex,
            complaint_count_24h: noiseData
              ? Math.round(noiseData.total_complaints / 30)
              : 0,
          },
          air: airData
            ? {
                aqi: airData.aqi,
                pm25: airData.pm25,
                o3: airData.o3,
                health_category: airData.health_category,
              }
            : { aqi: 0, pm25: 0, o3: 0, health_category: "Unknown" },
          litter: {
            complaint_count_24h: litterData
              ? Math.round(litterData.total_complaints / 30)
              : 0,
            avg_severity: 3,
          },
          pollen: pollenData
            ? {
                grass: pollenData.grass,
                tree: pollenData.tree,
                weed: pollenData.weed,
                total_index: pollenData.total_index,
              }
            : { grass: 0, tree: 0, weed: 0, total_index: 0 },
          general: { report_count_24h: 0 },
        },
      };

      await putCache(neighborhoodId, "map-data", { payload });
    } catch (err) {
      console.error("API map-data fetch failed:", err);
      if (cached) {
        return response(200, { ...cached.payload, stale: true });
      }
      return response(503, { error: "External API failure and no cache available" });
    }
  } else {
    return response(400, { error: "mode must be 'api' or 'community'" });
  }

  return response(200, payload);
}

function aggregatePostsToMapLayer(posts, neighborhoodId, mode) {
  const categories = ["noise", "air", "litter", "pollen", "general"];
  const layers = {};
  categories.forEach((cat) => {
    const catPosts = posts.filter((p) => p.category === cat);
    const avgSeverity =
      catPosts.length > 0
        ? catPosts.reduce((s, p) => s + (p.severity || 0), 0) / catPosts.length
        : 0;
    const index = Math.min(100, Math.round(avgSeverity * (catPosts.length / 5)));
    layers[cat] = {
      report_count: catPosts.length,
      avg_severity: parseFloat(avgSeverity.toFixed(1)),
      index,
    };
  });

  const minReports = Math.min(...categories.map((c) => layers[c].report_count));
  const maxReports = Math.max(...categories.map((c) => layers[c].report_count));
  const confidence =
    minReports < 3 ? "low" : maxReports >= 10 ? "high" : "medium";

  const composite = computeCompositeScore(
    layers.air.index,
    layers.noise.index,
    layers.pollen.index,
    layers.litter.index,
    layers.general.index
  );

  return {
    neighborhood_id: neighborhoodId,
    name: neighborhoodId,
    composite_score: composite,
    severity: severityLabel(composite),
    mode,
    confidence,
    last_updated: new Date().toISOString(),
    layers,
  };
}

// GET /air-quality
async function airQuality(event) {
  const { lat, lng } = event.queryStringParameters || {};
  if (!lat || !lng) {
    return response(400, { error: "Missing required params: lat, lng" });
  }

  const neighborhoodId = latLngToNeighborhoodId(lat, lng);
  const cached = await getCached(neighborhoodId, "air-quality");
  if (isCacheFresh(cached)) {
    return response(200, cached.payload);
  }

  const data = await fetchAirQuality(lat, lng);
  if (!data) {
    if (cached) {
      return response(200, { ...cached.payload, stale: true });
    }
    return response(503, {
      error: "Both AirNow and OpenWeather unavailable",
    });
  }

  const payload = { ...data, timestamp: new Date().toISOString() };
  await putCache(neighborhoodId, "air-quality", { payload });
  return response(200, payload);
}

// GET /pollen
async function pollen(event) {
  const { lat, lng } = event.queryStringParameters || {};
  if (!lat || !lng) {
    return response(400, { error: "Missing required params: lat, lng" });
  }

  const neighborhoodId = latLngToNeighborhoodId(lat, lng);
  const cached = await getCached(neighborhoodId, "pollen");
  if (isCacheFresh(cached)) {
    return response(200, cached.payload);
  }

  const data = await fetchPollen(lat, lng);
  if (!data) {
    if (cached) {
      return response(200, { ...cached.payload, stale: true });
    }
    return response(503, { error: "Ambee unavailable" });
  }

  const payload = { ...data, timestamp: new Date().toISOString() };
  await putCache(neighborhoodId, "pollen", { payload });
  return response(200, payload);
}

// GET /weather
async function weather(event) {
  const { lat, lng } = event.queryStringParameters || {};
  if (!lat || !lng) {
    return response(400, { error: "Missing required params: lat, lng" });
  }

  const neighborhoodId = latLngToNeighborhoodId(lat, lng);
  const cached = await getCached(neighborhoodId, "weather");
  if (isCacheFresh(cached)) {
    return response(200, cached.payload);
  }

  const data = await fetchWeather(lat, lng);
  if (!data) {
    if (cached) {
      return response(200, { ...cached.payload, stale: true });
    }
    return response(503, { error: "OpenWeather unavailable" });
  }

  const payload = { ...data, timestamp: new Date().toISOString() };
  await putCache(neighborhoodId, "weather", { payload });
  return response(200, payload);
}

// GET /noise-history
async function noiseHistory(event) {
  const { neighborhood } = event.queryStringParameters || {};
  if (!neighborhood) {
    return response(400, { error: "Missing required param: neighborhood" });
  }

  const cached = await getCached(neighborhood, "noise-history");
  if (isCacheFresh(cached, CACHE_TTL_24H_MS)) {
    return response(200, cached.payload);
  }

  const data = await fetchNoiseComplaints(neighborhood);
  if (!data) {
    if (cached) {
      return response(200, { ...cached.payload, stale: true });
    }
    return response(503, { error: "311 API unavailable" });
  }

  await putCache(neighborhood, "noise-history", { payload: data });
  return response(200, data);
}

// GET /litter-history
async function litterHistory(event) {
  const { neighborhood } = event.queryStringParameters || {};
  if (!neighborhood) {
    return response(400, { error: "Missing required param: neighborhood" });
  }

  const cached = await getCached(neighborhood, "litter-history");
  if (isCacheFresh(cached, CACHE_TTL_24H_MS)) {
    return response(200, cached.payload);
  }

  const data = await fetchLitterComplaints(neighborhood);
  if (!data) {
    if (cached) {
      return response(200, { ...cached.payload, stale: true });
    }
    return response(503, { error: "NYC Open Data unavailable" });
  }

  await putCache(neighborhood, "litter-history", { payload: data });
  return response(200, data);
}

// ─── router ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const path = event.path || event.rawPath || "";
  const method = event.httpMethod || event.requestContext?.http?.method || "GET";

  console.log(`${method} ${path}`);

  if (method === "GET") {
    if (path.endsWith("/map-data")) return mapData(event);
    if (path.endsWith("/air-quality")) return airQuality(event);
    if (path.endsWith("/pollen")) return pollen(event);
    if (path.endsWith("/weather")) return weather(event);
    if (path.endsWith("/noise-history")) return noiseHistory(event);
    if (path.endsWith("/litter-history")) return litterHistory(event);
  }

  return response(404, { error: "Route not found" });
};